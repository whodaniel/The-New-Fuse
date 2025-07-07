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
exports.SseSubscription = void 0;
const typeorm_1 = require("typeorm");
let SseSubscription = class SseSubscription {
    id;
    clientId;
    userId;
    organizationId;
    eventTypes;
    filters;
    createdAt;
    lastHeartbeat;
};
exports.SseSubscription = SseSubscription;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SseSubscription.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_id', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], SseSubscription.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], SseSubscription.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'organization_id', type: 'uuid' }),
    __metadata("design:type", String)
], SseSubscription.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'event_types', type: 'text', array: true }),
    __metadata("design:type", Array)
], SseSubscription.prototype, "eventTypes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SseSubscription.prototype, "filters", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], SseSubscription.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'last_heartbeat',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP'
    }),
    __metadata("design:type", Date)
], SseSubscription.prototype, "lastHeartbeat", void 0);
exports.SseSubscription = SseSubscription = __decorate([
    (0, typeorm_1.Entity)('sse_subscriptions')
], SseSubscription);
