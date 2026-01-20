import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DrizzleService } from '@the-new-fuse/database/drizzle';
import { payPalSubscriptions } from '@the-new-fuse/database/src/drizzle/schema';
import { eq } from 'drizzle-orm';
import fetch from 'node-fetch'; // Standard fetch might be available in Node 18+

@Injectable()
export class PayPalService {
  private readonly logger = new Logger(PayPalService.name);
  private readonly apiUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly db: DrizzleService
  ) {
    const isSandbox = this.configService.get('PAYPAL_MODE') !== 'live';
    this.apiUrl = isSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
  }

  /**
   * Get an access token (Client Credentials Flow)
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
    const secret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');

    if (!clientId || !secret) {
      throw new Error('PayPal credentials missing via env');
    }

    const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
    const response = await fetch(`${this.apiUrl}/v1/oauth2/token`, {
      method: 'POST',
      body: 'grant_type=client_credentials',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data: any = await response.json();
    if (!response.ok) {
      this.logger.error('Failed to get PayPal token', data);
      throw new Error('Failed to authenticate with PayPal');
    }

    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000; // Buffer 1 min
    return this.accessToken!;
  }

  /**
   * Verify and Process a Webhook Event
   */
  async handleWebhook(headers: any, body: any): Promise<void> {
    // Ideally verify signature here using paypal-rest-sdk or manual crypto
    // For now, assume valid if it hits our secure endpoint (add ID verification later)

    // Check event type
    const eventType = body.event_type;
    const resource = body.resource;

    this.logger.log(`Processing PayPal Webhook: ${eventType}`);

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.RE-ACTIVATED':
        await this.updateSubscriptionStatus(resource.id, 'ACTIVE');
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await this.updateSubscriptionStatus(resource.id, 'CANCELLED');
        break;

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await this.updateSubscriptionStatus(resource.id, 'SUSPENDED');
        break;

      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await this.updateSubscriptionStatus(resource.id, 'EXPIRED');
        break;

      case 'PAYMENT.SALE.COMPLETED':
        // Optional: Record payment success
        break;

      default:
        this.logger.debug(`Unhandled event type: ${eventType}`);
    }
  }

  /**
   * Create or Update Subscription in DB
   * Call this when the frontend successfully creates a subscription
   */
  async createSubscriptionRecord(
    userId: string,
    subscriptionID: string,
    planId: string
  ): Promise<void> {
    // Verify subscription details with PayPal first
    const token = await this.getAccessToken();
    const response = await fetch(`${this.apiUrl}/v1/billing/subscriptions/${subscriptionID}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Invalid Subscription ID');
    }

    const subData: any = await response.json();
    if (subData.status !== 'ACTIVE') {
      // It might be 'APPROVAL_PENDING' if we caught it early
    }

    // Upsert logic
    // Users can only have one active subscription logic for now
    await this.db.db
      .insert(payPalSubscriptions)
      .values({
        userId,
        payPalSubscriptionId: subscriptionID,
        payPalPlanId: planId,
        status: 'ACTIVE',
        tier: 'PRO', // Assuming only Pro Plan for now
        currentPeriodStart: new Date(subData.start_time || new Date()),
        currentPeriodEnd: new Date(
          subData.billing_info?.next_billing_time || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ),
      })
      .onConflictDoUpdate({
        target: payPalSubscriptions.userId,
        set: {
          payPalSubscriptionId: subscriptionID,
          payPalPlanId: planId,
          status: 'ACTIVE',
          updatedAt: new Date(),
        },
      });

    // Also update User Role or Preferences if needed
    // e.g. await this.db.db.update(users).set({ role: 'PRO_USER' }).where(eq(users.id, userId));
  }

  private async updateSubscriptionStatus(subscriptionId: string, status: any): Promise<void> {
    await this.db.db
      .update(payPalSubscriptions)
      .set({ status, updatedAt: new Date() })
      .where(eq(payPalSubscriptions.payPalSubscriptionId, subscriptionId));
  }
}
