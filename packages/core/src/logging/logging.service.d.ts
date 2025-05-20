import { format, transports } from 'winston';
import { ConfigService } from '../config/config.service.js';
export declare class LoggingService {
    private config;
    private logger;
    private context;
    constructor(config: ConfigService);
    format: any;
    splat(): logLevel;
    format: logFormat;
    defaultMeta: {
        service: the-new-fuse';
    };
    transports: [
        new () => transports.Console,
        ({
            format: format.combine;
            (format: any, colorize: any): any;
            (): any;
        }),
        format.timestamp,
        () => ,
        format.printf,
        (({
            timestamp: any;
            level: any;
            message: any;
            context: any;
        })),
        ...meta
    ];
}
