import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QdrantService } from './QdrantService.js';
export declare class CodebaseReader {
    private readonly configService;
    private readonly eventEmitter;
    private readonly qdrantService;
    private readonly config;
    constructor(configService: ConfigService, eventEmitter: EventEmitter2, qdrantService: QdrantService);
    private scanCodebase;
}
