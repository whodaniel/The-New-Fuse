import { EventEmitter } from 'events';
export interface AIAnalysisConfig {
    apiUrl: string;
    platform: 'web' | 'electron' | 'vscode' | 'chrome';
    timeout?: number;
    maxRetries?: number;
}
export interface AnalysisSession {
    id: string;
    type: string;
    status: 'pending' | 'active' | 'completed' | 'error';
    startedAt: string;
    completedAt?: string;
    results?: any;
    agents: string[];
    source: {
        type: 'tab' | 'file' | 'workspace' | 'desktop' | 'custom';
        identifier: string;
        metadata?: any;
    };
}
export interface ConnectedAgent {
    id: string;
    name: string;
    type: 'vision' | 'code' | 'accessibility' | 'security' | 'performance';
    status: 'connected' | 'busy' | 'offline';
    capabilities: string[];
    lastActivity?: string;
}
export interface AnalysisResult {
    sessionId: string;
    analysisType: string;
    agentId: string;
    agentName: string;
    timestamp: string;
    confidence: number;
    findings: {
        type: 'info' | 'warning' | 'error' | 'success';
        category: string;
        title: string;
        description: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        location?: {
            element?: string;
            line?: number;
            column?: number;
            file?: string;
        };
        suggestions?: string[];
        relatedFindings?: string[];
    }[];
    metadata?: {
        processingTime: number;
        model: string;
        version: string;
        tokens?: number;
    };
}
export declare class AIAnalysisService extends EventEmitter {
    private config;
    private ws;
    private isConnected;
    private activeSessions;
    private connectedAgents;
    private analysisHistory;
    constructor(config: AIAnalysisConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    startAnalysis(session: AnalysisSession, analysisTypes: string[]): Promise<void>;
    stopAnalysis(sessionId: string): Promise<void>;
    private handleAgentDisconnected;
}
//# sourceMappingURL=AIAnalysisService.d.ts.map