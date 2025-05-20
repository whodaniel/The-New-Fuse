export interface MonitoringEvent {
    type: string;
    data: any;
    timestamp: number;
}
export declare class MonitoringClient {
    private events;
    constructor();
    trackEvent(type: string, data: any): void;
    trackError(error: Error | string, context?: any): void;
}
//# sourceMappingURL=MonitoringClient.d.ts.map