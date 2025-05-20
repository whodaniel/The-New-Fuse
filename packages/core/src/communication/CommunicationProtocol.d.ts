import { MessageRouter } from './MessageRouter.js';
import { MessageValidator } from './MessageValidator.js';
import { DatabaseService } from '@the-new-fuse/database';
import { EventEmitter } from 'events';
export declare class CommunicationProtocol extends EventEmitter {
    private readonly router;
    private readonly validator;
    private logger;
    private channels;
    private activeMessages;
    private db;
    constructor(router: MessageRouter, validator: MessageValidator, db: DatabaseService);
}
