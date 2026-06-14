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
exports.EmailCustodianController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_policy_1 = require("../../../auth/auth-policy");
const email_custodian_dto_1 = require("../../../dto/email-custodian.dto");
const secure_auth_guard_1 = require("../../../guards/secure-auth.guard");
const email_custodian_service_1 = require("../services/email-custodian.service");
let EmailCustodianController = class EmailCustodianController {
    constructor(emailCustodianService) {
        this.emailCustodianService = emailCustodianService;
    }
    async listAccounts(req) {
        const ownerUserId = this.requireUserId(req);
        this.assertCanManage(req);
        return this.emailCustodianService.listAccountsForOwner(ownerUserId);
    }
    async provisionAccount(req, body) {
        const ownerUserId = this.requireUserId(req);
        this.assertCanManage(req);
        return this.emailCustodianService.provisionAccountForOwner(ownerUserId, body);
    }
    async createGrant(req, accountId, body) {
        const ownerUserId = this.requireUserId(req);
        this.assertCanManage(req);
        return this.emailCustodianService.createGrantForAccount(ownerUserId, accountId, body);
    }
    async listGrants(req, accountId) {
        const ownerUserId = this.requireUserId(req);
        this.assertCanManage(req);
        return this.emailCustodianService.listAccountGrants(ownerUserId, accountId);
    }
    async revokeGrant(req, grantId) {
        const ownerUserId = this.requireUserId(req);
        this.assertCanManage(req);
        return this.emailCustodianService.revokeGrant(ownerUserId, grantId);
    }
    async redeemGrant(body) {
        return this.emailCustodianService.redeemGrant(body);
    }
    requireUserId(req) {
        const userId = req.user?.id?.trim();
        if (!userId) {
            throw new common_1.ForbiddenException('Authenticated user id is required');
        }
        return userId;
    }
    assertCanManage(req) {
        if ((0, auth_policy_1.isPrivilegedUser)(req.user || {}))
            return;
        if ((0, auth_policy_1.hasPermission)(req.user || {}, 'email_custodian:manage'))
            return;
        throw new common_1.ForbiddenException('Managing email custodian accounts requires admin/system or email_custodian:manage');
    }
};
exports.EmailCustodianController = EmailCustodianController;
__decorate([
    (0, common_1.Get)('accounts'),
    (0, swagger_1.ApiOperation)({ summary: 'List managed credential accounts owned by the current user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Managed accounts list returned' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailCustodianController.prototype, "listAccounts", null);
__decorate([
    (0, common_1.Post)('accounts/provision'),
    (0, swagger_1.ApiOperation)({
        summary: 'Provision a managed account record (hosted email or ChatGPT) and optionally execute provider automation',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Managed account provisioned' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, email_custodian_dto_1.ProvisionManagedAccountDto]),
    __metadata("design:returntype", Promise)
], EmailCustodianController.prototype, "provisionAccount", null);
__decorate([
    (0, common_1.Post)('accounts/:accountId/grants'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a time-bound access grant token for a target agent to retrieve account credentials',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Grant created' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('accountId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, email_custodian_dto_1.CreateManagedAccountGrantDto]),
    __metadata("design:returntype", Promise)
], EmailCustodianController.prototype, "createGrant", null);
__decorate([
    (0, common_1.Get)('accounts/:accountId/grants'),
    (0, swagger_1.ApiOperation)({ summary: 'List active and historical grants for one managed account' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Grant list returned' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EmailCustodianController.prototype, "listGrants", null);
__decorate([
    (0, common_1.Post)('grants/:grantId/revoke'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke an existing managed account grant token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Grant revoked' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('grantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EmailCustodianController.prototype, "revokeGrant", null);
__decorate([
    (0, common_1.Post)('grants/redeem'),
    (0, swagger_1.ApiOperation)({
        summary: 'Redeem a custodian grant token to retrieve delegated account login credentials',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Grant redeemed and credentials returned' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [email_custodian_dto_1.RedeemManagedAccountGrantDto]),
    __metadata("design:returntype", Promise)
], EmailCustodianController.prototype, "redeemGrant", null);
exports.EmailCustodianController = EmailCustodianController = __decorate([
    (0, swagger_1.ApiTags)('email-custodian'),
    (0, common_1.Controller)('a2a/email-custodian'),
    (0, secure_auth_guard_1.RequireAuthLevel)(secure_auth_guard_1.AuthLevel.USER),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [email_custodian_service_1.EmailCustodianService])
], EmailCustodianController);
//# sourceMappingURL=email-custodian.controller.js.map