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
exports.BusinessAnalytics = void 0;
const typeorm_1 = require("typeorm");
let BusinessAnalytics = class BusinessAnalytics {
    id;
    organizationId;
    metricType;
    metricValue;
    dimensions;
    timestamp;
    createdAt;
};
exports.BusinessAnalytics = BusinessAnalytics;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BusinessAnalytics.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'organization_id', type: 'uuid' }),
    __metadata("design:type", String)
], BusinessAnalytics.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'metric_type', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], BusinessAnalytics.prototype, "metricType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'metric_value', type: 'decimal', precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], BusinessAnalytics.prototype, "metricValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], BusinessAnalytics.prototype, "dimensions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], BusinessAnalytics.prototype, "timestamp", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], BusinessAnalytics.prototype, "createdAt", void 0);
exports.BusinessAnalytics = BusinessAnalytics = __decorate([
    (0, typeorm_1.Entity)('business_analytics')
], BusinessAnalytics);
