export interface CommandEvent {
    command: string;
    args?: any[];
    timestamp: string;
    source?: string;
    result?: any;
    error?: Error;
}