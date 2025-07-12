/**
 * Service Routing Controller
 * Handles service category management, provider routing, and service requests
 */
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
var ServiceRoutingController_1;
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Logger, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TenantGuard } from '../guards/tenant.guard';
import { AgencyRoleGuard } from '../guards/agency-role.guard';
import { Roles } from '../decorators/roles.decorator';
let ServiceRoutingController = ServiceRoutingController_1 = class ServiceRoutingController {
    logger = new Logger(ServiceRoutingController_1.name);
    async getCategories(parentId, tier) {
        this.logger.log('Getting service categories');
        // Logic to get categories
        return [];
    }
    async getCategoryById(categoryId) {
        this.logger.log(`Getting category details for ID: ${categoryId}`);
        // Logic to get category by ID
        return {};
    }
    async createCategory(createCategoryDto) {
        this.logger.log('Creating new service category');
        // Logic to create category
        return { message: 'Category created successfully' };
    }
    async updateCategory(categoryId, updateCategoryDto) {
        this.logger.log(`Updating category ID: ${categoryId}`);
        // Logic to update category
        return { message: 'Category updated successfully' };
    }
    async deleteCategory(categoryId) {
        this.logger.log(`Deleting category ID: ${categoryId}`);
        // Logic to delete category
        return { message: 'Category deleted successfully' };
    }
    async getProviders(categoryId, agencyId) {
        this.logger.log('Getting service providers');
        // Logic to get providers
        return [];
    }
    async registerProvider(registerProviderDto) {
        this.logger.log('Registering new service provider');
        // Logic to register provider
        return { message: 'Provider registered successfully' };
    }
    async getProviderById(providerId) {
        this.logger.log(`Getting provider details for ID: ${providerId}`);
        // Logic to get provider details
        return {};
    }
    async updateProvider(providerId, updateProviderDto) {
        this.logger.log(`Updating provider ID: ${providerId}`);
        // Logic to update provider
        return { message: 'Provider updated successfully' };
    }
    async removeProvider(providerId) {
        this.logger.log(`Removing provider ID: ${providerId}`);
        // Logic to remove provider
        return { message: 'Provider removed successfully' };
    }
    async createServiceRequest(createRequestDto) {
        this.logger.log('Creating new service request');
        // Logic to create service request
        return { message: 'Service request created successfully' };
    }
    async getServiceRequests(status, categoryId, page, limit) {
        this.logger.log('Getting service requests');
        // Logic to get service requests
        return [];
    }
    async getRequestById(requestId) {
        this.logger.log(`Getting request details for ID: ${requestId}`);
        // Logic to get request details
        return {};
    }
    async updateServiceRequest(requestId, updateRequestDto) {
        this.logger.log(`Updating request ID: ${requestId}`);
        // Logic to update request
        return { message: 'Request updated successfully' };
    }
    async assignRequest(requestId, assignRequestDto) {
        this.logger.log(`Assigning request ID: ${requestId}`);
        // Logic to assign request
        return { message: 'Request assigned successfully' };
    }
    async optimizeRouting(optimizeDto) {
        this.logger.log('Optimizing service routing');
        // Logic to optimize routing
        return { message: 'Routing optimized successfully' };
    }
};
__decorate([
    Get('categories'),
    ApiOperation({ summary: 'Get available service categories' }),
    ApiQuery({ name: 'parentId', required: false, description: 'Filter by parent category' }),
    ApiQuery({ name: 'tier', required: false, description: 'Filter by agency tier' }),
    ApiResponse({ status: 200, description: 'Service categories retrieved' }),
    __param(0, Query('parentId')),
    __param(1, Query('tier')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ServiceRoutingController.prototype, "getCategories", null);
__decorate([
    Get('categories/:categoryId'),
    ApiOperation({ summary: 'Get specific service category details' }),
    ApiParam({ name: 'categoryId', description: 'Category ID' }),
    ApiResponse({ status: 200, description: 'Category details retrieved' }),
    __param(0, Param('categoryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServiceRoutingController.prototype, "getCategoryById", null);
__decorate([
    Post('categories'),
    ApiOperation({ summary: 'Create a new service category' }),
    ApiResponse({ status: 201, description: 'Category created successfully' }),
    Roles('MASTER_ADMIN'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ServiceRoutingController.prototype, "createCategory", null);
__decorate([
    Put('categories/:categoryId'),
    ApiOperation({ summary: 'Update a service category' }),
    ApiParam({ name: 'categoryId', description: 'Category ID' }),
    ApiResponse({ status: 200, description: 'Category updated successfully' }),
    Roles('MASTER_ADMIN'),
    __param(0, Param('categoryId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ServiceRoutingController.prototype, "updateCategory", null);
__decorate([
    Delete('categories/:categoryId'),
    ApiOperation({ summary: 'Delete a service category' }),
    ApiParam({ name: 'categoryId', description: 'Category ID' }),
    ApiResponse({ status: 200, description: 'Category deleted successfully' }),
    Roles('MASTER_ADMIN'),
    __param(0, Param('categoryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServiceRoutingController.prototype, "deleteCategory", null);
__decorate([
    Get('providers'),
    ApiOperation({ summary: 'Get available service providers' }),
    ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category' }),
    ApiQuery({ name: 'agencyId', required: false, description: 'Filter by agency' }),
    ApiResponse({ status: 200, description: 'Service providers retrieved' }),
    __param(0, Query('categoryId')),
    __param(1, Query('agencyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ServiceRoutingController.prototype, "getProviders", null);
__decorate([
    Post('providers'),
    ApiOperation({ summary: 'Register a new service provider' }),
    ApiResponse({ status: 201, description: 'Provider registered successfully' }),
    Roles('AGENCY_ADMIN', 'AGENCY_MANAGER'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ServiceRoutingController.prototype, "registerProvider", null);
__decorate([
    Get('providers/:providerId'),
    ApiOperation({ summary: 'Get service provider details' }),
    ApiParam({ name: 'providerId', description: 'Provider ID' }),
    ApiResponse({ status: 200, description: 'Provider details retrieved' }),
    __param(0, Param('providerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServiceRoutingController.prototype, "getProviderById", null);
__decorate([
    Put('providers/:providerId'),
    ApiOperation({ summary: 'Update service provider' }),
    ApiParam({ name: 'providerId', description: 'Provider ID' }),
    ApiResponse({ status: 200, description: 'Provider updated successfully' }),
    Roles('AGENCY_ADMIN', 'AGENCY_MANAGER'),
    __param(0, Param('providerId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ServiceRoutingController.prototype, "updateProvider", null);
__decorate([
    Delete('providers/:providerId'),
    ApiOperation({ summary: 'Remove service provider' }),
    ApiParam({ name: 'providerId', description: 'Provider ID' }),
    ApiResponse({ status: 200, description: 'Provider removed successfully' }),
    Roles('AGENCY_ADMIN', 'AGENCY_MANAGER'),
    __param(0, Param('providerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServiceRoutingController.prototype, "removeProvider", null);
__decorate([
    Post('requests'),
    ApiOperation({ summary: 'Create a service request' }),
    ApiResponse({ status: 201, description: 'Service request created successfully' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ServiceRoutingController.prototype, "createServiceRequest", null);
__decorate([
    Get('requests'),
    ApiOperation({ summary: 'Get service requests' }),
    ApiQuery({ name: 'status', required: false, description: 'Filter by status' }),
    ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category' }),
    ApiQuery({ name: 'page', required: false, description: 'Page number' }),
    ApiQuery({ name: 'limit', required: false, description: 'Items per page' }),
    ApiResponse({ status: 200, description: 'Service requests retrieved' }),
    __param(0, Query('status')),
    __param(1, Query('categoryId')),
    __param(2, Query('page')),
    __param(3, Query('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], ServiceRoutingController.prototype, "getServiceRequests", null);
__decorate([
    Get('requests/:requestId'),
    ApiOperation({ summary: 'Get service request details' }),
    ApiParam({ name: 'requestId', description: 'Request ID' }),
    ApiResponse({ status: 200, description: 'Request details retrieved' }),
    __param(0, Param('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServiceRoutingController.prototype, "getRequestById", null);
__decorate([
    Put('requests/:requestId'),
    ApiOperation({ summary: 'Update service request' }),
    ApiParam({ name: 'requestId', description: 'Request ID' }),
    ApiResponse({ status: 200, description: 'Request updated successfully' }),
    __param(0, Param('requestId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ServiceRoutingController.prototype, "updateServiceRequest", null);
__decorate([
    Post('requests/:requestId/assign'),
    ApiOperation({ summary: 'Assign service request to provider' }),
    ApiParam({ name: 'requestId', description: 'Request ID' }),
    ApiResponse({ status: 200, description: 'Request assigned successfully' }),
    Roles('AGENCY_ADMIN', 'AGENCY_MANAGER'),
    __param(0, Param('requestId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ServiceRoutingController.prototype, "assignRequest", null);
__decorate([
    Post('routing/optimize'),
    ApiOperation({ summary: 'Optimize service routing' }),
    ApiResponse({ status: 200, description: 'Routing optimized successfully' }),
    Roles('AGENCY_ADMIN'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ServiceRoutingController.prototype, "optimizeRouting", null);
ServiceRoutingController = ServiceRoutingController_1 = __decorate([
    Controller('service-routing'),
    ApiTags('Service Routing'),
    UseGuards(TenantGuard, AgencyRoleGuard)
], ServiceRoutingController);
export { ServiceRoutingController };
