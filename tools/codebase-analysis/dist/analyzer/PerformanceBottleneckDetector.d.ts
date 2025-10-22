import { PackageInfo } from '../scanner/FileSystemScanner';
export interface DatabaseQueryIssue {
    file: string;
    line: number;
    query: string;
    issue: 'n+1' | 'missing-index' | 'inefficient-join' | 'large-result-set' | 'synchronous-query';
    severity: 'high' | 'medium' | 'low';
    recommendation: string;
}
export interface MemoryLeakRisk {
    file: string;
    line: number;
    code: string;
    riskType: 'event-listener' | 'timer' | 'closure' | 'circular-reference' | 'large-object';
    severity: 'high' | 'medium' | 'low';
    recommendation: string;
}
export interface SynchronousOperation {
    file: string;
    line: number;
    operation: string;
    operationType: 'file-io' | 'network' | 'database' | 'computation' | 'blocking-call';
    severity: 'high' | 'medium' | 'low';
    asyncAlternative: string;
}
export interface ScalabilityIssue {
    pattern: string;
    files: string[];
    issue: 'global-state' | 'singleton-abuse' | 'tight-coupling' | 'resource-contention' | 'inefficient-algorithm';
    severity: 'high' | 'medium' | 'low';
    scalabilityImpact: string;
    recommendation: string;
}
export interface PerformanceMetrics {
    totalIssues: number;
    highSeverityIssues: number;
    databaseIssues: number;
    memoryRisks: number;
    synchronousOperations: number;
    scalabilityIssues: number;
    performanceScore: number;
}
export interface PerformanceBottleneckReport {
    databaseQueryIssues: DatabaseQueryIssue[];
    memoryLeakRisks: MemoryLeakRisk[];
    synchronousOperations: SynchronousOperation[];
    scalabilityIssues: ScalabilityIssue[];
    performanceMetrics: PerformanceMetrics;
    recommendations: string[];
}
export declare class PerformanceBottleneckDetector {
    private packages;
    constructor(packages: PackageInfo[]);
    detectPerformanceBottlenecks(): Promise<PerformanceBottleneckReport>;
    private analyzeDatabaseQueryPatterns;
    private detectN1QueryPattern;
    private detectMissingIndexPattern;
    private detectInefficientJoinPattern;
    private detectLargeResultSetPattern;
    private detectSynchronousDatabaseQuery;
    private identifyMemoryLeakRisks;
    private detectEventListenerLeak;
    private detectTimerLeak;
    private detectClosureLeak;
    private detectCircularReference;
    private detectLargeObjectAllocation;
    private detectSynchronousOperations;
    private detectSynchronousFileIO;
    private detectSynchronousNetworkCall;
    private detectBlockingComputation;
    private detectBlockingCall;
    private assessScalabilityIssues;
    private detectGlobalState;
    private detectSingletonAbuse;
    private detectTightCoupling;
    private calculatePerformanceMetrics;
    private generatePerformanceRecommendations;
}
//# sourceMappingURL=PerformanceBottleneckDetector.d.ts.map