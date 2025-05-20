import { ConfigService } from '../config/config-service.js';
export declare class MetricsCollector {
    private config;
    private registry;
    private counters;
    private gauges;
    private histograms;
    constructor(config: ConfigService);
    setGauge(name: any, {}: {}): void;
}
