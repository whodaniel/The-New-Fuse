import { DatabaseService } from '@the-new-fuse/database';
import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'events';
export declare class SystemAdaptor extends EventEmitter {
    private logger;
    private db;
    private readonly minConfidenceThreshold;
    private readonly maxAdaptationsPerDay;
    private adaptationCount;
    private lastReset;
    constructor(db: DatabaseService, configService: ConfigService);
    catch(error: unknown): any;
    const patternsToRemove: any;
    const duration: number;
}
