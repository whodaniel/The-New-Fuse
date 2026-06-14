import { Subscription } from 'rxjs';
export interface StreamEvent {
    id: string;
    parentAgent: string;
    subAgent: string;
    type: 'request' | 'response' | 'progress' | 'error' | 'completion';
    payload: unknown;
    timestamp: string;
    path: string;
}
export interface SubAgentStream {
    subAgentName: string;
    inputPath: string;
    outputPath: string;
    eventCount: number;
    createdAt: string;
}
export declare class HierarchicalStreamService {
    private readonly logger;
    private readonly streams;
    private readonly streamMeta;
    private readonly subscriptions;
    appendEvent(path: string, event: Omit<StreamEvent, 'id' | 'timestamp' | 'path'>): StreamEvent;
    subscribeToPath(path: string, handler: (event: StreamEvent) => void): Subscription;
    sendToSubAgent(parentAgent: string, subAgentName: string, payload: unknown): StreamEvent;
    subscribeToSubAgentResults(subAgentName: string, handler: (event: StreamEvent) => void): Subscription;
    respondFromSubAgent(subAgentName: string, parentAgent: string, payload: unknown): StreamEvent;
    reportProgress(subAgentName: string, parentAgent: string, progress: unknown): StreamEvent;
    getStreamInfo(path: string): SubAgentStream | undefined;
    getActiveStreams(): SubAgentStream[];
    closeStream(path: string): void;
    shutdown(): Promise<void>;
    private ensureStream;
    private normalizePath;
}
//# sourceMappingURL=HierarchicalStreamService.d.ts.map