export interface ThreeFileMemoryConfig {
    rootDir: string;
    phasesFile?: string;
    researchFile?: string;
    sessionLogsFile?: string;
}
export interface PhaseEntry {
    phase: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    progress: number;
    notes: string;
    updatedAt: string;
}
export interface ResearchEntry {
    topic: string;
    findings: string;
    sources: string[];
    confidence: number;
    discoveredAt: string;
}
export interface SessionLogEntry {
    sessionId: string;
    startTime: string;
    endTime?: string;
    testsRun: number;
    testsPassed: number;
    testsFailed: number;
    outcomes: string[];
    artifacts: string[];
}
export declare class ThreeFileMemoryPattern {
    private readonly logger;
    private config;
    private initialized;
    constructor(config?: ThreeFileMemoryConfig);
    initialize(config?: Partial<ThreeFileMemoryConfig>): void;
    recordPhase(entry: PhaseEntry): void;
    updatePhase(phase: string, updates: Partial<PhaseEntry>): PhaseEntry | null;
    recordResearch(entry: ResearchEntry): void;
    recordSession(entry: SessionLogEntry): void;
    getPhases(): PhaseEntry[];
    getResearch(): ResearchEntry[];
    getSessionLogs(): SessionLogEntry[];
    getPhasesPath(): string;
    getResearchPath(): string;
    getSessionLogsPath(): string;
    private ensureInitialized;
    private getFileHeader;
}
//# sourceMappingURL=ThreeFileMemoryPattern.d.ts.map