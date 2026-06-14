var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var VisualizationManager_1;
import { Injectable, Logger } from '@nestjs/common';
let VisualizationManager = VisualizationManager_1 = class VisualizationManager {
    constructor() {
        this.logger = new Logger(VisualizationManager_1.name);
        this.visualizations = new Map();
    }
    async createVisualization(config) {
        try {
            this.visualizations.set(config.id, config);
            this.logger.log(`Created visualization: ${config.id} (${config.type})`);
            return {
                id: config.id,
                output: JSON.stringify(config.data),
                format: 'json',
                metadata: config.options
            };
        }
        catch (error) {
            this.logger.error('Failed to create visualization', error);
            throw error;
        }
    }
    getVisualization(id) {
        return this.visualizations.get(id);
    }
    async updateVisualization(id, updates) {
        const existing = this.visualizations.get(id);
        if (!existing) {
            throw new Error(`Visualization not found: ${id}`);
        }
        const updated = { ...existing, ...updates, id };
        this.visualizations.set(id, updated);
        return {
            id,
            output: JSON.stringify(updated.data),
            format: 'json',
            metadata: updated.options
        };
    }
    deleteVisualization(id) {
        return this.visualizations.delete(id);
    }
    getAllVisualizations() {
        return Array.from(this.visualizations.values());
    }
};
VisualizationManager = VisualizationManager_1 = __decorate([
    Injectable()
], VisualizationManager);
export { VisualizationManager };
//# sourceMappingURL=VisualizationManager_clean.js.map