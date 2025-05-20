import { EventEmitter } from 'events';
export declare class SystemMonitor extends EventEmitter {
    private lastCpuUsage;
    private lastMemUsage;
    constructor();
    private startMonitoring;
}
