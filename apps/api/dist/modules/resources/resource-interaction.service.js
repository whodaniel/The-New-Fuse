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
exports.ResourceInteractionService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const drizzle_1 = require("@the-new-fuse/database/drizzle");
const schema_1 = require("@the-new-fuse/database/drizzle/schema");
let ResourceInteractionService = class ResourceInteractionService {
    constructor(db) {
        this.db = db;
    }
    async toggleFavorite(resourceId, userId) {
        const existing = await this.db.client
            .select({ id: schema_1.resourceFavorites.id })
            .from(schema_1.resourceFavorites)
            .where((0, database_1.and)((0, database_1.eq)(schema_1.resourceFavorites.resourceId, resourceId), (0, database_1.eq)(schema_1.resourceFavorites.userId, userId)))
            .limit(1);
        if (existing.length > 0) {
            await this.db.client
                .delete(schema_1.resourceFavorites)
                .where((0, database_1.and)((0, database_1.eq)(schema_1.resourceFavorites.resourceId, resourceId), (0, database_1.eq)(schema_1.resourceFavorites.userId, userId)));
            return { favorite: false };
        }
        await this.db.client.insert(schema_1.resourceFavorites).values({
            resourceId,
            userId,
        });
        return { favorite: true };
    }
    async shareResource(input) {
        const notes = input.notes?.trim() || null;
        const [saved] = await this.db.client
            .insert(schema_1.resourceShares)
            .values({
            resourceId: input.resourceId,
            fromUserId: input.fromUserId,
            toAgentId: input.toAgentId,
            notes,
        })
            .returning({
            id: schema_1.resourceShares.id,
            resourceId: schema_1.resourceShares.resourceId,
            fromUserId: schema_1.resourceShares.fromUserId,
            toAgentId: schema_1.resourceShares.toAgentId,
            notes: schema_1.resourceShares.notes,
            sharedAt: schema_1.resourceShares.sharedAt,
        });
        return {
            id: saved?.id || null,
            resourceId: saved?.resourceId || input.resourceId,
            fromUserId: saved?.fromUserId || input.fromUserId,
            toAgentId: saved?.toAgentId || input.toAgentId,
            notes: saved?.notes ?? notes,
            sharedAt: (saved?.sharedAt instanceof Date ? saved.sharedAt.toISOString() : saved?.sharedAt) ||
                new Date().toISOString(),
        };
    }
};
exports.ResourceInteractionService = ResourceInteractionService;
exports.ResourceInteractionService = ResourceInteractionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [drizzle_1.DatabaseService])
], ResourceInteractionService);
//# sourceMappingURL=resource-interaction.service.js.map