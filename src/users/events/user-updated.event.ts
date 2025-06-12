import { BaseEvent } from './user-created.event.js';
import { User } from "@the-new-fuse/database";

export class UserUpdatedEvent implements BaseEvent {
  constructor(
    public readonly user: User,
    public readonly timestamp: Date = new Date(),
  ) {}
}
