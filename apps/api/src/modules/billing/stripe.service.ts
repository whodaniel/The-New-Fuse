import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '@the-new-fuse/database/drizzle';
import fetch from 'node-fetch';

type SubscriptionStatus = 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED' | 'PENDING';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService
  ) {}

  async recordSubscription(
    userId: string,
    payload: {
      subscriptionId: string;
      customerId?: string;
      priceId?: string;
      status?: string;
      currentPeriodStart?: number | string | Date;
      currentPeriodEnd?: number | string | Date;
      cancelAtPeriodEnd?: boolean;
      tier?: 'STARTER' | 'PRO' | 'ENTERPRISE';
    }
  ): Promise<void> {
    const status = this.mapStripeStatus(payload.status);
    const tier = payload.tier || 'PRO';
    const currentPeriodStart = this.toDate(payload.currentPeriodStart) || new Date();
    const currentPeriodEnd =
      this.toDate(payload.currentPeriodEnd) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const esc = (value: string) => value.replace(/'/g, "''");
    await this.db.executeRaw(`
      INSERT INTO stripe_subscriptions (
        user_id,
        stripe_customer_id,
        stripe_subscription_id,
        stripe_price_id,
        status,
        tier,
        current_period_start,
        current_period_end,
        cancel_at_period_end
      ) VALUES (
        '${esc(String(userId))}',
        ${payload.customerId ? `'${esc(String(payload.customerId))}'` : 'NULL'},
        '${esc(String(payload.subscriptionId))}',
        ${payload.priceId ? `'${esc(String(payload.priceId))}'` : 'NULL'},
        '${status}',
        '${tier}',
        '${currentPeriodStart.toISOString()}',
        '${currentPeriodEnd.toISOString()}',
        ${Boolean(payload.cancelAtPeriodEnd)}
      )
      ON CONFLICT (stripe_subscription_id)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        stripe_customer_id = EXCLUDED.stripe_customer_id,
        stripe_price_id = EXCLUDED.stripe_price_id,
        status = EXCLUDED.status,
        tier = EXCLUDED.tier,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        cancel_at_period_end = EXCLUDED.cancel_at_period_end,
        updated_at = NOW()
    `);
  }

  async updateSubscriptionByStripeId(subscriptionId: string, status: string): Promise<void> {
    const mapped = this.mapStripeStatus(status);
    const esc = (value: string) => value.replace(/'/g, "''");
    await this.db.executeRaw(`
      UPDATE stripe_subscriptions
      SET status = '${mapped}', updated_at = NOW()
      WHERE stripe_subscription_id = '${esc(String(subscriptionId))}'
    `);
  }

  async handleWebhookEvent(event: any): Promise<void> {
    const eventType = event?.type;
    const object = event?.data?.object || {};

    switch (eventType) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        await this.recordSubscription(this.resolveUserId(object), {
          subscriptionId: String(object.id || ''),
          customerId: object.customer ? String(object.customer) : undefined,
          priceId: object.items?.data?.[0]?.price?.id,
          status: object.status,
          currentPeriodStart: object.current_period_start,
          currentPeriodEnd: object.current_period_end,
          cancelAtPeriodEnd: Boolean(object.cancel_at_period_end),
          tier: 'PRO',
        });
        break;
      }
      case 'customer.subscription.deleted': {
        if (object?.id) {
          await this.updateSubscriptionByStripeId(String(object.id), 'canceled');
        }
        break;
      }
      default:
        this.logger.debug(`Unhandled Stripe event type: ${String(eventType)}`);
    }
  }

  async createCheckoutSession(input: {
    userId: string;
    userEmail?: string;
    priceId?: string;
    successUrl?: string;
    cancelUrl?: string;
    mode?: 'subscription' | 'payment';
  }): Promise<{ id: string; url: string; provider: 'stripe' }> {
    const secretKey = String(this.configService.get<string>('STRIPE_SECRET_KEY') || '').trim();
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    const configuredPriceId = String(
      this.configService.get<string>('STRIPE_MEMBERSHIP_PRICE_ID') || ''
    ).trim();
    const priceId = (input.priceId || configuredPriceId || '').trim();
    if (!priceId) {
      throw new Error('Stripe price id is required');
    }

    const frontendBase = String(
      this.configService.get<string>('FRONTEND_URL') || 'https://thenewfuse.com'
    ).replace(/\/$/, '');
    const successUrl = input.successUrl || `${frontendBase}/membership?checkout=success`;
    const cancelUrl = input.cancelUrl || `${frontendBase}/membership?checkout=cancel`;

    const mode = input.mode || 'subscription';
    const params = new URLSearchParams();
    params.set('mode', mode);
    params.set('line_items[0][price]', priceId);
    params.set('line_items[0][quantity]', '1');
    params.set('success_url', successUrl);
    params.set('cancel_url', cancelUrl);
    params.set('client_reference_id', input.userId);
    params.set('metadata[userId]', input.userId);
    if (input.userEmail) params.set('customer_email', input.userEmail);
    if (mode === 'subscription') {
      // Ensure subscription object itself carries deterministic user mapping.
      params.set('subscription_data[metadata][userId]', input.userId);
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const payload: any = await response.json();
    if (!response.ok) {
      this.logger.error(`Stripe checkout session error: ${JSON.stringify(payload)}`);
      throw new Error('Failed to create Stripe checkout session');
    }

    return {
      id: String(payload.id),
      url: String(payload.url || ''),
      provider: 'stripe',
    };
  }

  private resolveUserId(object: any): string {
    // Primary source: metadata.userId attached during checkout/session creation.
    const metadataUserId = object?.metadata?.userId;
    if (metadataUserId) return String(metadataUserId);

    // Fallback to customer id keyed lookup can be added here.
    // For now, enforce explicit metadata path for deterministic linkage.
    throw new Error('Stripe webhook object missing metadata.userId');
  }

  private mapStripeStatus(status?: string): SubscriptionStatus {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'active' || normalized === 'trialing') return 'ACTIVE';
    if (normalized === 'canceled') return 'CANCELLED';
    if (normalized === 'incomplete_expired') return 'EXPIRED';
    if (normalized === 'past_due' || normalized === 'unpaid' || normalized === 'paused') {
      return 'SUSPENDED';
    }
    return 'PENDING';
  }

  private toDate(value: number | string | Date | undefined): Date | null {
    if (value === undefined || value === null) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'number') {
      // Stripe period fields are unix seconds.
      return new Date(value * 1000);
    }

    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
