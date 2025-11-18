import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { ResourceVisibility, Resource } from '../types';

export interface AccessContext {
  userId?: string;
  agentId?: string;
  isAgent: boolean;
  isAdmin: boolean;
  roles?: string[];
}

@Injectable()
export class ResourceAccessControlService {
  private readonly logger = new Logger(ResourceAccessControlService.name);

  /**
   * Check if accessor can view a resource
   */
  canView(resource: Resource, context: AccessContext): boolean {
    // Public resources are accessible to everyone
    if (resource.visibility === ResourceVisibility.PUBLIC) {
      return true;
    }

    // Agents-only resources
    if (resource.visibility === ResourceVisibility.AGENTS_ONLY) {
      return context.isAgent;
    }

    // Private resources - only creator can access
    if (resource.visibility === ResourceVisibility.PRIVATE) {
      return this.isOwner(resource, context) || context.isAdmin;
    }

    // Restricted resources - require specific permissions
    if (resource.visibility === ResourceVisibility.RESTRICTED) {
      return context.isAdmin || this.isOwner(resource, context);
    }

    // Internal resources - require authentication
    if (resource.visibility === ResourceVisibility.INTERNAL) {
      return !!(context.userId || context.agentId) || context.isAdmin;
    }

    return false;
  }

  /**
   * Check if accessor can modify a resource
   */
  canModify(resource: Resource, context: AccessContext): boolean {
    return this.isOwner(resource, context) || context.isAdmin;
  }

  /**
   * Check if accessor can delete a resource
   */
  canDelete(resource: Resource, context: AccessContext): boolean {
    return this.isOwner(resource, context) || context.isAdmin;
  }

  /**
   * Check if accessor can execute/download a resource
   */
  canExecute(resource: Resource, context: AccessContext): boolean {
    // Execute permissions follow view permissions
    return this.canView(resource, context);
  }

  /**
   * Assert that accessor can view a resource (throws if not allowed)
   */
  assertCanView(resource: Resource, context: AccessContext): void {
    if (!this.canView(resource, context)) {
      this.logger.warn(`Access denied for resource ${resource.id} to ${context.userId || context.agentId}`);
      throw new ForbiddenException('You do not have permission to view this resource');
    }
  }

  /**
   * Assert that accessor can modify a resource (throws if not allowed)
   */
  assertCanModify(resource: Resource, context: AccessContext): void {
    if (!this.canModify(resource, context)) {
      this.logger.warn(`Modification denied for resource ${resource.id} to ${context.userId || context.agentId}`);
      throw new ForbiddenException('You do not have permission to modify this resource');
    }
  }

  /**
   * Assert that accessor can delete a resource (throws if not allowed)
   */
  assertCanDelete(resource: Resource, context: AccessContext): void {
    if (!this.canDelete(resource, context)) {
      this.logger.warn(`Deletion denied for resource ${resource.id} to ${context.userId || context.agentId}`);
      throw new ForbiddenException('You do not have permission to delete this resource');
    }
  }

  /**
   * Filter resources based on access permissions
   */
  filterByAccess(resources: Resource[], context: AccessContext): Resource[] {
    return resources.filter((resource) => this.canView(resource, context));
  }

  /**
   * Get visibility options available to accessor
   */
  getAvailableVisibilities(context: AccessContext): ResourceVisibility[] {
    const visibilities: ResourceVisibility[] = [ResourceVisibility.PUBLIC];

    if (context.userId || context.agentId) {
      visibilities.push(ResourceVisibility.PRIVATE);
      visibilities.push(ResourceVisibility.INTERNAL);
    }

    if (context.isAdmin) {
      visibilities.push(ResourceVisibility.RESTRICTED);
      visibilities.push(ResourceVisibility.AGENTS_ONLY);
    }

    return visibilities;
  }

  // Private helper methods

  private isOwner(resource: Resource, context: AccessContext): boolean {
    if (context.userId && resource.authorId === context.userId) {
      return true;
    }

    if (context.agentId && resource.authorId === context.agentId) {
      return true;
    }

    return false;
  }
}
