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
var _a;
import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, HttpStatus, HttpException, } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EnhancedAgencyService } from '@the-new-fuse/core/services/enhanced-agency.service';
import { AuthGuard } from '../../guards/auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { EnhancedUserRole } from '@prisma/client';
let AgencyController = class AgencyController {
    enhancedAgencyService;
    constructor(enhancedAgencyService) {
        this.enhancedAgencyService = enhancedAgencyService;
    }
    async createAgency(createAgencyDto) {
        try {
            return await this.enhancedAgencyService.createAgencyWithSwarm(createAgencyDto);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to create agency', HttpStatus.BAD_REQUEST);
        }
    }
    async getAgency(agencyId) {
        try {
            return await this.enhancedAgencyService.getAgencyWithSwarmStatus(agencyId);
        }
        catch (error) {
            throw new HttpException(error.message || 'Agency not found', HttpStatus.NOT_FOUND);
        }
    }
    async updateAgency(agencyId, updateAgencyDto) {
        try {
            return await this.enhancedAgencyService.updateAgencyConfiguration(agencyId, updateAgencyDto);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to update agency', HttpStatus.BAD_REQUEST);
        }
    }
    async initializeSwarm(agencyId, config) {
        try {
            return await this.enhancedAgencyService.initializeSwarm(agencyId, config);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to initialize swarm', HttpStatus.BAD_REQUEST);
        }
    }
    async getSwarmStatus(agencyId) {
        try {
            return await this.enhancedAgencyService.getSwarmStatus(agencyId);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to get swarm status', HttpStatus.NOT_FOUND);
        }
    }
    async registerProviders(agencyId, providersDto) {
        try {
            return await this.enhancedAgencyService.registerProviders(agencyId, providersDto);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to register providers', HttpStatus.BAD_REQUEST);
        }
    }
    async getProviders(agencyId, categoryId, active) {
        try {
            return await this.enhancedAgencyService.getProviders(agencyId, {
                categoryId,
                active
            });
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to get providers', HttpStatus.NOT_FOUND);
        }
    }
    async getAnalytics(agencyId, timeframe = '30d') {
        try {
            return await this.enhancedAgencyService.getAnalytics(agencyId, timeframe);
        }
        catch (error) {
            throw new HttpException(error.message || 'Failed to get analytics', HttpStatus.NOT_FOUND);
        }
    }
};
__decorate([
    Post(),
    UseGuards(RolesGuard),
    Roles(EnhancedUserRole.SUPER_ADMIN),
    ApiOperation({ summary: 'Create a new agency with swarm capabilities' }),
    ApiResponse({ status: 201, description: 'Agency created successfully' }),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "createAgency", null);
__decorate([
    Get(':agencyId'),
    ApiOperation({ summary: 'Get agency details with swarm status' }),
    ApiResponse({ status: 200, description: 'Agency details retrieved' }),
    __param(0, Param('agencyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "getAgency", null);
__decorate([
    Put(':agencyId'),
    UseGuards(RolesGuard),
    Roles(EnhancedUserRole.AGENCY_OWNER, EnhancedUserRole.AGENCY_ADMIN),
    ApiOperation({ summary: 'Update agency configuration' }),
    ApiResponse({ status: 200, description: 'Agency updated successfully' }),
    __param(0, Param('agencyId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "updateAgency", null);
__decorate([
    Post(':agencyId/swarm/initialize'),
    UseGuards(RolesGuard),
    Roles(EnhancedUserRole.AGENCY_OWNER, EnhancedUserRole.AGENCY_ADMIN),
    ApiOperation({ summary: 'Initialize swarm for agency' }),
    ApiResponse({ status: 200, description: 'Swarm initialized successfully' }),
    __param(0, Param('agencyId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "initializeSwarm", null);
__decorate([
    Get(':agencyId/swarm/status'),
    ApiOperation({ summary: 'Get current swarm status for agency' }),
    ApiResponse({ status: 200, description: 'Swarm status retrieved' }),
    __param(0, Param('agencyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "getSwarmStatus", null);
__decorate([
    Post(':agencyId/providers/register'),
    UseGuards(RolesGuard),
    Roles(EnhancedUserRole.AGENCY_ADMIN, EnhancedUserRole.AGENCY_MANAGER),
    ApiOperation({ summary: 'Register service providers' }),
    ApiResponse({ status: 201, description: 'Providers registered successfully' }),
    __param(0, Param('agencyId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "registerProviders", null);
__decorate([
    Get(':agencyId/providers'),
    ApiOperation({ summary: 'Get all service providers for agency' }),
    ApiResponse({ status: 200, description: 'Providers retrieved successfully' }),
    __param(0, Param('agencyId')),
    __param(1, Query('categoryId')),
    __param(2, Query('active')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Boolean]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "getProviders", null);
__decorate([
    Get(':agencyId/analytics'),
    UseGuards(RolesGuard),
    Roles(EnhancedUserRole.AGENCY_OWNER, EnhancedUserRole.AGENCY_ADMIN),
    ApiOperation({ summary: 'Get agency performance analytics' }),
    ApiResponse({ status: 200, description: 'Analytics retrieved successfully' }),
    __param(0, Param('agencyId')),
    __param(1, Query('timeframe')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AgencyController.prototype, "getAnalytics", null);
AgencyController = __decorate([
    ApiTags('agencies'),
    Controller('api/agencies'),
    UseGuards(AuthGuard),
    ApiBearerAuth(),
    __metadata("design:paramtypes", [typeof (_a = typeof EnhancedAgencyService !== "undefined" && EnhancedAgencyService) === "function" ? _a : Object])
], AgencyController);
export { AgencyController };
//# sourceMappingURL=agency.controller.js.map