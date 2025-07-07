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
exports.BusinessEvent = void 0;
const typeorm_1 = require("typeorm");
let BusinessEvent = class BusinessEvent {
    id;
    type;
    source;
    organizationId;
    userId;
    correlationId;
    data;
    metadata;
    processingStatus;
    retryCount;
    createdAt;
    updatedAt;
    processedAt;
};
exports.BusinessEvent = BusinessEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BusinessEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], BusinessEvent.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], BusinessEvent.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'organization_id', type: 'uuid' }),
    __metadata("design:type", String)
], BusinessEvent.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], BusinessEvent.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'correlation_id', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], BusinessEvent.prototype, "correlationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], BusinessEvent.prototype, "data", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], BusinessEvent.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'processing_status',
        type: 'varchar',
        length: 20,
        default: 'pending'
    }),
    __metadata("design:type", String)
], BusinessEvent.prototype, "processingStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'retry_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], BusinessEvent.prototype, "retryCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], BusinessEvent.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], BusinessEvent.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'processed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], BusinessEvent.prototype, "processedAt", void 0);
exports.BusinessEvent = BusinessEvent = __decorate([
    (0, typeorm_1.Entity)('business_events'),
    (0, typeorm_1.Index)('idx_business_events_org_type', ['organizationId', 'type']),
    (0, typeorm_1.Index)('idx_business_events_status', ['processingStatus']),
    (0, typeorm_1.Index)('idx_business_events_created', ['createdAt']),
    (0, typeorm_1.Index)('idx_business_events_correlation', ['correlationId'])
], BusinessEvent);
