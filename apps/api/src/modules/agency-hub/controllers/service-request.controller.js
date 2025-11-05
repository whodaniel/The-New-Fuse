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
var _a, _b;
import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, HttpStatus, HttpException, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceCategoryRouterService } from '@the-new-fuse/core/services/service-category-router.service';
import { EnhancedAgencyService } from '@the-new-fuse/core/services/enhanced-agency.service';
import { AuthGuard } from '../../../guards/auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { CurrentUser } from '../../../decorators/current-user.decorator';
import { EnhancedUserRole } from '@prisma/client';
let ServiceRequestController = class ServiceRequestController {
    serviceCategoryRouter;
    enhancedAgencyService;
    constructor(serviceCategoryRouter, enhancedAgencyService) {
        this.serviceCategoryRouter = serviceCategoryRouter;
        this.enhancedAgencyService = enhancedAgencyService;
    }
    async createServiceRequest(requestDto, user) {
        try {
            return await this.enhancedAgencyService.submitServiceRequest(user.agencyId, user.id, requestDto);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to create service request', HttpStatus.BAD_REQUEST);
        }
    }
    async getServiceRequests(agencyId, status, categoryId, providerId, limit = 50, offset = 0, user) {
        try {
            // Use agencyId from user context if not provided
            const targetAgencyId = agencyId || user.agencyId;
            return await this.enhancedAgencyService.getServiceRequests(targetAgencyId, {
                status,
                categoryId,
                providerId,
                limit,
                offset
            });
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to get service requests', HttpStatus.NOT_FOUND);
        }
    }
    async getServiceRequest(requestId) {
        try {
            return await this.enhancedAgencyService.getServiceRequestDetails(requestId);
        }
        catch (error) {
            throw new HttpException(error.message || 'Service request not found', HttpStatus.NOT_FOUND);
        }
    }
    async updateRequestStatus(requestId, statusDto) {
        try {
            return await this.enhancedAgencyService.updateServiceRequestStatus(requestId, statusDto.status, statusDto.reason);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to update status', HttpStatus.BAD_REQUEST);
        }
    }
    async assignRequest(requestId, assignmentDto) {
        try {
            return await this.serviceCategoryRouter.assignRequestToProvider(requestId, assignmentDto.providerId, assignmentDto.priority);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to assign request', HttpStatus.BAD_REQUEST);
        }
    }
    async autoAssignRequest(requestId) {
        try {
            const requestDetails = await this.enhancedAgencyService.getServiceRequestDetails(requestId);
            const bestProvider = await this.serviceCategoryRouter.findBestProvider(requestDetails.categoryId, requestDetails.agencyId, requestDetails.requirements);
            if (!bestProvider) {
                throw new HttpException('No suitable provider found', HttpStatus.NOT_FOUND);
            }
            return await this.serviceCategoryRouter.assignRequestToProvider(requestId, bestProvider.id);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to auto-assign request', HttpStatus.BAD_REQUEST);
        }
    }
    async getProviderRecommendations(requestId) {
        try {
            const requestDetails = await this.enhancedAgencyService.getServiceRequestDetails(requestId);
            return await this.serviceCategoryRouter.getProviderRecommendations(requestDetails.categoryId, requestDetails.agencyId, requestDetails.requirements);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to get recommendations', HttpStatus.NOT_FOUND);
        }
    }
    async completeRequest(requestId, completionDto) {
        try {
            return await this.enhancedAgencyService.completeServiceRequest(requestId, completionDto.deliverables, completionDto.qualityScore, completionDto.notes);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to complete request', HttpStatus.BAD_REQUEST);
        }
    }
    async submitReview(requestId, reviewDto, user) {
        try {
            return await this.enhancedAgencyService.submitServiceReview(requestId, user.id, reviewDto);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to submit review', HttpStatus.BAD_REQUEST);
        }
    }
    async getRequestsByCategory(categoryId, agencyId, status, limit = 50, offset = 0) {
        try {
            return await this.serviceCategoryRouter.getRequestsByCategory(categoryId, agencyId, { status, limit, offset });
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to get category requests', HttpStatus.NOT_FOUND);
        }
    }
};
__decorate([
    Post(),
    ApiOperation({ summary: 'Submit a new service request' }),
    ApiResponse({ status: 201, description: 'Service request created' }),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "createServiceRequest", null);
__decorate([
    Get(),
    ApiOperation({ summary: 'Get service requests for agency' }),
    ApiResponse({ status: 200, description: 'Service requests retrieved' }),
    __param(0, Query('agencyId')),
    __param(1, Query('status')),
    __param(2, Query('categoryId')),
    __param(3, Query('providerId')),
    __param(4, Query('limit')),
    __param(5, Query('offset')),
    __param(6, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "getServiceRequests", null);
__decorate([
    Get(':requestId'),
    ApiOperation({ summary: 'Get specific service request details' }),
    ApiResponse({ status: 200, description: 'Service request details retrieved' }),
    __param(0, Param('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "getServiceRequest", null);
__decorate([
    Put(':requestId/status'),
    UseGuards(RolesGuard),
    Roles(EnhancedUserRole.AGENCY_ADMIN, EnhancedUserRole.AGENCY_MANAGER),
    ApiOperation({ summary: 'Update service request status' }),
    ApiResponse({ status: 200, description: 'Status updated successfully' }),
    __param(0, Param('requestId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "updateRequestStatus", null);
__decorate([
    Post(':requestId/assign'),
    UseGuards(RolesGuard),
    Roles(EnhancedUserRole.AGENCY_ADMIN, EnhancedUserRole.AGENCY_MANAGER),
    ApiOperation({ summary: 'Assign service request to provider' }),
    ApiResponse({ status: 200, description: 'Request assigned successfully' }),
    __param(0, Param('requestId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "assignRequest", null);
__decorate([
    Post(':requestId/auto-assign'),
    UseGuards(RolesGuard),
    Roles(EnhancedUserRole.AGENCY_ADMIN, EnhancedUserRole.AGENCY_MANAGER),
    ApiOperation({ summary: 'Auto-assign service request to best provider' }),
    ApiResponse({ status: 200, description: 'Request auto-assigned successfully' }),
    __param(0, Param('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "autoAssignRequest", null);
__decorate([
    Get(':requestId/recommendations'),
    ApiOperation({ summary: 'Get provider recommendations for request' }),
    ApiResponse({ status: 200, description: 'Provider recommendations retrieved' }),
    __param(0, Param('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "getProviderRecommendations", null);
__decorate([
    Post(':requestId/complete'),
    UseGuards(RolesGuard),
    Roles(EnhancedUserRole.AGENT_OPERATOR),
    ApiOperation({ summary: 'Mark service request as completed' }),
    ApiResponse({ status: 200, description: 'Request marked as completed' }),
    __param(0, Param('requestId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "completeRequest", null);
__decorate([
    Post(':requestId/review'),
    ApiOperation({ summary: 'Submit review for completed service request' }),
    ApiResponse({ status: 201, description: 'Review submitted successfully' }),
    __param(0, Param('requestId')),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "submitReview", null);
__decorate([
    Get('categories/:categoryId/requests'),
    ApiOperation({ summary: 'Get requests by service category' }),
    ApiResponse({ status: 200, description: 'Category requests retrieved' }),
    __param(0, Param('categoryId')),
    __param(1, Query('agencyId')),
    __param(2, Query('status')),
    __param(3, Query('limit')),
    __param(4, Query('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], ServiceRequestController.prototype, "getRequestsByCategory", null);
ServiceRequestController = __decorate([
    ApiTags('service-requests'),
    Controller('api/service-requests'),
    UseGuards(AuthGuard),
    ApiBearerAuth(),
    __metadata("design:paramtypes", [typeof (_a = typeof ServiceCategoryRouterService !== "undefined" && ServiceCategoryRouterService) === "function" ? _a : Object, typeof (_b = typeof EnhancedAgencyService !== "undefined" && EnhancedAgencyService) === "function" ? _b : Object])
], ServiceRequestController);
export { ServiceRequestController };
//# sourceMappingURL=service-request.controller.js.map