"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgencyHubHealthIndicator = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
let AgencyHubHealthIndicator = class AgencyHubHealthIndicator extends terminus_1.HealthIndicator {
    async isHealthy(key = 'agency-hub') {
        const isHealthy = true; // Placeholder - implement actual health check
        const result = this.getStatus(key, isHealthy, {
            status: 'up',
            timestamp: new Date().toISOString(),
            services: {
                database: 'up',
                api: 'up',
            },
        });
        return result;
    }
};
exports.AgencyHubHealthIndicator = AgencyHubHealthIndicator;
exports.AgencyHubHealthIndicator = AgencyHubHealthIndicator = __decorate([
    (0, common_1.Injectable)()
], AgencyHubHealthIndicator);
//# sourceMappingURL=AgencyHubHealthIndicator.js.map