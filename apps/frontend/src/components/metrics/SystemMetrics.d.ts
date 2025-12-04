import React from 'react';
interface SystemMetricsProps {
    data: {
        cpu: number;
        memory: number;
        latency: number;
        timestamp: number;
    }[];
}
export declare const SystemMetrics: React.React.FC<SystemMetricsProps>;
export {};
