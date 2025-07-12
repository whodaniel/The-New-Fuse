var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UserService_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
let UserService = UserService_1 = class UserService {
    eventEmitter;
    logger = new Logger(UserService_1.name);
    users = new Map();
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }
    async createUser(userData) {
        // Mock implementation
        const user = {
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...userData
        };
        this.users.set(user.id, user);
        this.eventEmitter.emit('user.created', user);
        return user;
    }
    async getUserById(id) {
        // Mock implementation
        return this.users.get(id) || null;
    }
    async getUserByEmail(email) {
        // Mock implementation
        return Array.from(this.users.values()).find(user => user.email === email) || null;
    }
    async getUserByUsername(username) {
        // Mock implementation
        return Array.from(this.users.values()).find(user => user.username === username) || null;
    }
    async updateUser(id, updates) {
        // Mock implementation
        const user = this.users.get(id);
        if (!user)
            return null;
        const updatedUser = { ...user, ...updates, updatedAt: new Date() };
        this.users.set(id, updatedUser);
        this.eventEmitter.emit('user.updated', updatedUser);
        return updatedUser;
    }
    async deleteUser(id) {
        // Mock implementation
        const deleted = this.users.delete(id);
        if (deleted) {
            this.eventEmitter.emit('user.deleted', { id });
        }
        return deleted;
    }
    async getUsers(filters) {
        // Mock implementation
        let users = Array.from(this.users.values());
        if (filters?.role) {
            users = users.filter(user => user.role === filters.role);
        }
        if (filters?.isActive !== undefined) {
            users = users.filter(user => user.isActive === filters.isActive);
        }
        return users;
    }
    async deactivateUser(id) {
        // Mock implementation
        return this.updateUser(id, { isActive: false });
    }
    async activateUser(id) {
        // Mock implementation
        return this.updateUser(id, { isActive: true });
    }
    async updateLastLogin(id) {
        // Mock implementation
        return this.updateUser(id, { lastLoginAt: new Date() });
    }
    async getUserStats() {
        // Mock implementation
        const users = Array.from(this.users.values());
        return {
            total: users.length,
            active: users.filter(u => u.isActive).length,
            inactive: users.filter(u => !u.isActive).length,
            admins: users.filter(u => u.role === 'admin').length,
            super_admins: users.filter(u => u.role === 'super_admin').length
        };
    }
};
UserService = UserService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventEmitter2])
], UserService);
export { UserService };
