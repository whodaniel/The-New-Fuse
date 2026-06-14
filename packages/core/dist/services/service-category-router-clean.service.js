var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ServiceCategoryRouter_1;
import { Injectable, Logger } from '@nestjs/common';
let ServiceCategoryRouter = ServiceCategoryRouter_1 = class ServiceCategoryRouter {
    constructor() {
        this.logger = new Logger(ServiceCategoryRouter_1.name);
        this.categories = new Map();
    }
    registerCategory(category) {
        this.categories.set(category.id, category);
        this.logger.log(`Registered category: ${category.name}`);
    }
    async route(request) {
        try {
            const category = this.categories.get(request.category);
            if (!category) {
                throw new Error(`Category not found: ${request.category}`);
            }
            // Placeholder implementation for routing logic
            this.logger.log(`Routing request to category: ${category.name}`);
            return { success: true, category: category.name };
        }
        catch (error) {
            this.logger.error('Failed to route request', error);
            throw error;
        }
    }
    getCategories() {
        return Array.from(this.categories.values());
    }
};
ServiceCategoryRouter = ServiceCategoryRouter_1 = __decorate([
    Injectable()
], ServiceCategoryRouter);
export { ServiceCategoryRouter };
//# sourceMappingURL=service-category-router-clean.service.js.map