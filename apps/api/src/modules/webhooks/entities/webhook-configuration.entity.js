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
exports.WebhookConfiguration = void 0;
const typeorm_1 = require("typeorm");
let WebhookConfiguration = class WebhookConfiguration {
    id;
    organizationId;
    source;
    endpointUrl;
    secretKey;
    isActive;
    configuration;
    createdAt;
    updatedAt;
};
exports.WebhookConfiguration = WebhookConfiguration;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WebhookConfiguration.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'organization_id', type: 'uuid' }),
    __metadata("design:type", String)
], WebhookConfiguration.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], WebhookConfiguration.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'endpoint_url', type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], WebhookConfiguration.prototype, "endpointUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'secret_key', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], WebhookConfiguration.prototype, "secretKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], WebhookConfiguration.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], WebhookConfiguration.prototype, "configuration", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], WebhookConfiguration.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], WebhookConfiguration.prototype, "updatedAt", void 0);
exports.WebhookConfiguration = WebhookConfiguration = __decorate([
    (0, typeorm_1.Entity)('webhook_configurations')
], WebhookConfiguration);
