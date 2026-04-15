import { Injectable, Logger } from '@nestjs/common';

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  services: string[];
}

export interface RouteRequest {
  category: string;
  service?: string;
  payload?: any;
}

@Injectable()
export class ServiceCategoryRouter {
  private readonly logger = new Logger(ServiceCategoryRouter.name);
  private categories = new Map<string, ServiceCategory>();

  registerCategory(category: ServiceCategory): void {
    this.categories.set(category.id, category);
    this.logger.log(`Registered category: ${category.name}`);
  }

  async route(request: RouteRequest): Promise<any> {
    try {
      const category = this.categories.get(request.category);
      if (!category) {
        throw new Error(`Category not found: ${request.category}`);
      }

      // Placeholder implementation for routing logic
      this.logger.log(`Routing request to category: ${category.name}`);
      return { success: true, category: category.name };
    } catch (error) {
      this.logger.error('Failed to route request', error);
      throw error;
    }
  }

  getCategories(): ServiceCategory[] {
    return Array.from(this.categories.values());
  }
}
