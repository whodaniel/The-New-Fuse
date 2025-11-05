export declare class ProfileUpdatedEvent {
    readonly userId: string;
    readonly updates: any;
    readonly timestamp: Date;
    constructor(userId: string, updates: any, timestamp?: Date);
}
export declare class AvatarUpdatedEvent {
    readonly userId: string;
    readonly avatarUrl: string;
    readonly timestamp: Date;
    constructor(userId: string, avatarUrl: string, timestamp?: Date);
}
export declare class ProfileCreatedEvent {
    readonly userId: string;
    readonly profileData: any;
    readonly timestamp: Date;
    constructor(userId: string, profileData: any, timestamp?: Date);
}
//# sourceMappingURL=profile.events.d.ts.map