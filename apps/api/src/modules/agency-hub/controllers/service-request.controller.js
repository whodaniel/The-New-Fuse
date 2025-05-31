var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { Controller, Get, Post, Put, UseGuards, HttpStatus, HttpException, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../../guards/auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { EnhancedUserRole } from '@prisma/client';
let ServiceRequestController = (() => {
    let _classDecorators = [ApiTags('service-requests'), Controller('api/service-requests'), UseGuards(AuthGuard), ApiBearerAuth()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _createServiceRequest_decorators;
    let _getServiceRequests_decorators;
    let _getServiceRequest_decorators;
    let _updateRequestStatus_decorators;
    let _assignRequest_decorators;
    let _autoAssignRequest_decorators;
    let _getProviderRecommendations_decorators;
    let _completeRequest_decorators;
    let _submitReview_decorators;
    let _getRequestsByCategory_decorators;
    var ServiceRequestController = _classThis = class {
        constructor(serviceCategoryRouter, enhancedAgencyService) {
            this.serviceCategoryRouter = (__runInitializers(this, _instanceExtraInitializers), serviceCategoryRouter);
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
    __setFunctionName(_classThis, "ServiceRequestController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createServiceRequest_decorators = [Post(), ApiOperation({ summary: 'Submit a new service request' }), ApiResponse({ status: 201, description: 'Service request created' })];
        _getServiceRequests_decorators = [Get(), ApiOperation({ summary: 'Get service requests for agency' }), ApiResponse({ status: 200, description: 'Service requests retrieved' })];
        _getServiceRequest_decorators = [Get(':requestId'), ApiOperation({ summary: 'Get specific service request details' }), ApiResponse({ status: 200, description: 'Service request details retrieved' })];
        _updateRequestStatus_decorators = [Put(':requestId/status'), UseGuards(RolesGuard), Roles(EnhancedUserRole.AGENCY_ADMIN, EnhancedUserRole.AGENCY_MANAGER), ApiOperation({ summary: 'Update service request status' }), ApiResponse({ status: 200, description: 'Status updated successfully' })];
        _assignRequest_decorators = [Post(':requestId/assign'), UseGuards(RolesGuard), Roles(EnhancedUserRole.AGENCY_ADMIN, EnhancedUserRole.AGENCY_MANAGER), ApiOperation({ summary: 'Assign service request to provider' }), ApiResponse({ status: 200, description: 'Request assigned successfully' })];
        _autoAssignRequest_decorators = [Post(':requestId/auto-assign'), UseGuards(RolesGuard), Roles(EnhancedUserRole.AGENCY_ADMIN, EnhancedUserRole.AGENCY_MANAGER), ApiOperation({ summary: 'Auto-assign service request to best provider' }), ApiResponse({ status: 200, description: 'Request auto-assigned successfully' })];
        _getProviderRecommendations_decorators = [Get(':requestId/recommendations'), ApiOperation({ summary: 'Get provider recommendations for request' }), ApiResponse({ status: 200, description: 'Provider recommendations retrieved' })];
        _completeRequest_decorators = [Post(':requestId/complete'), UseGuards(RolesGuard), Roles(EnhancedUserRole.AGENT_OPERATOR), ApiOperation({ summary: 'Mark service request as completed' }), ApiResponse({ status: 200, description: 'Request marked as completed' })];
        _submitReview_decorators = [Post(':requestId/review'), ApiOperation({ summary: 'Submit review for completed service request' }), ApiResponse({ status: 201, description: 'Review submitted successfully' })];
        _getRequestsByCategory_decorators = [Get('categories/:categoryId/requests'), ApiOperation({ summary: 'Get requests by service category' }), ApiResponse({ status: 200, description: 'Category requests retrieved' })];
        __esDecorate(_classThis, null, _createServiceRequest_decorators, { kind: "method", name: "createServiceRequest", static: false, private: false, access: { has: obj => "createServiceRequest" in obj, get: obj => obj.createServiceRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getServiceRequests_decorators, { kind: "method", name: "getServiceRequests", static: false, private: false, access: { has: obj => "getServiceRequests" in obj, get: obj => obj.getServiceRequests }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getServiceRequest_decorators, { kind: "method", name: "getServiceRequest", static: false, private: false, access: { has: obj => "getServiceRequest" in obj, get: obj => obj.getServiceRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateRequestStatus_decorators, { kind: "method", name: "updateRequestStatus", static: false, private: false, access: { has: obj => "updateRequestStatus" in obj, get: obj => obj.updateRequestStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _assignRequest_decorators, { kind: "method", name: "assignRequest", static: false, private: false, access: { has: obj => "assignRequest" in obj, get: obj => obj.assignRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _autoAssignRequest_decorators, { kind: "method", name: "autoAssignRequest", static: false, private: false, access: { has: obj => "autoAssignRequest" in obj, get: obj => obj.autoAssignRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getProviderRecommendations_decorators, { kind: "method", name: "getProviderRecommendations", static: false, private: false, access: { has: obj => "getProviderRecommendations" in obj, get: obj => obj.getProviderRecommendations }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _completeRequest_decorators, { kind: "method", name: "completeRequest", static: false, private: false, access: { has: obj => "completeRequest" in obj, get: obj => obj.completeRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _submitReview_decorators, { kind: "method", name: "submitReview", static: false, private: false, access: { has: obj => "submitReview" in obj, get: obj => obj.submitReview }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getRequestsByCategory_decorators, { kind: "method", name: "getRequestsByCategory", static: false, private: false, access: { has: obj => "getRequestsByCategory" in obj, get: obj => obj.getRequestsByCategory }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ServiceRequestController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ServiceRequestController = _classThis;
})();
export { ServiceRequestController };
