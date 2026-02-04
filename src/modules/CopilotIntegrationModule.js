"use strict";
/**
 * Copilot Integration Module
 *
 * NestJS module for GitHub Copilot VS Code integration system
 * Provides comprehensive chat participant management and multi-tenant support
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopilotIntegrationModule = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const CopilotIntegrationService_1 = require("../services/CopilotIntegrationService");
const CopilotIntegrationController_1 = require("../controllers/CopilotIntegrationController");
const websocket_module_1 = require("@the-new-fuse/core/websocket/websocket.module");
const database_1 = require("@the-new-fuse/database");
const auth_module_1 = require("../auth/auth.module");
let CopilotIntegrationModule = class CopilotIntegrationModule {
};
exports.CopilotIntegrationModule = CopilotIntegrationModule;
exports.CopilotIntegrationModule = CopilotIntegrationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            // Event system for real-time updates
            event_emitter_1.EventEmitterModule.forRoot({
                // Wildcards enabled for event pattern matching
                wildcard: false,
                // Delimiter for event namespacing
                delimiter: '.',
                // Enable new listener warnings
                newListener: false,
                // Remove listener warnings
                removeListener: false,
                // Maximum listeners per event
                maxListeners: 10,
                // Emit warning if memory leak detected
                verboseMemoryLeak: false,
                // Ignore cyclic references when serializing events
                ignoreErrors: false,
            }),
            // WebSocket support for real-time communication
            websocket_module_1.WebSocketModule,
            // Database access
            database_1.DatabaseModule,
            // Authentication and authorization
            auth_module_1.AuthModule,
        ],
        providers: [
            CopilotIntegrationService_1.CopilotIntegrationService,
        ],
        controllers: [
            CopilotIntegrationController_1.CopilotIntegrationController,
        ],
        exports: [
            // Export service for use in other modules
            CopilotIntegrationService_1.CopilotIntegrationService,
        ],
    })
], CopilotIntegrationModule);
//# sourceMappingURL=CopilotIntegrationModule.js.map