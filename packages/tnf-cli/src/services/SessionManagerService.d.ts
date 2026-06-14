export interface Session {
    id: string;
    name?: string;
    provider: string;
    model: string;
    createdAt: string;
    updatedAt: string;
    messageCount: number;
    totalTokens?: number;
    totalCost?: number;
    projectPath?: string;
    metadata?: Record<string, unknown>;
}
export interface SessionMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    tokens?: number;
    cost?: number;
}
export interface SessionExport {
    session: Session;
    messages: SessionMessage[];
}
export declare class SessionManagerService {
    private sessionsDir;
    private sessions;
    constructor(sessionsDir?: string);
    private loadSessionsIndex;
    private saveSessionsIndex;
    list(): Session[];
    get(id: string): Session | undefined;
    create(options: {
        name?: string;
        provider: string;
        model: string;
        projectPath?: string;
    }): Session;
    private generateId;
    update(id: string, updates: Partial<Omit<Session, 'id' | 'createdAt'>>): Session | undefined;
    delete(id: string): {
        success: boolean;
        message: string;
    };
    private saveSessionFile;
    private loadSessionFile;
    export(id: string): SessionExport | undefined;
    exportAll(): SessionExport[];
    /**
     * Memory-efficient streaming export to prevent OOM errors.
     */
    exportAllToStream(outputFilePath: string): Promise<void>;
    import(data: SessionExport, options?: {
        overwrite?: boolean;
    }): {
        success: boolean;
        id: string;
        message: string;
    };
    importFromFile(filePath: string, options?: {
        overwrite?: boolean;
    }): {
        success: boolean;
        id: string;
        message: string;
    };
    importFromUrl(url: string): Promise<{
        success: boolean;
        id: string;
        message: string;
    }>;
}
//# sourceMappingURL=SessionManagerService.d.ts.map