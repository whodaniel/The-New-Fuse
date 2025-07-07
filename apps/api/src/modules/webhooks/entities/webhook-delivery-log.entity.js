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
exports.WebhookDeliveryLog = void 0;
const typeorm_1 = require("typeorm");
let WebhookDeliveryLog = class WebhookDeliveryLog {
    id;
    webhookConfigId;
    eventId;
    deliveryStatus;
    httpStatus;
    responseBody;
    errorMessage;
    attemptCount;
    deliveredAt;
    createdAt;
};
exports.WebhookDeliveryLog = WebhookDeliveryLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WebhookDeliveryLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'webhook_config_id', type: 'uuid' }),
    __metadata("design:type", String)
], WebhookDeliveryLog.prototype, "webhookConfigId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'event_id', type: 'uuid' }),
    __metadata("design:type", String)
], WebhookDeliveryLog.prototype, "eventId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivery_status', type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], WebhookDeliveryLog.prototype, "deliveryStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'http_status', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], WebhookDeliveryLog.prototype, "httpStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'response_body', type: 'text', nullable: true }),
    __metadata("design:type", String)
], WebhookDeliveryLog.prototype, "responseBody", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', type: 'text', nullable: true }),
    __metadata("design:type", String)
], WebhookDeliveryLog.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'attempt_count', type: 'int', default: 1 }),
    __metadata("design:type", Number)
], WebhookDeliveryLog.prototype, "attemptCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivered_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], WebhookDeliveryLog.prototype, "deliveredAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], WebhookDeliveryLog.prototype, "createdAt", void 0);
exports.WebhookDeliveryLog = WebhookDeliveryLog = __decorate([
    (0, typeorm_1.Entity)('webhook_delivery_logs'),
    (0, typeorm_1.Index)('idx_webhook_delivery_config', ['webhookConfigId']),
    (0, typeorm_1.Index)('idx_webhook_delivery_event', ['eventId']),
    (0, typeorm_1.Index)('idx_webhook_delivery_status', ['deliveryStatus'])
], WebhookDeliveryLog);
