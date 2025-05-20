import * as vscode from 'vscode';

export interface MonitoringEvent {
    type: string;
    data: any;
    timestamp: number;
}

export class MonitoringClient {
    private events: MonitoringEvent[] = [];

    constructor() {}

    trackEvent(type: string, data: any): void {
        const event: MonitoringEvent = {
            type,
            data,
            timestamp: Date.now()
        };
        this.events.push(event);
    }

    trackError(error: Error | string, context?: any): void {
        const errorMessage = error instanceof Error ? error.message : error;
        this.trackEvent('error', {
            message: errorMessage,
            context
        });
    }
}