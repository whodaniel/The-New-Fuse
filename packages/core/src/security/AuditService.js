"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const LoggingService_1 = require("../services/LoggingService");
const ConfigService_1 = require("../config/ConfigService");
let AuditService = class AuditService {
    logger;
    configService;
    constructor(logger, configService) {
        this.logger = logger;
        this.configService = configService;
        this.logger.log('AuditService initialized', 'AuditService');
    }
    /**
     * Logs an audit event.
     * @param event The audit event to log.
     */
    logEvent(event) {
        const auditEvent = {
            ...event,
            timestamp: new Date(),
        };
        // In a real system, this would write to a dedicated audit log (e.g., a separate file, database, or service).
        // For now, we use a structured log message via the existing LoggingService.
        this.logger.log('AUDIT', 'AuditService', auditEvent);
    }
    // Example of listening for an event from another service
    handleUserCreatedEvent(payload) {
        this.logEvent({
            actor: { id: payload.userId, type: 'user' },
            action: 'user.create',
            resource: { id: payload.userId, type: 'user' },
            status: 'success',
            details: { username: payload.username, email: payload.email },
        });
    }
    handleUserLoginEvent(payload) {
        this.logEvent({
            actor: { id: payload.userId, type: 'user' },
            action: 'user.login',
            resource: { id: payload.userId, type: 'user' },
            status: 'success',
        });
    }
    handleAgentStartedEvent(payload) {
        this.logEvent({
            actor: { id: 'system', type: 'system' }, // Or the user who initiated the start
            action: 'agent.start',
            resource: { id: payload.id, type: 'agent' },
            status: 'success',
        });
    }
    handleAgentStoppedEvent(payload) {
        this.logEvent({
            actor: { id: 'system', type: 'system' },
            action: 'agent.stop',
            resource: { id: payload.id, type: 'agent' },
            status: 'success',
        });
    }
};
exports.AuditService = AuditService;
__decorate([
    (0, event_emitter_1.OnEvent)('user.created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuditService.prototype, "handleUserCreatedEvent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('user.login'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuditService.prototype, "handleUserLoginEvent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('agent.started'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuditService.prototype, "handleAgentStartedEvent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('agent.stopped'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuditService.prototype, "handleAgentStoppedEvent", null);
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService,
        ConfigService_1.ConfigService])
], AuditService);
exports.default = AuditService;
//# sourceMappingURL=AuditService.js.map