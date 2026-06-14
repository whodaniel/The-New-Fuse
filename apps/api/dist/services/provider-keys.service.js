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
exports.ProviderKeysService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
let ProviderKeysService = class ProviderKeysService {
    constructor(db) {
        this.db = db;
    }
    async listForUser(userId) {
        const rows = await this.db.providerApiKeys.listByUser(userId);
        return rows.map((row) => ({
            id: row.id,
            provider: row.provider,
        }));
    }
    async saveForUser(userId, dto) {
        const row = await this.db.providerApiKeys.upsert(userId, dto.provider, dto.apiKey);
        return {
            id: row.id,
            provider: row.provider,
        };
    }
    async deleteForUser(userId, id) {
        const deleted = await this.db.providerApiKeys.deleteByUserAndId(userId, id);
        if (!deleted) {
            throw new common_1.NotFoundException('Provider key not found');
        }
    }
};
exports.ProviderKeysService = ProviderKeysService;
exports.ProviderKeysService = ProviderKeysService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.DatabaseService])
], ProviderKeysService);
//# sourceMappingURL=provider-keys.service.js.map