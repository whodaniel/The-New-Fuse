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
exports.UserService = void 0;
/**
 * UserService - Migrated to Drizzle ORM
 * Handles user CRUD operations
 */
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
let UserService = class UserService {
    constructor(db) {
        this.db = db;
    }
    async findAll() {
        return this.db.users.findAll();
    }
    async findOne(id) {
        return this.db.users.findById(id);
    }
    async findByEmail(email) {
        return this.db.users.findByEmail(email);
    }
    async findByUsername(username) {
        return this.db.users.findByUsername(username);
    }
    async findUserByEmail(email) {
        return this.findByEmail(email);
    }
    async findUserByUsername(username) {
        return this.findByUsername(username);
    }
    async createUser(email, hashedPassword, username) {
        return this.db.users.create({
            email,
            hashedPassword,
            username,
            role: 'USER',
        });
    }
    async getUserProfileById(userId) {
        return this.findOne(userId);
    }
    async updateUserProfileById(userId, profileData) {
        try {
            return await this.update(userId, profileData);
        }
        catch (error) {
            return null;
        }
    }
    async update(id, data) {
        // Remove any readonly/computed fields
        const { id: _id, createdAt, ...updateData } = data;
        return this.db.users.update(id, {
            ...updateData,
            updatedAt: new Date(),
        });
    }
    async delete(id) {
        return this.db.users.softDelete(id);
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.DatabaseService])
], UserService);
//# sourceMappingURL=userService.js.map