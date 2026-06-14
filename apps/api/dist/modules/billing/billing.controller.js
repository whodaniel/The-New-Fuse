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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const community_api_key_guard_1 = require("../../guards/community-api-key.guard");
const paypal_service_1 = require("./paypal.service");
let BillingController = class BillingController {
    constructor(payPalService) {
        this.payPalService = payPalService;
    }
    async getMembershipByIdentity(identity) {
        return this.payPalService.getMembershipByIdentity(identity);
    }
    async getMyMembership(req) {
        const userId = req?.user?.id || req?.user?.sub;
        if (!userId) {
            throw new common_1.UnauthorizedException('Authenticated user is required');
        }
        return this.payPalService.getMembershipForUser(userId);
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Get)('membership/:identity'),
    (0, common_1.UseGuards)(community_api_key_guard_1.CommunityApiKeyGuard),
    __param(0, (0, common_1.Param)('identity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getMembershipByIdentity", null);
__decorate([
    (0, common_1.Get)('membership/me'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getMyMembership", null);
exports.BillingController = BillingController = __decorate([
    (0, common_1.Controller)('billing'),
    __metadata("design:paramtypes", [paypal_service_1.PayPalService])
], BillingController);
//# sourceMappingURL=billing.controller.js.map