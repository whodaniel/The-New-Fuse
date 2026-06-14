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
var ResourceRegistryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceRegistryService = void 0;
const common_1 = require("@nestjs/common");
let ResourceRegistryService = ResourceRegistryService_1 = class ResourceRegistryService {
    constructor() {
        this.logger = new common_1.Logger(ResourceRegistryService_1.name);
        // Database initialization would go here (e.g. Drizzle)
    }
    async onModuleDestroy() {
        // Cleanup
    }
    /**
     * Create a new resource
     */
    async create(dto) {
        this.logger.log(`Creating resource: ${dto.name}`);
        throw new Error('Method not implemented. Migration to Drizzle required.');
    }
    /**
     * Find resource by ID
     */
    async findById(id) {
        throw new Error('Method not implemented. Migration to Drizzle required.');
    }
    /**
     * Search resources with filters, sorting, and pagination
     */
    async search(dto) {
        throw new Error('Method not implemented. Migration to Drizzle required.');
    }
    /**
     * Update a resource
     */
    async update(id, dto) {
        this.logger.log(`Updating resource: ${id}`);
        throw new Error('Method not implemented. Migration to Drizzle required.');
    }
    /**
     * Delete a resource (soft delete)
     */
    async delete(id) {
        this.logger.log(`Deleting resource: ${id}`);
        throw new Error('Method not implemented. Migration to Drizzle required.');
    }
    /**
     * Get all categories
     */
    async getCategories() {
        throw new Error('Method not implemented. Migration to Drizzle required.');
    }
    /**
     * Log resource access
     */
    async logAccess(resourceId, action, accessorId, accessorType = 'system', metadata) {
        // Silently fail for logs during migration? Or throw?
        // Throwing is safer to detect usage.
        throw new Error('Method not implemented. Migration to Drizzle required.');
    }
    /**
     * Get resource versions
     */
    async getVersions(resourceId) {
        throw new Error('Method not implemented. Migration to Drizzle required.');
    }
    /**
     * Get specific version
     */
    async getVersion(resourceId, version) {
        throw new Error('Method not implemented. Migration to Drizzle required.');
    }
};
exports.ResourceRegistryService = ResourceRegistryService;
exports.ResourceRegistryService = ResourceRegistryService = ResourceRegistryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ResourceRegistryService);
//# sourceMappingURL=resource-registry.service.js.map