export interface AgentInfo {
    id: string;
    name: string;
    role: 'orchestrator' | 'broker' | 'worker' | 'participant';
    platform: 'antigravity' | 'gemini' | 'claude' | 'jules' | 'vscode' | 'browser' | 'custom';
    capabilities: string[];
    isOnline: boolean;
    lastSeen: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
}
export interface AgentTemplate {
    name: string;
    role: AgentInfo['role'];
    platform: AgentInfo['platform'];
    systemPrompt?: string;
    capabilities?: string[];
}
export declare class AgentManagerService {
    private configDir;
    private agents;
    constructor(configDir?: string);
    private loadAgents;
    private saveAgents;
    create(name: string, role: AgentInfo['role'], platform: AgentInfo['platform'], options?: {
        capabilities?: string[];
        metadata?: Record<string, unknown>;
    }): AgentInfo;
    private getDefaultCapabilities;
    list(): AgentInfo[];
    get(id: string): AgentInfo | undefined;
    getByName(name: string): AgentInfo | undefined;
    update(id: string, updates: Partial<Omit<AgentInfo, 'id' | 'createdAt'>>): AgentInfo | undefined;
    delete(id: string): boolean;
    markOnline(id: string): AgentInfo | undefined;
    markOffline(id: string): AgentInfo | undefined;
    importTemplate(template: AgentTemplate): AgentInfo;
    exportTemplate(id: string): AgentTemplate | undefined;
}
//# sourceMappingURL=AgentManagerService.d.ts.map