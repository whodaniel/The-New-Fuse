export declare const ABORT_STREAM_EVENT = "abort-stream";
export declare const chatPrompt: {
    defaultPrompt: string;
    systemPrompt: string;
    maxLength: number;
};
export declare enum RefusalType {
    DEFAULT = "default",
    OFFENSIVE = "offensive",
    UNSAFE = "unsafe",
    UNAUTHORIZED = "unauthorized"
}
export declare const chatQueryRefusalResponses: Record<RefusalType, string>;
export declare const formatChatMessage: (message: string, type: "user" | "assistant") => string;
export declare const validateChatInput: (input: string) => boolean;
