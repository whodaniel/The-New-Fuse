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
import { AuthGuard } from '../../guards/auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { EnhancedUserRole } from '@prisma/client';
let AgencyController = (() => {
    let _classDecorators = [ApiTags('agencies'), Controller('api/agencies'), UseGuards(AuthGuard), ApiBearerAuth()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _createAgency_decorators;
    let _getAgency_decorators;
    let _updateAgency_decorators;
    let _initializeSwarm_decorators;
    let _getSwarmStatus_decorators;
    let _registerProviders_decorators;
    let _getProviders_decorators;
    let _getAnalytics_decorators;
    var AgencyController = _classThis = class {
        constructor(enhancedAgencyService) {
            this.enhancedAgencyService = (__runInitializers(this, _instanceExtraInitializers), enhancedAgencyService);
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
    __setFunctionName(_classThis, "AgencyController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createAgency_decorators = [Post(), UseGuards(RolesGuard), Roles(EnhancedUserRole.SUPER_ADMIN), ApiOperation({ summary: 'Create a new agency with swarm capabilities' }), ApiResponse({ status: 201, description: 'Agency created successfully' })];
        _getAgency_decorators = [Get(':agencyId'), ApiOperation({ summary: 'Get agency details with swarm status' }), ApiResponse({ status: 200, description: 'Agency details retrieved' })];
        _updateAgency_decorators = [Put(':agencyId'), UseGuards(RolesGuard), Roles(EnhancedUserRole.AGENCY_OWNER, EnhancedUserRole.AGENCY_ADMIN), ApiOperation({ summary: 'Update agency configuration' }), ApiResponse({ status: 200, description: 'Agency updated successfully' })];
        _initializeSwarm_decorators = [Post(':agencyId/swarm/initialize'), UseGuards(RolesGuard), Roles(EnhancedUserRole.AGENCY_OWNER, EnhancedUserRole.AGENCY_ADMIN), ApiOperation({ summary: 'Initialize swarm for agency' }), ApiResponse({ status: 200, description: 'Swarm initialized successfully' })];
        _getSwarmStatus_decorators = [Get(':agencyId/swarm/status'), ApiOperation({ summary: 'Get current swarm status for agency' }), ApiResponse({ status: 200, description: 'Swarm status retrieved' })];
        _registerProviders_decorators = [Post(':agencyId/providers/register'), UseGuards(RolesGuard), Roles(EnhancedUserRole.AGENCY_ADMIN, EnhancedUserRole.AGENCY_MANAGER), ApiOperation({ summary: 'Register service providers' }), ApiResponse({ status: 201, description: 'Providers registered successfully' })];
        _getProviders_decorators = [Get(':agencyId/providers'), ApiOperation({ summary: 'Get all service providers for agency' }), ApiResponse({ status: 200, description: 'Providers retrieved successfully' })];
        _getAnalytics_decorators = [Get(':agencyId/analytics'), UseGuards(RolesGuard), Roles(EnhancedUserRole.AGENCY_OWNER, EnhancedUserRole.AGENCY_ADMIN), ApiOperation({ summary: 'Get agency performance analytics' }), ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })];
        __esDecorate(_classThis, null, _createAgency_decorators, { kind: "method", name: "createAgency", static: false, private: false, access: { has: obj => "createAgency" in obj, get: obj => obj.createAgency }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAgency_decorators, { kind: "method", name: "getAgency", static: false, private: false, access: { has: obj => "getAgency" in obj, get: obj => obj.getAgency }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateAgency_decorators, { kind: "method", name: "updateAgency", static: false, private: false, access: { has: obj => "updateAgency" in obj, get: obj => obj.updateAgency }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _initializeSwarm_decorators, { kind: "method", name: "initializeSwarm", static: false, private: false, access: { has: obj => "initializeSwarm" in obj, get: obj => obj.initializeSwarm }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSwarmStatus_decorators, { kind: "method", name: "getSwarmStatus", static: false, private: false, access: { has: obj => "getSwarmStatus" in obj, get: obj => obj.getSwarmStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _registerProviders_decorators, { kind: "method", name: "registerProviders", static: false, private: false, access: { has: obj => "registerProviders" in obj, get: obj => obj.registerProviders }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getProviders_decorators, { kind: "method", name: "getProviders", static: false, private: false, access: { has: obj => "getProviders" in obj, get: obj => obj.getProviders }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAnalytics_decorators, { kind: "method", name: "getAnalytics", static: false, private: false, access: { has: obj => "getAnalytics" in obj, get: obj => obj.getAnalytics }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AgencyController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AgencyController = _classThis;
})();
export { AgencyController };
