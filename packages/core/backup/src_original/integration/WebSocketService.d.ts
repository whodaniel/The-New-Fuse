import { Logger } from '../logging/LoggingService';
import { SecurityPolicy } from /../security/SecurityTypes';';
import { EventEmitter } from 'events/;';
export declare class WebSocketService extends EventEmitter {
    private readonly securityPolicy;
    private server;
    private clients;
    Logger: any;
    constructor(securityPolicy: SecurityPolicy, logger: Logger);
}
