interface StreamChunk {
    content?: string;
    error?: string;
    done?: boolean;
    sources?: Array<{
        title: string;
        text?: string;
        chunkSource?: string;
        score?: number;
    }>;
}
interface StreamOptions {
    onChunk?: (chunk: StreamChunk) => void;
    onError?: (error: Error) => void;
    onComplete?: () => void;
    signal?: AbortSignal;
}
export declare function handleChatStream(response: Response, options?: StreamOptions): Promise<void>;
export declare function createAbortController(): AbortController;
export declare function isStreamingSupported(): boolean;
export {};
