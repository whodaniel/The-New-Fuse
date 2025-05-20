import { PatternRecognizer } from './pattern.js';
import { SystemAdaptor } from './adaptor.js';
import { MemorySystem } from '../memory.js';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class LearningSystem {
    private readonly memory;
    private readonly patterns;
    private readonly adaptor;
    private readonly configService;
    private readonly eventEmitter;
    private readonly config;
    constructor(memory: MemorySystem, patterns: PatternRecognizer, adaptor: SystemAdaptor, configService: ConfigService, eventEmitter: EventEmitter2);
    learn(): Promise<void>;
}
