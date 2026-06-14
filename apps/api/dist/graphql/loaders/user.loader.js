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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserLoader = void 0;
// @ts-nocheck
/**
 * User DataLoader - Migrated to Drizzle ORM
 * Provides efficient batched loading of users for GraphQL resolvers
 */
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const dataloader_1 = __importDefault(require("dataloader"));
let UserLoader = class UserLoader {
    constructor(db) {
        this.db = db;
        this.batchUsers = new dataloader_1.default(async (userIds) => {
            const users = await this.db.users.findUsersByIds([...userIds]);
            const userMap = new Map(users.map((user) => [user.id, user]));
            return userIds.map((id) => userMap.get(id) || null);
        });
    }
    async load(userId) {
        return this.batchUsers.load(userId);
    }
    async loadMany(userIds) {
        return this.batchUsers.loadMany(userIds);
    }
};
exports.UserLoader = UserLoader;
exports.UserLoader = UserLoader = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.REQUEST }),
    __metadata("design:paramtypes", [database_1.DatabaseService])
], UserLoader);
//# sourceMappingURL=user.loader.js.map