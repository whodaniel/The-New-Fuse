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
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
let WebhooksService = class WebhooksService {
    constructor() { }
    async create(data) {
        return { id: 'webhook-1', ...data, createdAt: new Date(), updatedAt: new Date() };
    }
    async findAll() {
        return [];
    }
    async findOne(id) {
        return { id, name: 'Sample Webhook', createdAt: new Date(), updatedAt: new Date() };
    }
    async update(id, data) {
        return { id, ...data, updatedAt: new Date() };
    }
    async remove(id) {
        return { id, deleted: true };
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map