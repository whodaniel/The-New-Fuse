import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'events';
export declare class MessageValidator extends EventEmitter {
    private logger;
    private readonly maxContentSize;
    private readonly maxRetries;
    private readonly maxTTL;
    private readonly requiredTags;
    constructor(configService: ConfigService);
}
