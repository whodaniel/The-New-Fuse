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
var PayPalController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayPalController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const crypto = __importStar(require("node:crypto"));
const community_api_key_guard_1 = require("../../guards/community-api-key.guard");
const paypal_service_1 = require("./paypal.service");
let PayPalController = PayPalController_1 = class PayPalController {
    constructor(paypalService) {
        this.paypalService = paypalService;
        this.logger = new common_1.Logger(PayPalController_1.name);
        this.trustedPayPalCertHosts = new Set([
            'api.paypal.com',
            'api-m.paypal.com',
            'api.sandbox.paypal.com',
            'api-m.sandbox.paypal.com',
        ]);
    }
    async verifyCommunityMembership(identity) {
        return this.paypalService.getMembershipByIdentity(identity);
    }
    async handleWebhook(headers, body) {
        // Verify webhook signature
        const isValid = await this.verifyPayPalWebhookSignature(headers, body);
        if (!isValid) {
            this.logger.warn('Invalid PayPal webhook signature - rejecting');
            throw new common_1.UnauthorizedException('Invalid webhook signature');
        }
        await this.paypalService.handleWebhook(headers, body);
        return { received: true };
    }
    async recordSubscription(body, req) {
        const userId = req.user?.id;
        if (!userId) {
            throw new common_1.UnauthorizedException('User not authenticated');
        }
        await this.paypalService.createSubscriptionRecord(userId, body.subscriptionID, body.planID);
        return { success: true };
    }
    /**
     * Verify PayPal webhook signature
     * https://developer.paypal.com/api/rest/webhooks/rest/#verify-webhook-signature
     */
    async verifyPayPalWebhookSignature(headers, body) {
        try {
            const transmissionId = headers['paypal-transmission-id'];
            const transmissionTime = headers['paypal-transmission-time'];
            const certUrl = headers['paypal-cert-url'];
            const authAlgo = headers['paypal-auth-algo'] || 'SHA256';
            const transmissionSig = headers['paypal-transmission-sig'];
            // Required headers check
            if (!transmissionId || !transmissionTime || !certUrl || !transmissionSig) {
                this.logger.error('Missing required PayPal webhook headers');
                return false;
            }
            if (!this.isTrustedPayPalCertUrl(certUrl)) {
                this.logger.error(`Untrusted PayPal certificate URL: ${certUrl}`);
                return false;
            }
            // Fetch the certificate
            const certResponse = await fetch(certUrl);
            if (!certResponse.ok) {
                this.logger.error(`Failed to fetch PayPal certificate from ${certUrl}`);
                return false;
            }
            const cert = await certResponse.text();
            // Construct the expected signature string
            const expectedSig = `${transmissionId}|${transmissionTime}|${process.env.PAYPAL_WEBHOOK_ID}|${JSON.stringify(body)}`;
            // Verify signature using the certificate's public key
            const verifier = crypto.createVerify('RSA-SHA256');
            verifier.update(expectedSig);
            // Extract public key from certificate and verify
            // For production, you may want to cache certificates
            const publicKey = this.extractPublicKeyFromCert(cert);
            const isValid = verifier.verify(publicKey, transmissionSig, 'base64');
            return isValid;
        }
        catch (error) {
            this.logger.error('Error verifying PayPal webhook signature:', error);
            return false;
        }
    }
    extractPublicKeyFromCert(cert) {
        // The certificate is in PEM format, we can use it directly for verification
        return cert;
    }
    isTrustedPayPalCertUrl(rawUrl) {
        try {
            const parsed = new URL(rawUrl);
            if (parsed.protocol !== 'https:')
                return false;
            return (this.trustedPayPalCertHosts.has(parsed.hostname) || parsed.hostname.endsWith('.paypal.com'));
        }
        catch {
            return false;
        }
    }
};
exports.PayPalController = PayPalController;
__decorate([
    (0, common_1.Get)('community-membership/:identity'),
    (0, common_1.UseGuards)(community_api_key_guard_1.CommunityApiKeyGuard),
    __param(0, (0, common_1.Param)('identity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PayPalController.prototype, "verifyCommunityMembership", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Headers)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PayPalController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Post)('subscribe'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PayPalController.prototype, "recordSubscription", null);
exports.PayPalController = PayPalController = PayPalController_1 = __decorate([
    (0, common_1.Controller)('billing/paypal'),
    __metadata("design:paramtypes", [paypal_service_1.PayPalService])
], PayPalController);
//# sourceMappingURL=paypal.controller.js.map