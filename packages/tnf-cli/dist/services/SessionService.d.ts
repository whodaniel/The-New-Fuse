export interface Session {
    id: string;
    name: string;
    model: string;
    provider: string;
    startTime: string;
    endTime?: string;
    messageCount: number;
    tokenCount: number;
    cost?: number;
    tags: string[];
    status: 'active' | 'closed' | 'archived';
    path?: string;
    lastMessageAt?: string;
}
export declare class SessionService {
    private sessionsDir;
    private sessionsFile;
    constructor();
    private loadSessions;
    private saveSessions;
    list(): Promise<Session[]>;
    get(id: string): Promise<Session | undefined>;
    create(name: string, model: string, provider: string): Promise<Session>;
    rename(id: string, newName: string): Promise<Session | null>;
    delete(id: string): Promise<boolean>;
    archive(id: string): Promise<boolean>;
    export(id: string, format: 'json' | 'md' | 'txt'): Promise<string>;
    prune(keep: number): Promise<number>;
}
//# sourceMappingURL=SessionService.d.ts.map