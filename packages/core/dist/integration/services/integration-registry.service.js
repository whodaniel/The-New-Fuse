var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var IntegrationRegistryService_1;
import { Injectable, Logger } from '@nestjs/common';
let IntegrationRegistryService = IntegrationRegistryService_1 = class IntegrationRegistryService {
    constructor() {
        this.logger = new Logger(IntegrationRegistryService_1.name);
        this.integrations = new Map();
    }
    registerIntegration(metadata) {
        this.integrations.set(metadata.id, metadata);
        this.logger.log(`Registered integration: ${metadata.name} (${metadata.id})`);
    }
    unregisterIntegration(id) {
        const removed = this.integrations.delete(id);
        if (removed) {
            this.logger.log(`Unregistered integration: ${id}`);
        }
        return removed;
    }
    getIntegration(id) {
        return this.integrations.get(id);
    }
    listIntegrations() {
        return Array.from(this.integrations.values());
    }
    findIntegrationsByCategory(category) {
        return this.listIntegrations().filter(integration => integration.category === category);
    }
    findIntegrationsByTag(tag) {
        return this.listIntegrations().filter(integration => integration.tags.includes(tag));
    }
};
IntegrationRegistryService = IntegrationRegistryService_1 = __decorate([
    Injectable()
], IntegrationRegistryService);
export { IntegrationRegistryService };
//# sourceMappingURL=integration-registry.service.js.map