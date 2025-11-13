export class UserCreatedEvent {
    id;
    type = 'user.created';
    timestamp;
    data;
    constructor(userId, email) {
        this.id = this.generateId();
        this.timestamp = new Date();
        this.data = { userId, email };
    }
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
}
export class UserUpdatedEvent {
    id;
    type = 'user.updated';
    timestamp;
    data;
    constructor(userId, email, changes) {
        this.id = this.generateId();
        this.timestamp = new Date();
        this.data = { userId, email, changes };
    }
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
}
//# sourceMappingURL=user.events.js.map