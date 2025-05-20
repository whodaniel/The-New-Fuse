import { Logger } from '../logging/LoggingService.js';
import { SecurityPolicy } from '../security/SecurityTypes.js';
import { EventEmitter } from 'events';
export declare class WebSocketService extends EventEmitter {
    private readonly securityPolicy;
    private server;
    private clients;
    Logger: any;
    constructor(securityPolicy: SecurityPolicy, logger: Logger);
}
