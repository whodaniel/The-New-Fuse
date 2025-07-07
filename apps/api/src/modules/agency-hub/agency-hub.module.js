"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgencyHubModule = void 0;
const common_1 = require("@nestjs/common");
const agency_hub_module_1 = require("@the-new-fuse/core/modules/agency-hub.module");
// Import existing controllers to maintain compatibility
const agency_controller_1 = require("./controllers/agency.controller");
const swarm_controller_1 = require("./controllers/swarm.controller");
const service_request_controller_1 = require("./controllers/service-request.controller");
const analytics_controller_1 = require("./controllers/analytics.controller");
let AgencyHubModule = class AgencyHubModule {
};
exports.AgencyHubModule = AgencyHubModule;
exports.AgencyHubModule = AgencyHubModule = __decorate([
    (0, common_1.Module)({
        imports: [
            // Import the comprehensive Agency Hub module from core
            agency_hub_module_1.AgencyHubModule,
        ],
        controllers: [
            // Keep existing controllers for backward compatibility
            // These will work alongside the core controllers
            agency_controller_1.AgencyController,
            swarm_controller_1.SwarmController,
            service_request_controller_1.ServiceRequestController,
            analytics_controller_1.AnalyticsController,
        ],
        // Re-export everything from the core module
        exports: [agency_hub_module_1.AgencyHubModule],
    })
], AgencyHubModule);
