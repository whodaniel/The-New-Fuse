import { EventEmitter } from 'events';
export interface EventMetadata {
    timestamp: number;
    source: string;
    correlationId?: string;
}
export interface EventData<T = any> {
    type: string;
    payload: T;
    metadata: EventMetadata;
}
export declare class EventBus extends EventEmitter {
    private static instance;
    private logger;
    private eventHistory;
    private readonly maxHistorySize;
    private constructor();
    static getInstance(): EventBus;
    private setupErrorHandling;
    emit<T>(type: string, payload: T, source: string, correlationId?: string): boolean;
    on<T>(type: string, listener: (eventData: EventData<T>) => void): this;
    once<T>(type: string, listener: (eventData: EventData<T>) => void): this;
    private addToHistory;
    getEventHistory(): EventData[];
    getEventsByType(type: string): EventData[];
    getEventsByTimeRange(startTime: number, endTime: number): EventData[];
    clearHistory(): void;
    removeAllListeners(type?: string): this;
    listenerCount(type: string): number;
    getActiveEventTypes(): string[];
}
