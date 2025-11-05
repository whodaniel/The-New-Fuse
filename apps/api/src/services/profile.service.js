var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
import { Injectable } from '@nestjs/common';
import { UsersService } from '../modules/users/users.service';
import { EventBus } from '../modules/events/event-bus.service';
import { ProfileUpdatedEvent } from './events/profile.events';
import { StorageService } from '../storage/storage.service';
let ProfileService = class ProfileService {
    usersService;
    eventBus;
    storageService;
    constructor(usersService, eventBus, storageService) {
        this.usersService = usersService;
        this.eventBus = eventBus;
        this.storageService = storageService;
    }
    async getProfile(userId) {
        const user = await this.usersService.findOne(userId);
        return this.enrichUserProfile(user);
    }
    async updateProfile(userId, profileData) {
        const user = await this.usersService.update(userId, profileData);
        await this.eventBus.emit({ type: 'profile.updated', payload: new ProfileUpdatedEvent(userId, profileData) });
        return this.enrichUserProfile(user);
    }
    async updateAvatar(userId, file) {
        const { url } = await this.storageService.uploadFile(file.buffer, file.originalname);
        return this.usersService.update(userId, { avatar: url });
    }
    async enrichUserProfile(user) {
        // Add additional profile-related data
        return {
            ...user,
            fullProfile: true
        };
    }
};
ProfileService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof UsersService !== "undefined" && UsersService) === "function" ? _a : Object, typeof (_b = typeof EventBus !== "undefined" && EventBus) === "function" ? _b : Object, typeof (_c = typeof StorageService !== "undefined" && StorageService) === "function" ? _c : Object])
], ProfileService);
export { ProfileService };
//# sourceMappingURL=profile.service.js.map