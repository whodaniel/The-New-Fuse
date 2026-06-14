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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberOrAdminGuard = void 0;
exports.MemberOrAdmin = MemberOrAdmin;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const auth_policy_1 = require("../auth/auth-policy");
const paypal_service_1 = require("../modules/billing/paypal.service");
let MemberOrAdminGuard = class MemberOrAdminGuard {
    constructor(payPalService) {
        this.payPalService = payPalService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const principal = request.user || {};
        const userId = principal.id || principal.sub;
        if (!userId) {
            throw new common_1.UnauthorizedException('Authenticated user is required');
        }
        const isAdmin = (0, auth_policy_1.hasAuthorizationLevel)(principal, 'admin');
        if (isAdmin) {
            return true;
        }
        const membership = await this.payPalService.getMembershipForUser(userId);
        if (!membership.active) {
            throw new common_1.ForbiddenException('This action requires an active paid membership');
        }
        return true;
    }
};
exports.MemberOrAdminGuard = MemberOrAdminGuard;
exports.MemberOrAdminGuard = MemberOrAdminGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [paypal_service_1.PayPalService])
], MemberOrAdminGuard);
function MemberOrAdmin() {
    return (0, common_1.applyDecorators)((0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), MemberOrAdminGuard));
}
//# sourceMappingURL=member-or-admin.guard.js.map