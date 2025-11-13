/**
 * Advanced Performance Profiler for MCP Components
 *
 * This module provides comprehensive profiling capabilities including
 * CPU profiling, memory analysis, I/O monitoring, and optimization recommendations.
 */
import { EventEmitter } from 'events';
export interface ProfilerOptions {
    enableCPUProfiling?: boolean;
    enableMemoryProfiling?: boolean;
    enableIOProfiling?: boolean;
    enableNetworkProfiling?: boolean;
    samplingInterval?: number;
    maxSamples?: number;
    outputDirectory?: string;
}
export interface CPUProfile {
    samples: Array<{
        timestamp: number;
        stackTrace: string[];
        duration: number;
    }>;
    totalTime: number;
    hotspots: Array<{
        function: string;
        file: string;
        line: number;
        selfTime: number;
        totalTime: number;
        percentage: number;
    }>;
}
export interface MemoryProfile {
    snapshots: Array<{
        timestamp: number;
        usage: NodeJS.MemoryUsage;
        heapSnapshot?: any;
    }>;
    leaks: Array<{
        type: string;
        size: number;
        location: string;
        retainedSize: number;
    }>;
    recommendations: string[];
}
export interface IOProfile {
    operations: Array<{
        type: 'read' | 'write' | 'open' | 'close';
        path: string;
        size: number;
        duration: number;
        timestamp: number;
    }>;
    summary: {
        totalOperations: number;
        totalBytes: number;
        averageDuration: number;
        slowestOperations: Array<{
            type: string;
            path: string;
            duration: number;
        }>;
    };
}
export interface NetworkProfile {
    requests: Array<{
        method: string;
        url: string;
        duration: number;
        size: number;
        status: number;
        timestamp: number;
    }>;
    summary: {
        totalRequests: number;
        totalBytes: number;
        averageDuration: number;
        errorRate: number;
        slowestRequests: Array<{
            url: string;
            duration: number;
        }>;
    };
}
export interface ProfileReport {
    sessionId: string;
    startTime: number;
    endTime: number;
    duration: number;
    cpu?: CPUProfile;
    memory?: MemoryProfile;
    io?: IOProfile;
    network?: NetworkProfile;
    recommendations: string[];
    score: {
        overall: number;
        cpu: number;
        memory: number;
        io: number;
        network: number;
    };
}
export declare class AdvancedProfiler extends EventEmitter {
    private options;
    private isRunning;
    private sessionId;
    private startTime;
    private endTime;
    private cpuSamples;
    private memorySnapshots;
    private ioOperations;
    private networkRequests;
    private performanceObserver?;
    private samplingTimer?;
    constructor(options?: ProfilerOptions);
    startProfiling(sessionId?: string): Promise<string>;
    stopProfiling(): Promise<ProfileReport>;
    private setupPerformanceObserver;
    private startMemoryProfiling;
    private startCPUSampling;
    private captureStackTrace;
    private captureHeapSnapshot;
    private generateReport;
    private generateCPUProfile;
    private generateMemoryProfile;
    private generateIOProfile;
    private generateNetworkProfile;
    private calculateCPUScore;
    private calculateMemoryScore;
    private calculateIOScore;
    private calculateNetworkScore;
    private generateRecommendations;
    private calculateMemoryTrend;
    private extractFunctionName;
    private extractFileName;
    private extractLineNumber;
    private saveReport;
    private generateHTMLReport;
    private getScoreClass;
    isProfilingActive(): boolean;
    getCurrentSessionId(): string;
}
//# sourceMappingURL=profiler.d.ts.map