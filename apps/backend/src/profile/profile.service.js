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
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const event_bus_service_1 = require("../events/event-bus.service");
const profile_events_1 = require("./events/profile.events");
const storage_service_1 = require("../services/storage.service");
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
        await this.eventBus.publish(new profile_events_1.ProfileUpdatedEvent(user));
        return this.enrichUserProfile(user);
    }
    async updateAvatar(userId, file) {
        const avatarUrl = await this.storageService.uploadFile(file);
        return this.usersService.update(userId, { avatarUrl });
    }
    async enrichUserProfile(user) {
        // Add additional profile-related data
        return {
            ...user,
            fullProfile: true
        };
    }
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        event_bus_service_1.EventBus,
        storage_service_1.StorageService])
], ProfileService);
//# sourceMappingURL=profile.service.js.map