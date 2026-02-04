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
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const common_2 = require("@nestjs/common");
let NotificationService = NotificationService_1 = class NotificationService {
    eventEmitter;
    logger = new common_2.Logger(NotificationService_1.name);
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.initializeEventListeners();
    }
    initializeEventListeners() {
        // Subscribe to Roo's processed output events
        this.eventEmitter.on('roo.output.processed', (data) => {
            this.handleRooOutput(data);
        });
        // Subscribe to Roo's error events
        this.eventEmitter.on('roo.error', (error) => {
            this.handleRooError(error);
        });
    }
    handleRooOutput(data) {
        const { type, timestamp } = data;
        // Log the output with timestamp for tracking
        this.logger.log(`[${timestamp}] Roo ${type} output:`, data);
        // You can add custom notification logic here
        // For example, sending notifications to a UI component
        // or triggering specific actions based on the output type
    }
    handleRooError(errorData) {
        const { error, timestamp } = errorData;
        // Log errors with timestamp
        this.logger.error(`[${timestamp}] Roo processing error:`, error);
        // You can add custom error handling logic here
        // For example, sending error notifications or triggering recovery actions
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2])
], NotificationService);
//# sourceMappingURL=NotificationService.js.map