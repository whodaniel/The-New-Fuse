import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Stripe } from 'stripe';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';

interface CreateCheckoutDto {
  priceId: string;
  userId: string;
  userEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  mode?: 'subscription' | 'payment';
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured. Payments cannot be processed.');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-04-10',
    });
  }

  async createCheckoutSession(dto: CreateCheckoutDto) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: (dto.mode as Stripe.Checkout.SessionCreateParams.Mode) || 'subscription',
        line_items: [
          {
            price: dto.priceId,
            quantity: 1,
          },
        ],
        success_url:
          dto.successUrl ||
          `${this.configService.get('FRONTEND_URL')}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: dto.cancelUrl || `${this.configService.get('FRONTEND_URL')}/cancel`,
        client_reference_id: dto.userId,
        customer_email: dto.userEmail,
        metadata: {
          userId: dto.userId,
          priceId: dto.priceId,
        },
        subscription_data: {
          metadata: {
            userId: dto.userId,
          },
        },
      });

      return {
        id: session.id,
        url: session.url,
        status: session.status,
      };
    } catch (error) {
      this.logger.error('Failed to create Stripe checkout session:', error.message);
      throw new BadRequestException('Failed to create checkout session');
    }
  }

  async handleWebhookEvent(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);

      this.logger.log(`Processing Stripe webhook: ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        default:
          this.logger.warn(`Unhandled Stripe event: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Webhook verification failed:', error.message);
      throw new BadRequestException('Webhook verification failed');
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    if (session.mode === 'subscription' && session.subscription) {
      const subscription = await this.stripe.subscriptions.retrieve(session.subscription as string);
      await this.syncSubscription(subscription, session.client_reference_id);
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    await this.syncSubscription(subscription);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    await this.updateSubscriptionStatus(subscription.id, SubscriptionStatus.CANCELLED);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    if (invoice.subscription) {
      await this.updateSubscriptionStatus(
        invoice.subscription as string,
        SubscriptionStatus.PAST_DUE
      );
    }
  }

  private async syncSubscription(stripeSubscription: Stripe.Subscription, userId?: string) {
    const existing = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    const subscriptionData = {
      userId: userId || existing?.userId || 'unknown',
      stripeCustomerId: stripeSubscription.customer as string,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: stripeSubscription.items.data[0]?.price.id,
      status: this.mapStripeStatus(stripeSubscription.status),
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    };

    if (existing) {
      await this.subscriptionRepository.update(existing.id, subscriptionData);
    } else {
      const newSubscription = this.subscriptionRepository.create(subscriptionData);
      await this.subscriptionRepository.save(newSubscription);
    }
  }

  private async updateSubscriptionStatus(stripeSubscriptionId: string, status: SubscriptionStatus) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    subscription.status = status;
    await this.subscriptionRepository.save(subscription);
  }

  private mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      unpaid: SubscriptionStatus.UNPAID,
      canceled: SubscriptionStatus.CANCELLED,
      incomplete: SubscriptionStatus.INCOMPLETE,
      incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
      trialing: SubscriptionStatus.TRIALING,
    };

    return statusMap[status] || SubscriptionStatus.INACTIVE;
  }
}
