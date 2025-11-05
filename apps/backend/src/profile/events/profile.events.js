"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileCreatedEvent = exports.AvatarUpdatedEvent = exports.ProfileUpdatedEvent = void 0;
class ProfileUpdatedEvent {
    userId;
    updates;
    timestamp;
    constructor(userId, updates, timestamp = new Date()) {
        this.userId = userId;
        this.updates = updates;
        this.timestamp = timestamp;
    }
}
exports.ProfileUpdatedEvent = ProfileUpdatedEvent;
class AvatarUpdatedEvent {
    userId;
    avatarUrl;
    timestamp;
    constructor(userId, avatarUrl, timestamp = new Date()) {
        this.userId = userId;
        this.avatarUrl = avatarUrl;
        this.timestamp = timestamp;
    }
}
exports.AvatarUpdatedEvent = AvatarUpdatedEvent;
class ProfileCreatedEvent {
    userId;
    profileData;
    timestamp;
    constructor(userId, profileData, timestamp = new Date()) {
        this.userId = userId;
        this.profileData = profileData;
        this.timestamp = timestamp;
    }
}
exports.ProfileCreatedEvent = ProfileCreatedEvent;
//# sourceMappingURL=profile.events.js.map