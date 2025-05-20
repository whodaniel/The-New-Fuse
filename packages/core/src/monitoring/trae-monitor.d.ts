import { EventEmitter } from 'events';
export declare class TraeMonitor extends EventEmitter {
    private commandHistory;
    private fileChangeHistory;
    constructor();
    private initializeMonitoring;
    private determineSource;
}
