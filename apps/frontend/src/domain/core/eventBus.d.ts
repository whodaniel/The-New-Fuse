export declare class EventBus extends EventEmitter {
    constructor();
    static getInstance(): any;
    setupErrorHandling(): void;
    emit(type: any, payload: any, source: any, correlationId: any): any;
    on(type: any, listener: any): any;
    once(type: any, listener: any): any;
    addToHistory(eventData: any): void;
    getEventHistory(): any[];
    getEventsByType(type: any): any;
    getEventsByTimeRange(startTime: any, endTime: any): any;
    clearHistory(): void;
    removeAllListeners(type: any): any;
    listenerCount(type: any): any;
    getActiveEventTypes(): any;
}
