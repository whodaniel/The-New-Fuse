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
exports.ServiceRequestController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const secure_auth_guard_1 = require("../../../guards/secure-auth.guard");
// import { ServiceCategoryRouterService } from '../../../types/core/services/service-category-router.service';
// import { EnhancedAgencyService } from '../../../types/core/services/enhanced-agency.service';
// import { AuthGuard } from '../../../guards/auth.guard';
// import { RolesGuard } from '../../../guards/roles.guard';
// import { Roles } from '../../../decorators/roles.decorator';
// import { CurrentUser } from '../../../decorators/current-user.decorator';
let ServiceRequestController = class ServiceRequestController {
    // constructor(
    //   private readonly serviceCategoryRouter: ServiceCategoryRouterService,
    //   private readonly enhancedAgencyService: EnhancedAgencyService
    // ) {}
    async createServiceRequest(requestDto
    // @CurrentUser() user: any
    ) {
        this.notImplemented('Create service request');
    }
    async getServiceRequests(agencyId, status, categoryId, providerId, limit = 50, offset = 0
    // @CurrentUser() user: any
    ) {
        this.notImplemented('List service requests');
    }
    async getServiceRequest(requestId) {
        this.notImplemented('Get service request');
    }
    async updateRequestStatus(requestId, statusDto) {
        this.notImplemented('Update service request status');
    }
    async assignRequest(requestId, assignmentDto) {
        this.notImplemented('Assign service request');
    }
    async autoAssignRequest(requestId) {
        this.notImplemented('Auto-assign service request');
    }
    async getProviderRecommendations(requestId) {
        this.notImplemented('Provider recommendations');
    }
    async completeRequest(requestId, completionDto) {
        this.notImplemented('Complete service request');
    }
    async submitReview(requestId, reviewDto
    // @CurrentUser() user: any
    ) {
        this.notImplemented('Submit service request review');
    }
    async getRequestsByCategory(categoryId, agencyId, status, limit = 50, offset = 0) {
        this.notImplemented('Category service requests');
    }
    notImplemented(feature) {
        throw new common_1.HttpException(`${feature} is not implemented in this deployment.`, common_1.HttpStatus.NOT_IMPLEMENTED);
    }
};
exports.ServiceRequestController = ServiceRequestController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a new service request' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Service request created' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "createServiceRequest", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get service requests for agency' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service requests retrieved' }),
    __param(0, (0, common_1.Query)('agencyId')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('categoryId')),
    __param(3, (0, common_1.Query)('providerId')),
    __param(4, (0, common_1.Query)('limit')),
    __param(5, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "getServiceRequests", null);
__decorate([
    (0, common_1.Get)(':requestId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get specific service request details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service request details retrieved' }),
    __param(0, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "getServiceRequest", null);
__decorate([
    (0, common_1.Put)(':requestId/status')
    // @UseGuards(RolesGuard)
    // @Roles(UserRole.AGENCY_ADMIN, UserRole.AGENCY_MANAGER)
    ,
    (0, swagger_1.ApiOperation)({ summary: 'Update service request status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status updated successfully' }),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "updateRequestStatus", null);
__decorate([
    (0, common_1.Post)(':requestId/assign')
    // @UseGuards(RolesGuard)
    // @Roles(UserRole.AGENCY_ADMIN, UserRole.AGENCY_MANAGER)
    ,
    (0, swagger_1.ApiOperation)({ summary: 'Assign service request to provider' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request assigned successfully' }),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "assignRequest", null);
__decorate([
    (0, common_1.Post)(':requestId/auto-assign')
    // @UseGuards(RolesGuard)
    // @Roles(UserRole.AGENCY_ADMIN, UserRole.AGENCY_MANAGER)
    ,
    (0, swagger_1.ApiOperation)({ summary: 'Auto-assign service request to best provider' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request auto-assigned successfully' }),
    __param(0, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "autoAssignRequest", null);
__decorate([
    (0, common_1.Get)(':requestId/recommendations'),
    (0, swagger_1.ApiOperation)({ summary: 'Get provider recommendations for request' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Provider recommendations retrieved' }),
    __param(0, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "getProviderRecommendations", null);
__decorate([
    (0, common_1.Post)(':requestId/complete')
    // @UseGuards(RolesGuard)
    // @Roles(UserRole.AGENT_OPERATOR)
    ,
    (0, swagger_1.ApiOperation)({ summary: 'Mark service request as completed' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request marked as completed' }),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "completeRequest", null);
__decorate([
    (0, common_1.Post)(':requestId/review'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit review for completed service request' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Review submitted successfully' }),
    __param(0, (0, common_1.Param)('requestId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "submitReview", null);
__decorate([
    (0, common_1.Get)('categories/:categoryId/requests'),
    (0, swagger_1.ApiOperation)({ summary: 'Get requests by service category' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Category requests retrieved' }),
    __param(0, (0, common_1.Param)('categoryId')),
    __param(1, (0, common_1.Query)('agencyId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "getRequestsByCategory", null);
exports.ServiceRequestController = ServiceRequestController = __decorate([
    (0, swagger_1.ApiTags)('service-requests'),
    (0, common_1.Controller)('service-requests'),
    (0, common_1.UseGuards)(secure_auth_guard_1.SecureAuthGuard),
    (0, secure_auth_guard_1.RequireAuthLevel)(secure_auth_guard_1.AuthLevel.USER),
    (0, swagger_1.ApiBearerAuth)()
], ServiceRequestController);
//# sourceMappingURL=service-request.controller.js.map