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
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CopilotIntegrationService } from '../services/CopilotIntegrationService';
import { CopilotIntegrationController } from '../controllers/CopilotIntegrationController';
import { WebSocketModule } from '@the-new-fuse/core/websocket/websocket.module';
import { DatabaseModule } from '@the-new-fuse/database';
import { AuthModule } from '../auth/auth.module';
let CopilotIntegrationModule = class CopilotIntegrationModule {
};
CopilotIntegrationModule = __decorate([
    Module({
        imports: [
            // Event system for real-time updates
            EventEmitterModule.forRoot({
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
            WebSocketModule,
            // Database access
            DatabaseModule,
            // Authentication and authorization
            AuthModule,
        ],
        providers: [
            CopilotIntegrationService,
        ],
        controllers: [
            CopilotIntegrationController,
        ],
        exports: [
            // Export service for use in other modules
            CopilotIntegrationService,
        ],
    })
], CopilotIntegrationModule);
export { CopilotIntegrationModule };
