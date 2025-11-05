export class ProfileUpdatedEvent {
    userId;
    profileData;
    timestamp;
    constructor(userId, profileData, timestamp = new Date()) {
        this.userId = userId;
        this.profileData = profileData;
        this.timestamp = timestamp;
    }
    toString() {
        return `ProfileUpdatedEvent: User ${this.userId} updated profile at ${this.timestamp.toISOString()}`;
    }
}
export class ProfileCreatedEvent {
    userId;
    profileData;
    timestamp;
    constructor(userId, profileData, timestamp = new Date()) {
        this.userId = userId;
        this.profileData = profileData;
        this.timestamp = timestamp;
    }
    toString() {
        return `ProfileCreatedEvent: User ${this.userId} created profile at ${this.timestamp.toISOString()}`;
    }
}
export class ProfileDeletedEvent {
    userId;
    timestamp;
    constructor(userId, timestamp = new Date()) {
        this.userId = userId;
        this.timestamp = timestamp;
    }
    toString() {
        return `ProfileDeletedEvent: User ${this.userId} deleted profile at ${this.timestamp.toISOString()}`;
    }
}
//# sourceMappingURL=profile.events.js.map