export class ProfileUpdatedEvent {
  constructor(
    public readonly userId: string,
    public readonly updates: any,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class AvatarUpdatedEvent {
  constructor(
    public readonly userId: string,
    public readonly avatarUrl: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class ProfileCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly profileData: any,
    public readonly timestamp: Date = new Date()
  ) {}
}
