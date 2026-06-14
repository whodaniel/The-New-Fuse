var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationHandler_1;
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
let NotificationHandler = NotificationHandler_1 = class NotificationHandler {
    constructor() {
        this.logger = new Logger(NotificationHandler_1.name);
    }
    handle(payload) {
        this.logger.log(`Handling notification: ${JSON.stringify(payload)}`);
        // This is a placeholder for a more robust implementation that would
        // send the notification to the appropriate channel (e.g., email, SMS, push).
    }
};
__decorate([
    OnEvent('notification.*'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationHandler.prototype, "handle", null);
NotificationHandler = NotificationHandler_1 = __decorate([
    Injectable()
], NotificationHandler);
export { NotificationHandler };
//# sourceMappingURL=notification.handler.js.map