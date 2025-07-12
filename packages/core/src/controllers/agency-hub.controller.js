/**
 * Agency Hub Controller - Main API endpoints for agency management
 * Handles agency creation, management, and tenant operations
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
var AgencyHubController_1;
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Logger, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TenantGuard } from '../guards/tenant.guard';
import { AgencyRoleGuard } from '../guards/agency-role.guard';
import { Roles } from '../decorators/roles.decorator';
let AgencyHubController = AgencyHubController_1 = class AgencyHubController {
    logger = new Logger(AgencyHubController_1.name);
    async createAgency(createAgencyDto) {
        this.logger.log('Creating new agency');
        // Logic to create agency
        return { message: 'Agency created successfully' };
    }
    async getAllAgencies(page, limit, tier, status) {
        this.logger.log('Retrieving all agencies for master admin');
        // Logic to retrieve agencies
        return [];
    }
    async getAgencyById(agencyId) {
        this.logger.log(`Getting agency details for ID: ${agencyId}`);
        // Logic to get agency by ID
        return {};
    }
    async updateAgency(agencyId, updateAgencyDto) {
        this.logger.log(`Updating agency ID: ${agencyId}`);
        // Logic to update agency
        return { message: 'Agency updated successfully' };
    }
    async deleteAgency(agencyId) {
        this.logger.log(`Deleting agency ID: ${agencyId}`);
        // Logic to delete agency
        return { message: 'Agency deleted successfully' };
    }
    async getDashboardData() {
        this.logger.log('Getting dashboard data');
        // Logic to get dashboard data
        return {};
    }
    async getSwarmStatus() {
        this.logger.log('Getting swarm status');
        // Logic to get swarm status
        return {};
    }
    async initializeSwarm(initializeSwarmDto) {
        this.logger.log('Initializing swarm');
        // Logic to initialize swarm
        return { message: 'Swarm initialized successfully' };
    }
    async getAnalytics(period = '30d', metric) {
        this.logger.log(`Getting analytics for period: ${period}`);
        // Logic to get analytics
        return {};
    }
    async submitServiceRequest(serviceRequestDto) {
        this.logger.log('Submitting service request');
        // Logic to submit service request
        return { message: 'Service request submitted successfully' };
    }
    async getServiceRequests(status, category, page, limit) {
        this.logger.log('Getting service requests');
        // Logic to get service requests
        return [];
    }
    async getServiceProviders() {
        this.logger.log('Getting service providers');
        // Logic to get service providers
        return [];
    }
    async registerProvider(registerProviderDto) {
        this.logger.log('Registering provider');
        // Logic to register provider
        return { message: 'Provider registered successfully' };
    }
};
__decorate([
    Post('agencies'),
    ApiOperation({ summary: 'Create a new agency (Master Admin only)' }),
    ApiResponse({ status: 201, description: 'Agency created successfully' }),
    ApiResponse({ status: 400, description: 'Invalid input data' }),
    ApiResponse({ status: 409, description: 'Subdomain already exists' }),
    Roles('MASTER_ADMIN'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgencyHubController.prototype, "createAgency", null);
__decorate([
    Get('agencies'),
    ApiOperation({ summary: 'List all agencies (Master Admin only)' }),
    ApiQuery({ name: 'page', required: false }),
    ApiQuery({ name: 'limit', required: false }),
    ApiQuery({ name: 'tier', required: false }),
    ApiQuery({ name: 'status', required: false }),
    ApiResponse({ status: 200, description: 'Agencies retrieved successfully' }),
    Roles('MASTER_ADMIN'),
    __param(0, Query('page')),
    __param(1, Query('limit')),
    __param(2, Query('tier')),
    __param(3, Query('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], AgencyHubController.prototype, "getAllAgencies", null);
__decorate([
    Get('agencies/:agencyId'),
    ApiOperation({ summary: 'Get agency details (Master Admin only)' }),
    ApiParam({ name: 'agencyId', description: 'Agency ID' }),
    ApiResponse({ status: 200, description: 'Agency details retrieved' }),
    ApiResponse({ status: 404, description: 'Agency not found' }),
    Roles('MASTER_ADMIN'),
    __param(0, Param('agencyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgencyHubController.prototype, "getAgencyById", null);
__decorate([
    Put('agencies/:agencyId'),
    ApiOperation({ summary: 'Update agency (Master Admin only)' }),
    ApiParam({ name: 'agencyId', description: 'Agency ID' }),
    ApiResponse({ status: 200, description: 'Agency updated successfully' }),
    ApiResponse({ status: 404, description: 'Agency not found' }),
    Roles('MASTER_ADMIN'),
    __param(0, Param('agencyId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgencyHubController.prototype, "updateAgency", null);
__decorate([
    Delete('agencies/:agencyId'),
    ApiOperation({ summary: 'Delete agency (Master Admin only)' }),
    ApiParam({ name: 'agencyId', description: 'Agency ID' }),
    ApiResponse({ status: 200, description: 'Agency deleted successfully' }),
    ApiResponse({ status: 404, description: 'Agency not found' }),
    Roles('MASTER_ADMIN'),
    __param(0, Param('agencyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgencyHubController.prototype, "deleteAgency", null);
__decorate([
    Get('dashboard'),
    ApiOperation({ summary: 'Get agency dashboard data' }),
    ApiResponse({ status: 200, description: 'Dashboard data retrieved' }),
    Roles('AGENCY_ADMIN', 'AGENCY_MANAGER'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgencyHubController.prototype, "getDashboardData", null);
__decorate([
    Get('status'),
    ApiOperation({ summary: 'Get agency swarm status' }),
    ApiResponse({ status: 200, description: 'Swarm status retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgencyHubController.prototype, "getSwarmStatus", null);
__decorate([
    Post('initialize-swarm'),
    ApiOperation({ summary: 'Initialize swarm for agency' }),
    ApiResponse({ status: 200, description: 'Swarm initialized successfully' }),
    Roles('AGENCY_ADMIN'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgencyHubController.prototype, "initializeSwarm", null);
__decorate([
    Get('analytics'),
    ApiOperation({ summary: 'Get agency analytics' }),
    ApiQuery({ name: 'period', required: false, description: 'Time period (7d, 30d, 90d)' }),
    ApiQuery({ name: 'metric', required: false, description: 'Specific metric to retrieve' }),
    ApiResponse({ status: 200, description: 'Analytics data retrieved' }),
    Roles('AGENCY_ADMIN', 'AGENCY_MANAGER'),
    __param(0, Query('period')),
    __param(1, Query('metric')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AgencyHubController.prototype, "getAnalytics", null);
__decorate([
    Post('service-requests'),
    ApiOperation({ summary: 'Submit a service request' }),
    ApiResponse({ status: 201, description: 'Service request created' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgencyHubController.prototype, "submitServiceRequest", null);
__decorate([
    Get('service-requests'),
    ApiOperation({ summary: 'Get agency service requests' }),
    ApiQuery({ name: 'status', required: false }),
    ApiQuery({ name: 'category', required: false }),
    ApiQuery({ name: 'page', required: false }),
    ApiQuery({ name: 'limit', required: false }),
    ApiResponse({ status: 200, description: 'Service requests retrieved' }),
    __param(0, Query('status')),
    __param(1, Query('category')),
    __param(2, Query('page')),
    __param(3, Query('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AgencyHubController.prototype, "getServiceRequests", null);
__decorate([
    Get('providers'),
    ApiOperation({ summary: 'Get agency service providers' }),
    ApiResponse({ status: 200, description: 'Service providers retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgencyHubController.prototype, "getServiceProviders", null);
__decorate([
    Post('providers/register'),
    ApiOperation({ summary: 'Register an agent as a service provider' }),
    ApiResponse({ status: 201, description: 'Provider registered successfully' }),
    Roles('AGENCY_ADMIN', 'AGENCY_MANAGER'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgencyHubController.prototype, "registerProvider", null);
AgencyHubController = AgencyHubController_1 = __decorate([
    Controller('agency-hub'),
    ApiTags('Agency Hub'),
    UseGuards(TenantGuard, AgencyRoleGuard)
], AgencyHubController);
export { AgencyHubController };
