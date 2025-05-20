import { DatabaseService } from '@the-new-fuse/database';
import { EventEmitter } from 'events';
export declare class MessageRouter extends EventEmitter {
    private logger;
    private channels;
    private routingTable;
    private db;
    constructor(db: DatabaseService);
    private addRoute;
}
