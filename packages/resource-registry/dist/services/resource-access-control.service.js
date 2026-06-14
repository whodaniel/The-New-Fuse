"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ResourceAccessControlService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceAccessControlService = void 0;
const common_1 = require("@nestjs/common");
const index_js_1 = require("../types/index.js");
let ResourceAccessControlService = ResourceAccessControlService_1 = class ResourceAccessControlService {
    constructor() {
        this.logger = new common_1.Logger(ResourceAccessControlService_1.name);
    }
    /**
     * Check if accessor can view a resource
     */
    canView(resource, context) {
        // Public resources are accessible to everyone
        if (resource.visibility === index_js_1.ResourceVisibility.PUBLIC) {
            return true;
        }
        // Agents-only resources
        if (resource.visibility === index_js_1.ResourceVisibility.AGENTS_ONLY) {
            return context.isAgent;
        }
        // Private resources - only creator can access
        if (resource.visibility === index_js_1.ResourceVisibility.PRIVATE) {
            return this.isOwner(resource, context) || context.isAdmin;
        }
        // Restricted resources - require specific permissions
        if (resource.visibility === index_js_1.ResourceVisibility.RESTRICTED) {
            return context.isAdmin || this.isOwner(resource, context);
        }
        // Internal resources - require authentication
        if (resource.visibility === index_js_1.ResourceVisibility.INTERNAL) {
            return !!(context.userId || context.agentId) || context.isAdmin;
        }
        return false;
    }
    /**
     * Check if accessor can modify a resource
     */
    canModify(resource, context) {
        return this.isOwner(resource, context) || context.isAdmin;
    }
    /**
     * Check if accessor can delete a resource
     */
    canDelete(resource, context) {
        return this.isOwner(resource, context) || context.isAdmin;
    }
    /**
     * Check if accessor can execute/download a resource
     */
    canExecute(resource, context) {
        // Execute permissions follow view permissions
        return this.canView(resource, context);
    }
    /**
     * Assert that accessor can execute/download a resource (throws if not allowed)
     */
    assertCanExecute(resource, context) {
        if (!this.canExecute(resource, context)) {
            this.logger.warn(`Execution denied for resource ${resource.id} to ${context.userId || context.agentId}`);
            throw new common_1.ForbiddenException('You do not have permission to execute this resource');
        }
    }
    /**
     * Assert that accessor can view a resource (throws if not allowed)
     */
    assertCanView(resource, context) {
        if (!this.canView(resource, context)) {
            this.logger.warn(`Access denied for resource ${resource.id} to ${context.userId || context.agentId}`);
            throw new common_1.ForbiddenException('You do not have permission to view this resource');
        }
    }
    /**
     * Assert that accessor can modify a resource (throws if not allowed)
     */
    assertCanModify(resource, context) {
        if (!this.canModify(resource, context)) {
            this.logger.warn(`Modification denied for resource ${resource.id} to ${context.userId || context.agentId}`);
            throw new common_1.ForbiddenException('You do not have permission to modify this resource');
        }
    }
    /**
     * Assert that accessor can delete a resource (throws if not allowed)
     */
    assertCanDelete(resource, context) {
        if (!this.canDelete(resource, context)) {
            this.logger.warn(`Deletion denied for resource ${resource.id} to ${context.userId || context.agentId}`);
            throw new common_1.ForbiddenException('You do not have permission to delete this resource');
        }
    }
    /**
     * Filter resources based on access permissions
     */
    filterByAccess(resources, context) {
        return resources.filter((resource) => this.canView(resource, context));
    }
    /**
     * Get visibility options available to accessor
     */
    getAvailableVisibilities(context) {
        const visibilities = [index_js_1.ResourceVisibility.PUBLIC];
        if (context.userId || context.agentId) {
            visibilities.push(index_js_1.ResourceVisibility.PRIVATE);
            visibilities.push(index_js_1.ResourceVisibility.INTERNAL);
        }
        if (context.isAdmin) {
            visibilities.push(index_js_1.ResourceVisibility.RESTRICTED);
            visibilities.push(index_js_1.ResourceVisibility.AGENTS_ONLY);
        }
        return visibilities;
    }
    // Private helper methods
    isOwner(resource, context) {
        if (context.userId && resource.authorId === context.userId) {
            return true;
        }
        if (context.agentId && resource.authorId === context.agentId) {
            return true;
        }
        return false;
    }
};
exports.ResourceAccessControlService = ResourceAccessControlService;
exports.ResourceAccessControlService = ResourceAccessControlService = ResourceAccessControlService_1 = __decorate([
    (0, common_1.Injectable)()
], ResourceAccessControlService);
//# sourceMappingURL=resource-access-control.service.js.map