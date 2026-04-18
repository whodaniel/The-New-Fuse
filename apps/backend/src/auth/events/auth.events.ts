import { BaseEvent } from '../../events/event-bus.service.js';

/**
 * Event emitted when a user logs in
 */
export class UserLoginEvent extends BaseEvent {
  constructor(public readonly user: any) {
    super();
  }
}

/**
 * Event emitted when a user logs out
 */
export class UserLogoutEvent extends BaseEvent {
  constructor(public readonly userId: string) {
    super();
  }
}

/**
 * Event emitted when a user registers
 */
export class UserRegisteredEvent extends BaseEvent {
  constructor(public readonly user: any) {
    super();
  }
}

/**
 * Event emitted when a user's password is reset
 */
export class PasswordResetEvent extends BaseEvent {
  constructor(public readonly userId: string) {
    super();
  }
}