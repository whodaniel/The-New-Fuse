"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var StripeController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const crypto = __importStar(require("node:crypto"));
const stripe_service_1 = require("./stripe.service");
let StripeController = StripeController_1 = class StripeController {
    constructor(stripeService, configService) {
        this.stripeService = stripeService;
        this.configService = configService;
        this.logger = new common_1.Logger(StripeController_1.name);
    }
    async handleWebhook(headers, body, req) {
        const signature = String(headers['stripe-signature'] || '').trim();
        const rawBody = req?.rawBody;
        const payload = typeof rawBody === 'string'
            ? rawBody
            : rawBody instanceof Buffer
                ? rawBody.toString('utf8')
                : JSON.stringify(body);
        if (!this.verifyStripeSignature(payload, signature)) {
            this.logger.warn('Invalid Stripe webhook signature - rejecting');
            throw new common_1.UnauthorizedException('Invalid webhook signature');
        }
        await this.stripeService.handleWebhookEvent(body);
        return { received: true };
    }
    async recordSubscription(body, req) {
        const userId = req.user?.id;
        if (!userId) {
            throw new common_1.UnauthorizedException('User not authenticated');
        }
        await this.stripeService.recordSubscription(userId, {
            ...body,
            tier: 'PRO',
        });
        return { success: true };
    }
    async createCheckoutSession(body, req) {
        const userId = req.user?.id;
        if (!userId) {
            throw new common_1.UnauthorizedException('User not authenticated');
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
            throw new common_1.BadRequestException('Failed to create checkout session');
        }
        return session;
    }
    verifyStripeSignature(payload, stripeSignature) {
        const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET') || '';
        if (!webhookSecret) {
            this.logger.error('STRIPE_WEBHOOK_SECRET is not configured');
            return false;
        }
        if (!stripeSignature)
            return false;
        const fields = stripeSignature.split(',').reduce((acc, part) => {
            const [k, v] = part.split('=', 2);
            if (k && v)
                acc[k] = v;
            return acc;
        }, {});
        const timestamp = fields.t;
        const v1 = fields.v1;
        if (!timestamp || !v1)
            return false;
        const toleranceSeconds = 300;
        const age = Math.floor(Date.now() / 1000) - Number(timestamp);
        if (!Number.isFinite(age) || Math.abs(age) > toleranceSeconds)
            return false;
        const signedPayload = `${timestamp}.${payload}`;
        const expected = crypto.createHmac('sha256', webhookSecret).update(signedPayload).digest('hex');
        try {
            return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
        }
        catch {
            return false;
        }
    }
};
exports.StripeController = StripeController;
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], StripeController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Post)('subscribe'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StripeController.prototype, "recordSubscription", null);
__decorate([
    (0, common_1.Post)('checkout-session'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StripeController.prototype, "createCheckoutSession", null);
exports.StripeController = StripeController = StripeController_1 = __decorate([
    (0, common_1.Controller)('billing/stripe'),
    __metadata("design:paramtypes", [stripe_service_1.StripeService,
        config_1.ConfigService])
], StripeController);
//# sourceMappingURL=stripe.controller.js.map