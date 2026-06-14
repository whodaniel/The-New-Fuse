"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var StripeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const drizzle_1 = require("@the-new-fuse/database/drizzle");
const node_fetch_1 = __importDefault(require("node-fetch"));
let StripeService = StripeService_1 = class StripeService {
    constructor(db, configService) {
        this.db = db;
        this.configService = configService;
        this.logger = new common_1.Logger(StripeService_1.name);
    }
    async recordSubscription(userId, payload) {
        const status = this.mapStripeStatus(payload.status);
        const tier = payload.tier || 'PRO';
        const currentPeriodStart = this.toDate(payload.currentPeriodStart) || new Date();
        const currentPeriodEnd = this.toDate(payload.currentPeriodEnd) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const esc = (value) => value.replace(/'/g, "''");
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
    async updateSubscriptionByStripeId(subscriptionId, status) {
        const mapped = this.mapStripeStatus(status);
        const esc = (value) => value.replace(/'/g, "''");
        await this.db.executeRaw(`
      UPDATE stripe_subscriptions
      SET status = '${mapped}', updated_at = NOW()
      WHERE stripe_subscription_id = '${esc(String(subscriptionId))}'
    `);
    }
    async handleWebhookEvent(event) {
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
    async createCheckoutSession(input) {
        const secretKey = String(this.configService.get('STRIPE_SECRET_KEY') || '').trim();
        if (!secretKey) {
            throw new Error('STRIPE_SECRET_KEY is not configured');
        }
        const configuredPriceId = String(this.configService.get('STRIPE_MEMBERSHIP_PRICE_ID') || '').trim();
        const priceId = (input.priceId || configuredPriceId || '').trim();
        if (!priceId) {
            throw new Error('Stripe price id is required');
        }
        const frontendBase = String(this.configService.get('FRONTEND_URL') || 'https://thenewfuse.com').replace(/\/$/, '');
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
        if (input.userEmail)
            params.set('customer_email', input.userEmail);
        if (mode === 'subscription') {
            // Ensure subscription object itself carries deterministic user mapping.
            params.set('subscription_data[metadata][userId]', input.userId);
        }
        const response = await (0, node_fetch_1.default)('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });
        const payload = await response.json();
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
    resolveUserId(object) {
        // Primary source: metadata.userId attached during checkout/session creation.
        const metadataUserId = object?.metadata?.userId;
        if (metadataUserId)
            return String(metadataUserId);
        // Fallback to customer id keyed lookup can be added here.
        // For now, enforce explicit metadata path for deterministic linkage.
        throw new Error('Stripe webhook object missing metadata.userId');
    }
    mapStripeStatus(status) {
        const normalized = String(status || '').toLowerCase();
        if (normalized === 'active' || normalized === 'trialing')
            return 'ACTIVE';
        if (normalized === 'canceled')
            return 'CANCELLED';
        if (normalized === 'incomplete_expired')
            return 'EXPIRED';
        if (normalized === 'past_due' || normalized === 'unpaid' || normalized === 'paused') {
            return 'SUSPENDED';
        }
        return 'PENDING';
    }
    toDate(value) {
        if (value === undefined || value === null)
            return null;
        if (value instanceof Date)
            return value;
        if (typeof value === 'number') {
            // Stripe period fields are unix seconds.
            return new Date(value * 1000);
        }
        const parsed = new Date(String(value));
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
};
exports.StripeService = StripeService;
exports.StripeService = StripeService = StripeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_1.DatabaseService,
        config_1.ConfigService])
], StripeService);
//# sourceMappingURL=stripe.service.js.map