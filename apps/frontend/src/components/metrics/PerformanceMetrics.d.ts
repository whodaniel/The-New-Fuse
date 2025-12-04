import React from 'react';
interface PerformanceMetricsProps {
    data: {
        successRate: number;
        responseTime: number;
        throughput: number;
        errorRate: number;
        timestamp: number;
    }[];
}
export declare const PerformanceMetrics: React.React.FC<PerformanceMetricsProps>;
export {};
