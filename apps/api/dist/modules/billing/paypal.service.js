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
var PayPalService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayPalService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
// @ts-ignore
const drizzle_1 = require("@the-new-fuse/database/drizzle");
const schema_1 = require("@the-new-fuse/database/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const node_fetch_1 = __importDefault(require("node-fetch")); // Standard fetch might be available in Node 18+
let PayPalService = PayPalService_1 = class PayPalService {
    constructor(configService, db) {
        this.configService = configService;
        this.db = db;
        this.logger = new common_1.Logger(PayPalService_1.name);
        this.accessToken = null;
        this.tokenExpiry = 0;
        this.membershipOverrideRoles = new Set([
            'MEMBERSHIP_OVERRIDE',
            'PAID_OVERRIDE',
            'PRO_OVERRIDE',
        ]);
        const isSandbox = this.configService.get('PAYPAL_MODE') !== 'live';
        this.apiUrl = isSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
    }
    /**
     * Get an access token (Client Credentials Flow)
     */
    async getAccessToken() {
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }
        const clientId = this.configService.get('PAYPAL_CLIENT_ID');
        const secret = this.configService.get('PAYPAL_CLIENT_SECRET');
        if (!clientId || !secret) {
            throw new Error('PayPal credentials missing via env');
        }
        const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
        const response = await (0, node_fetch_1.default)(`${this.apiUrl}/v1/oauth2/token`, {
            method: 'POST',
            body: 'grant_type=client_credentials',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        const data = await response.json();
        if (!response.ok) {
            this.logger.error('Failed to get PayPal token', data);
            throw new Error('Failed to authenticate with PayPal');
        }
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000; // Buffer 1 min
        return this.accessToken;
    }
    /**
     * Verify and Process a Webhook Event
     */
    async handleWebhook(headers, body) {
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
    async createSubscriptionRecord(userId, subscriptionID, planId) {
        // Verify subscription details with PayPal first
        const token = await this.getAccessToken();
        const safeSubscriptionId = encodeURIComponent(subscriptionID);
        const response = await (0, node_fetch_1.default)(`${this.apiUrl}/v1/billing/subscriptions/${safeSubscriptionId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
            throw new Error('Invalid Subscription ID');
        }
        const subData = await response.json();
        if (subData.status !== 'ACTIVE') {
            // It might be 'APPROVAL_PENDING' if we caught it early
        }
        // Upsert logic
        // Users can only have one active subscription logic for now
        await this.db.client
            .insert(schema_1.payPalSubscriptions)
            .values({
            userId,
            payPalSubscriptionId: subscriptionID,
            payPalPlanId: planId,
            status: 'ACTIVE',
            tier: 'PRO', // Assuming only Pro Plan for now
            currentPeriodStart: new Date(subData.start_time || new Date()),
            currentPeriodEnd: new Date(subData.billing_info?.next_billing_time || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        })
            .onConflictDoUpdate({
            target: schema_1.payPalSubscriptions.userId,
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
    async updateSubscriptionStatus(subscriptionId, status) {
        const client = this.db.client;
        await client
            .update(schema_1.payPalSubscriptions)
            .set({ status, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.payPalSubscriptions.payPalSubscriptionId, subscriptionId));
    }
    /**
     * Get the current tier for a user
     */
    async getUserTier(userId) {
        const [paypalTier, stripeTier] = await Promise.all([
            this.getPayPalTier(userId),
            this.getStripeTier(userId),
        ]);
        return this.maxTier(paypalTier, stripeTier);
    }
    maxTier(a, b) {
        const rank = { STARTER: 0, PRO: 1, ENTERPRISE: 2 };
        return rank[a] >= rank[b] ? a : b;
    }
    normalizeTier(value) {
        const normalized = String(value || '')
            .trim()
            .toUpperCase();
        if (normalized === 'PRO' || normalized === 'STARTER' || normalized === 'ENTERPRISE') {
            return normalized;
        }
        return null;
    }
    escapeSqlLiteral(value) {
        return String(value).replace(/'/g, "''");
    }
    async getActiveMembershipOverride(userId) {
        try {
            const rows = await this.db.executeRaw(`SELECT id, tier, status, expires_at
         FROM membership_overrides
         WHERE user_id = '${this.escapeSqlLiteral(userId)}'
           AND status = 'ACTIVE'
         ORDER BY created_at DESC
         LIMIT 1`);
            const override = rows?.[0];
            if (!override)
                return null;
            const expiresAt = override.expires_at ? new Date(override.expires_at).getTime() : null;
            if (expiresAt && expiresAt <= Date.now()) {
                await this.db.executeRaw(`UPDATE membership_overrides
           SET status = 'EXPIRED', updated_at = now()
           WHERE id = '${this.escapeSqlLiteral(override.id)}'`);
                return null;
            }
            const tier = this.normalizeTier(override.tier);
            if (!tier)
                return null;
            return { tier };
        }
        catch (error) {
            this.logger.warn(`Membership override lookup failed for user ${userId}: ${String(error)}`);
            return null;
        }
    }
    async getPayPalTier(userId) {
        try {
            const client = this.db.client;
            const sub = await client.query.payPalSubscriptions.findFirst({
                where: (0, drizzle_orm_1.eq)(schema_1.payPalSubscriptions.userId, userId),
            });
            if (!sub || sub.status !== 'ACTIVE') {
                return 'STARTER';
            }
            return sub.tier;
        }
        catch (error) {
            this.logger.error(`Error fetching PayPal tier for user ${userId}: ${error}`);
            return 'STARTER';
        }
    }
    async getStripeTier(userId) {
        try {
            const rows = await this.db.executeRaw(`SELECT tier, status
         FROM stripe_subscriptions
         WHERE user_id = '${this.escapeSqlLiteral(userId)}'
         ORDER BY updated_at DESC
         LIMIT 1`);
            const sub = rows[0];
            if (!sub || sub.status !== 'ACTIVE') {
                return 'STARTER';
            }
            return sub.tier || 'PRO';
        }
        catch (error) {
            // Stripe table might not exist before migration is applied.
            this.logger.warn(`Stripe tier lookup unavailable for user ${userId}: ${String(error)}`);
            return 'STARTER';
        }
    }
    async getMembershipByIdentity(identity) {
        const normalized = String(identity || '').trim();
        const empty = {
            identity: normalized,
            found: false,
            active: false,
            tier: 'STARTER',
            user: null,
            source: 'none',
        };
        if (!normalized)
            return empty;
        const lowered = normalized.toLowerCase();
        const matchByEmail = lowered.includes('@');
        const emailLiteral = this.escapeSqlLiteral(lowered);
        const usernameLiteral = this.escapeSqlLiteral(normalized);
        const rows = await this.db.executeRaw(matchByEmail
            ? `SELECT id, email, username, role, roles
           FROM users
           WHERE lower(email) = '${emailLiteral}'
             AND deleted_at IS NULL
           LIMIT 1`
            : `SELECT id, email, username, role, roles
           FROM users
           WHERE username = '${usernameLiteral}'
             AND deleted_at IS NULL
           LIMIT 1`);
        const user = rows[0];
        if (!user)
            return empty;
        const tier = await this.getUserTier(user.id);
        const override = await this.getActiveMembershipOverride(user.id);
        const configuredMasters = (this.configService.get('MASTER_SUPER_ADMIN_EMAILS') ||
            this.configService.get('HOSTMARIA_OWNER_EMAILS') ||
            '')
            .split(',')
            .map((email) => email.trim().toLowerCase())
            .filter(Boolean);
        const isMasterSuperAdmin = configuredMasters.includes((user.email || '').toLowerCase()) ||
            (user.email || '').toLowerCase() === 'owner@example.com';
        const normalizedRoles = Array.from(new Set([...(Array.isArray(user.roles) ? user.roles : []), user.role].filter(Boolean))).map((r) => r.toUpperCase());
        const hasOverrideRole = normalizedRoles.some((role) => this.membershipOverrideRoles.has(role));
        const isElevated = isMasterSuperAdmin || normalizedRoles.includes('SUPER_ADMIN') || hasOverrideRole;
        let effectiveTier = tier;
        if (isMasterSuperAdmin || normalizedRoles.includes('SUPER_ADMIN')) {
            effectiveTier = 'ENTERPRISE';
        }
        else if (hasOverrideRole && effectiveTier === 'STARTER') {
            effectiveTier = 'PRO';
        }
        if (override?.tier) {
            effectiveTier = this.maxTier(effectiveTier, override.tier);
        }
        return {
            identity: normalized,
            found: true,
            active: effectiveTier !== 'STARTER' || isElevated,
            tier: effectiveTier,
            user: {
                id: user.id,
                email: user.email,
                username: user.username || null,
                role: user.role,
                roles: normalizedRoles,
            },
            source: matchByEmail ? 'email' : 'username',
        };
    }
    async getMembershipForUser(userId) {
        const tier = await this.getUserTier(userId);
        const override = await this.getActiveMembershipOverride(userId);
        let effectiveTier = tier;
        try {
            const userRows = await this.db.executeRaw(`SELECT email, role, roles
         FROM users
         WHERE id = '${this.escapeSqlLiteral(userId)}'
           AND deleted_at IS NULL
         LIMIT 1`);
            const user = userRows[0];
            if (user) {
                const normalizedRoles = Array.from(new Set([...(Array.isArray(user.roles) ? user.roles : []), user.role].filter(Boolean))).map((r) => r.toUpperCase());
                const configuredMasters = (this.configService.get('MASTER_SUPER_ADMIN_EMAILS') ||
                    this.configService.get('HOSTMARIA_OWNER_EMAILS') ||
                    '')
                    .split(',')
                    .map((email) => email.trim().toLowerCase())
                    .filter(Boolean);
                const isMasterSuperAdmin = configuredMasters.includes((user.email || '').toLowerCase()) ||
                    (user.email || '').toLowerCase() === 'owner@example.com';
                const hasOverrideRole = normalizedRoles.some((role) => this.membershipOverrideRoles.has(role));
                if (isMasterSuperAdmin || normalizedRoles.includes('SUPER_ADMIN')) {
                    effectiveTier = 'ENTERPRISE';
                }
                else if (hasOverrideRole && effectiveTier === 'STARTER') {
                    effectiveTier = 'PRO';
                }
            }
        }
        catch (error) {
            this.logger.warn(`Membership override lookup unavailable for user ${userId}: ${error}`);
        }
        if (override?.tier) {
            effectiveTier = this.maxTier(effectiveTier, override.tier);
        }
        return {
            found: true,
            active: effectiveTier !== 'STARTER',
            tier: effectiveTier,
            userId,
        };
    }
};
exports.PayPalService = PayPalService;
exports.PayPalService = PayPalService = PayPalService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        drizzle_1.DatabaseService])
], PayPalService);
//# sourceMappingURL=paypal.service.js.map