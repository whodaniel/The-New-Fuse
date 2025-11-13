/**
 * Performance Optimization Utilities for Advanced MCP
 *
 * This module provides comprehensive performance optimization tools including:
 * - Performance monitoring and profiling
 * - Memory management and leak detection
 * - Object pooling for resource efficiency
 * - Multi-level caching strategies
 * - Load testing and stress testing utilities
 * - Async operation optimization
 * - Resource management with automatic cleanup
 */
import { EventEmitter } from 'events';
export interface PerformanceStats {
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
    count: number;
}
export declare class PerformanceMonitor extends EventEmitter {
    private metrics;
    private timers;
    private counters;
    private maxSamples;
    startTimer(label: string): void;
    endTimer(label: string): number;
    recordMetric(label: string, value: number): void;
    incrementCounter(label: string, value?: number): void;
    getStats(label: string): PerformanceStats | null;
    getCounter(label: string): number;
    getAllStats(): Record<string, PerformanceStats>;
    reset(label?: string): void;
    static timed(label?: string): (target: any, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
}
export declare const globalPerformanceMonitor: PerformanceMonitor;
export interface MemorySnapshot {
    timestamp: number;
    usage: NodeJS.MemoryUsage;
    heapStats?: any;
}
export interface MemoryTrend {
    trend: 'increasing' | 'decreasing' | 'stable';
    rate: number;
    confidence: number;
}
export declare class MemoryProfiler extends EventEmitter {
    private snapshots;
    private maxSnapshots;
    private gcThreshold;
    private lastGC;
    private leakDetectionEnabled;
    private snapshotInterval?;
    private leakCheckInterval?;
    constructor();
    private startMonitoring;
    takeSnapshot(): MemorySnapshot;
    getMemoryTrend(windowSize?: number): MemoryTrend;
    detectMemoryLeaks(): boolean;
    private checkForLeaks;
    stopMonitoring(): void;
    shouldTriggerGC(): boolean;
    triggerGC(): boolean;
    destroy(): void;
    getLatestSnapshot(): MemorySnapshot | null;
    getMemoryUsageSummary(): {
        current: NodeJS.MemoryUsage;
        trend: MemoryTrend;
        leakDetected: boolean;
    };
}
export interface PoolableObject {
    reset?(): void;
    destroy?(): void;
}
export declare class ObjectPool<T extends PoolableObject> {
    private pool;
    private createFn;
    private resetFn?;
    private destroyFn?;
    private maxSize;
    private created;
    private acquired;
    private released;
    constructor(createFn: () => T, options?: {
        maxSize?: number;
        resetFn?: (obj: T) => void;
        destroyFn?: (obj: T) => void;
    });
    acquire(): T;
    release(obj: T): void;
    getStats(): {
        poolSize: number;
        maxSize: number;
        created: number;
        acquired: number;
        released: number;
        utilization: number;
    };
    clear(): void;
}
export interface CacheEntry<T> {
    value: T;
    expiry: number;
    hits: number;
    lastAccess: number;
}
export interface CacheStats {
    size: number;
    maxSize: number;
    hits: number;
    misses: number;
    hitRate: number;
    evictions: number;
}
export declare class LRUCache<T> extends EventEmitter {
    private cache;
    private maxSize;
    private defaultTTL;
    private stats;
    constructor(maxSize?: number, defaultTTL?: number);
    get(key: string): T | null;
    set(key: string, value: T, ttl?: number): void;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    getStats(): CacheStats;
    cleanup(): number;
}
export interface LoadTestOptions {
    concurrency: number;
    duration: number;
    rampUpTime: number;
    requestDelay: number;
    timeout: number;
}
export interface LoadTestResult {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    successRate: number;
    requestsPerSecond: number;
    averageResponseTime: number;
    medianResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    errors: Array<{
        message: string;
        count: number;
    }>;
    duration: number;
}
export declare class LoadTester extends EventEmitter {
    private options;
    constructor(options?: Partial<LoadTestOptions>);
    runLoadTest(testFn: () => Promise<any>): Promise<LoadTestResult>;
    private createWorker;
    private analyzeResults;
}
export interface ManagedResource {
    cleanup(): Promise<void>;
}
export declare class ResourceManager extends EventEmitter {
    private resources;
    private cleanupInProgress;
    addResource(id: string, resource: ManagedResource): void;
    removeResource(id: string): Promise<boolean>;
    cleanup(): Promise<void>;
    withResource<T, R>(id: string, createResource: () => Promise<{
        resource: T;
        cleanup: () => Promise<void>;
    }>, operation: (resource: T) => Promise<R>): Promise<R>;
    getResourceCount(): number;
    getResourceAge(id: string): number | null;
    cleanupOldResources(maxAge: number): Promise<number>;
}
export declare class AsyncOptimizer {
    static withConcurrencyLimit<T>(promises: Array<() => Promise<T>>, limit: number): Promise<T[]>;
    static withRetry<T>(operation: () => Promise<T>, options?: {
        maxRetries?: number;
        baseDelay?: number;
        maxDelay?: number;
        backoffFactor?: number;
    }): Promise<T>;
    static createCircuitBreaker<T>(operation: () => Promise<T>, options?: {
        failureThreshold?: number;
        resetTimeout?: number;
        monitoringPeriod?: number;
    }): () => Promise<T>;
}
export declare const globalMemoryProfiler: MemoryProfiler;
export declare const globalResourceManager: ResourceManager;
export * from './benchmarks';
export * from './profiler';
export * from './optimization-guide';
export * from './monitoring';
//# sourceMappingURL=index.d.ts.map