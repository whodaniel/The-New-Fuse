import { EventEmitter } from 'events';
export interface LearningPattern {
    id: string;
    name: string;
    description: string;
    pattern: unknown;
    confidence: number;
    occurrences: number;
    lastSeen: Date;
    metadata: Record<string, unknown>;
}
export interface LearningEvent {
    type: string;
    data: unknown;
    timestamp: Date;
    context: Record<string, unknown>;
}
export declare class LearningSystem extends EventEmitter {
    private logger;
    private patterns;
    private readonly memoryManager;
    private readonly db;
    constructor();
    catch(error: unknown): void;
    private updatePattern;
}
