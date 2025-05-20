import { DatabaseService } from '../database.service.js';
export declare class UserSubscriber {
  private db;
  private eventEmitter;
  constructor(db: DatabaseService, eventEmitter: EventEmitter2);
  private setupSubscriptions;
}
