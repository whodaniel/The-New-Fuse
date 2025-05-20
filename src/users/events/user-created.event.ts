// Export the BaseEvent interface to avoid private type usage errors
export interface BaseEvent {
  timestamp: Date;
}

import { User } from "@the-new-fuse/database/client";

export class UserCreatedEvent implements BaseEvent {
  constructor(
    public readonly user: User,
    public readonly timestamp: Date = new Date(),
  ) {}
}
