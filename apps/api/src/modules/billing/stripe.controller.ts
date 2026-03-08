import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Logger,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import * as crypto from 'crypto';
import { StripeService } from './stripe.service';

@Controller('billing/stripe')
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService
  ) {}

  @Post('webhook')
  async handleWebhook(@Headers() headers: any, @Body() body: any, @Req() req: any) {
    const signature = String(headers['stripe-signature'] || '').trim();
    const rawBody = req?.rawBody;
    const payload =
      typeof rawBody === 'string'
        ? rawBody
        : rawBody instanceof Buffer
          ? rawBody.toString('utf8')
          : JSON.stringify(body);

    if (!this.verifyStripeSignature(payload, signature)) {
      this.logger.warn('Invalid Stripe webhook signature - rejecting');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    await this.stripeService.handleWebhookEvent(body);
    return { received: true };
  }

  @Post('subscribe')
  @UseGuards(AuthGuard('jwt'))
  async recordSubscription(
    @Body()
    body: {
      subscriptionId: string;
      customerId?: string;
      priceId?: string;
      status?: string;
      currentPeriodStart?: number | string | Date;
      currentPeriodEnd?: number | string | Date;
      cancelAtPeriodEnd?: boolean;
    },
    @Req() req: any
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    await this.stripeService.recordSubscription(userId, {
      ...body,
      tier: 'PRO',
    });

    return { success: true };
  }

  @Post('checkout-session')
  @UseGuards(AuthGuard('jwt'))
  async createCheckoutSession(
    @Body()
    body: {
      priceId?: string;
      successUrl?: string;
      cancelUrl?: string;
      mode?: 'subscription' | 'payment';
    },
    @Req() req: any
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userEmail = req.user?.email ? String(req.user.email) : undefined;
    const session = await this.stripeService.createCheckoutSession({
      userId: String(userId),
      userEmail,
      priceId: body?.priceId,
      successUrl: body?.successUrl,
      cancelUrl: body?.cancelUrl,
      mode: body?.mode || 'subscription',
    });

    if (!session?.url) {
      throw new BadRequestException('Failed to create checkout session');
    }

    return session;
  }

  private verifyStripeSignature(payload: string, stripeSignature: string): boolean {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET is not configured');
      return false;
    }
    if (!stripeSignature) return false;

    const fields = stripeSignature.split(',').reduce<Record<string, string>>((acc, part) => {
      const [k, v] = part.split('=', 2);
      if (k && v) acc[k] = v;
      return acc;
    }, {});

    const timestamp = fields.t;
    const v1 = fields.v1;
    if (!timestamp || !v1) return false;

    const toleranceSeconds = 300;
    const age = Math.floor(Date.now() / 1000) - Number(timestamp);
    if (!Number.isFinite(age) || Math.abs(age) > toleranceSeconds) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const expected = crypto.createHmac('sha256', webhookSecret).update(signedPayload).digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
    } catch {
      return false;
    }
  }
}
