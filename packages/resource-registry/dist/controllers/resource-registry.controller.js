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
var ResourceRegistryController_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceRegistryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dto_js_1 = require("../dto.js");
const resource_access_control_service_js_1 = require("../services/resource-access-control.service.js");
const resource_registry_service_js_1 = require("../services/resource-registry.service.js");
const index_js_1 = require("../types/index.js");
// Import authentication guards - use service or user auth to support both
// JWT tokens (users) and API keys (services/agents)
const service_or_user_auth_guard_1 = require("../guards/service-or-user-auth.guard");
/**
 * Resource Registry Controller
 *
 * Manages resource CRUD operations, versioning, and access control.
 * All endpoints require authentication via JWT token or API key.
 *
 * @security ServiceOrUserAuth - Supports both JWT (users) and API key (services)
 * @see ServiceOrUserAuthGuard
 */
let ResourceRegistryController = ResourceRegistryController_1 = class ResourceRegistryController {
    constructor(resourceService, accessControl) {
        this.resourceService = resourceService;
        this.accessControl = accessControl;
        this.logger = new common_1.Logger(ResourceRegistryController_1.name);
    }
    /**
     * Create a new resource
     *
     * Creates a new resource in the registry. Requires authentication.
     * Access control is enforced based on user/agent permissions.
     *
     * @requires Authentication
     * @security ServiceOrUserAuth
     */
    async create(createDto, request) {
        this.logger.log(`Creating resource: ${createDto.name}`);
        const resource = await this.resourceService.create(createDto);
        // Log access
        const context = this.extractAccessContext(request);
        await this.resourceService.logAccess(resource.id, index_js_1.ResourceAction.UPDATE, context.userId || context.agentId, context.isAgent ? 'agent' : 'user');
        return resource;
    }
    /**
     * Search and list resources
     *
     * Retrieves resources based on search criteria. Results are filtered
     * based on user/agent access permissions.
     *
     * @requires Authentication
     * @security ServiceOrUserAuth
     */
    async search(searchDto, request) {
        this.logger.log('Searching resources');
        const result = await this.resourceService.search(searchDto);
        // Filter by access permissions
        const context = this.extractAccessContext(request);
        const filteredData = this.accessControl.filterByAccess(result.data, context);
        return {
            ...result,
            data: filteredData,
            total: filteredData.length,
        };
    }
    async getCategories() {
        this.logger.log('Getting categories');
        return this.resourceService.getCategories();
    }
    async findById(id, request) {
        this.logger.log(`Getting resource: ${id}`);
        const resource = await this.resourceService.findById(id);
        // Check access permissions
        const context = this.extractAccessContext(request);
        this.accessControl.assertCanView(resource, context);
        // Log access
        await this.resourceService.logAccess(resource.id, index_js_1.ResourceAction.VIEW, context.userId || context.agentId, context.isAgent ? 'agent' : 'user');
        return resource;
    }
    async update(id, updateDto, request) {
        this.logger.log(`Updating resource: ${id}`);
        const existingResource = await this.resourceService.findById(id);
        // Check access permissions
        const context = this.extractAccessContext(request);
        this.accessControl.assertCanModify(existingResource, context);
        const resource = await this.resourceService.update(id, updateDto);
        // Log access
        await this.resourceService.logAccess(resource.id, index_js_1.ResourceAction.UPDATE, context.userId || context.agentId, context.isAgent ? 'agent' : 'user');
        return resource;
    }
    async delete(id, request) {
        this.logger.log(`Deleting resource: ${id}`);
        const existingResource = await this.resourceService.findById(id);
        // Check access permissions
        const context = this.extractAccessContext(request);
        this.accessControl.assertCanDelete(existingResource, context);
        await this.resourceService.delete(id);
        // Log access
        await this.resourceService.logAccess(id, index_js_1.ResourceAction.DELETE, context.userId || context.agentId, context.isAgent ? 'agent' : 'user');
    }
    async getVersions(id, request) {
        this.logger.log(`Getting versions for resource: ${id}`);
        const resource = await this.resourceService.findById(id);
        // Check access permissions
        const context = this.extractAccessContext(request);
        this.accessControl.assertCanView(resource, context);
        return this.resourceService.getVersions(id);
    }
    async getVersion(id, version, request) {
        this.logger.log(`Getting version ${version} for resource: ${id}`);
        const resource = await this.resourceService.findById(id);
        // Check access permissions
        const context = this.extractAccessContext(request);
        this.accessControl.assertCanView(resource, context);
        return this.resourceService.getVersion(id, version);
    }
    async download(id, request) {
        this.logger.log(`Downloading resource: ${id}`);
        const resource = await this.resourceService.findById(id);
        // Check access permissions
        const context = this.extractAccessContext(request);
        this.accessControl.assertCanExecute(resource, context);
        // Log download
        await this.resourceService.logAccess(resource.id, index_js_1.ResourceAction.DOWNLOAD, context.userId || context.agentId, context.isAgent ? 'agent' : 'user');
        return {
            id: resource.id,
            name: resource.name,
            version: resource.version,
            content: resource.content,
            type: resource.type,
            category: resource.category,
        };
    }
    // Private helper methods
    extractAccessContext(request) {
        // Extract user/agent information from request
        // This should be populated by authentication middleware
        const user = request?.user;
        const agent = request?.agent;
        return {
            userId: user?.id,
            agentId: agent?.id,
            isAgent: !!agent,
            isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
            roles: user?.roles || [],
        };
    }
};
exports.ResourceRegistryController = ResourceRegistryController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new resource' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Resource created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Authentication required' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - Insufficient permissions' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof dto_js_1.CreateResourceDto !== "undefined" && dto_js_1.CreateResourceDto) === "function" ? _a : Object, Object]),
    __metadata("design:returntype", Promise)
], ResourceRegistryController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Search and list resources' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Resources retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Authentication required' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof dto_js_1.SearchResourceDto !== "undefined" && dto_js_1.SearchResourceDto) === "function" ? _b : Object, Object]),
    __metadata("design:returntype", Promise)
], ResourceRegistryController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all resource categories' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Categories retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ResourceRegistryController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a resource by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Resource ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Resource retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Resource not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ResourceRegistryController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a resource' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Resource ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Resource updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Resource not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_c = typeof dto_js_1.UpdateResourceDto !== "undefined" && dto_js_1.UpdateResourceDto) === "function" ? _c : Object, Object]),
    __metadata("design:returntype", Promise)
], ResourceRegistryController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a resource' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Resource ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Resource deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Resource not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ResourceRegistryController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)(':id/versions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all versions of a resource' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Resource ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Versions retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Resource not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ResourceRegistryController.prototype, "getVersions", null);
__decorate([
    (0, common_1.Get)(':id/versions/:version'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific version of a resource' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Resource ID' }),
    (0, swagger_1.ApiParam)({ name: 'version', description: 'Version number' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Version retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Resource or version not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('version')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ResourceRegistryController.prototype, "getVersion", null);
__decorate([
    (0, common_1.Post)(':id/download'),
    (0, swagger_1.ApiOperation)({ summary: 'Download a resource (logs download count)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Resource ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Resource content returned' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Resource not found' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Access denied' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ResourceRegistryController.prototype, "download", null);
exports.ResourceRegistryController = ResourceRegistryController = ResourceRegistryController_1 = __decorate([
    (0, swagger_1.ApiTags)('Resources'),
    (0, common_1.Controller)('api/resources'),
    (0, common_1.UseGuards)(service_or_user_auth_guard_1.ServiceOrUserAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [resource_registry_service_js_1.ResourceRegistryService,
        resource_access_control_service_js_1.ResourceAccessControlService])
], ResourceRegistryController);
//# sourceMappingURL=resource-registry.controller.js.map