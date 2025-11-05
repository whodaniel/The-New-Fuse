export declare class ProfileUpdatedEvent {
    readonly userId: string;
    readonly profileData: any;
    readonly timestamp: Date;
    constructor(userId: string, profileData: any, timestamp?: Date);
    toString(): string;
}
export declare class ProfileCreatedEvent {
    readonly userId: string;
    readonly profileData: any;
    readonly timestamp: Date;
    constructor(userId: string, profileData: any, timestamp?: Date);
    toString(): string;
}
export declare class ProfileDeletedEvent {
    readonly userId: string;
    readonly timestamp: Date;
    constructor(userId: string, timestamp?: Date);
    toString(): string;
}
//# sourceMappingURL=profile.events.d.ts.map