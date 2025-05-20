import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@the-new-fuse/database/client';
import { DatabaseService } from '../database.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class UserSubscriber {
  constructor(
    private db: DatabaseService,
    private eventEmitter: EventEmitter2
  ) {
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    this.db.client.$use(async (params, next) => {
      const result = await next(params);
      
      switch(params.action) {
        case 'create': {
          this.eventEmitter.emit('user.created', result);
          break;
        case 'update': {
          this.eventEmitter.emit('user.updated', result);
          break;
        case 'delete': {
          this.eventEmitter.emit('user.deleted', result);
          break;
      }
      
      return result;
    });
  }
}
