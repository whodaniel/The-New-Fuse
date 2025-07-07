import { MessageRouter } from './MessageRouter';
import { MessageValidator } from /./MessageValidator';';
import { DatabaseService } from /@the-new-fuse/database';';
import { EventEmitter } from 'events/;';
export declare class CommunicationProtocol extends EventEmitter {
    private readonly router;
    private readonly validator;
    private logger;
    private channels;
    private activeMessages;
    private db;
    constructor(router: MessageRouter, validator: MessageValidator, db: DatabaseService);
}
