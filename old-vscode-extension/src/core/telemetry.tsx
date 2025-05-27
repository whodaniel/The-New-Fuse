import * as vscode from 'vscode';
import { ErrorCode, MCPError } from './error-handling.js';

export interface TelemetryEvent {
    eventName: string;
    properties?: Record<string, string>;
    measurements?: Record<string, number>;
    timestamp: number;
}

export class TelemetryService {
    private static instance: TelemetryService;
    private events: TelemetryEvent[] = [];
    private outputChannel: vscode.OutputChannel;

    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel('The New Fuse Telemetry');
    }

    static getInstance(): TelemetryService {
        if (!TelemetryService.instance) {
            TelemetryService.instance = new TelemetryService();
        }
        return TelemetryService.instance;
    }

    trackEvent(eventName: string, properties?: Record<string, string>, measurements?: Record<string, number>): void {
        const event: TelemetryEvent = {
            eventName,
            properties,
            measurements,
            timestamp: Date.now()
        };

        this.events.push(event);
        this.outputChannel.appendLine(`Event tracked: ${JSON.stringify(event, null, 2)}`);
    }

    trackError(error: Error | MCPError, context?: string): void {
        const properties: Record<string, string> = {
            errorType: error instanceof MCPError ? 'MCPError' : 'Error',
            errorCode: error instanceof MCPError ? error.code : 'UNKNOWN',
            message: error.message,
            context: context || 'unknown'
        };

        this.trackEvent('error', properties);
    }

    async flush(): Promise<void> {
        // Implementation for sending telemetry data to server
        // This is a placeholder for now
        this.events = [];
    }
}