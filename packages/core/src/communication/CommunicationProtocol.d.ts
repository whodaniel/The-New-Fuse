import { MessageRouter } from './MessageRouter.tsx';
import { MessageValidator } from './MessageValidator.tsx';
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
