import { BaseEvent } from '../../events/event-bus.service.js';

// Event triggered when a user is created
export class UserCreatedEvent extends BaseEvent {
  constructor(public readonly user: any) {
    super();
  }
}

// Event triggered when a user is updated
export class UserUpdatedEvent extends BaseEvent {
  constructor(public readonly user: any) {
    super();
  }
}

// Event triggered when a user is deleted
export class UserDeletedEvent extends BaseEvent {
  constructor(public readonly userId: string) {
    super();
  }
}