export interface SuggestedMessage {
    heading: string;
    message: string;
}
export interface WorkspaceData {
    id?: string;
    slug: string;
    name: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
    pfpUrl?: string;
    suggestedMessages?: SuggestedMessage[];
    settings?: Record<string, unknown>;
}
export interface WorkspaceStats {
    totalMessages: number;
    totalThreads: number;
    lastActive?: string;
}
export interface WorkspaceThread {
    id: string;
    slug: string;
    title: string;
    lastMessage?: string;
    createdAt: string;
    updatedAt: string;
}
export interface WorkspaceSettings {
    allowFileUploads?: boolean;
    maxFileSize?: number;
    allowedFileTypes?: string[];
    enableSpeechToText?: boolean;
    enableTextToSpeech?: boolean;
    appearance?: {
        showScrollbar?: boolean;
        theme?: string;
    };
}
export interface WorkspacePermissions {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canManageUsers: boolean;
    canUploadFiles: boolean;
}
export interface WorkspaceError {
    code: string;
    message: string;
    details?: unknown;
}
export interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    createdAt: string;
    metadata?: Record<string, unknown>;
}
export interface Thread {
    id: string;
    name: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
}
