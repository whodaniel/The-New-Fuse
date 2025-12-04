import { WorkspaceData, WorkspaceThread, WorkspaceStats, WorkspaceSettings } from '@/types/workspace';
declare class Workspace {
    static create(data: Partial<WorkspaceData>): Promise<WorkspaceData>;
    static get(slug: string): Promise<WorkspaceData>;
    static update(slug: string, data: Partial<WorkspaceData>): Promise<WorkspaceData>;
    static delete(slug: string): Promise<void>;
    static getThreads(slug: string): Promise<WorkspaceThread[]>;
    static getStats(slug: string): Promise<WorkspaceStats>;
    static getSettings(slug: string): Promise<WorkspaceSettings>;
    static updateSettings(slug: string, settings: Partial<WorkspaceSettings>): Promise<WorkspaceSettings>;
    static deleteUserMessage(slug: string, threadSlug: string | null, chatId: string): Promise<void>;
    static deleteAssistantMessage(slug: string, threadSlug: string | null, chatId: string): Promise<void>;
    static updateChatResponse(slug: string, threadSlug: string | null, chatId: string, content: string): Promise<void>;
    static submitMessageFeedback(slug: string, chatId: string, score: number): Promise<void>;
    static getMessageTTS(slug: string, chatId: string): Promise<ArrayBuffer>;
    static forkThread(slug: string, threadSlug: string | null, chatId: string): Promise<string>;
    static uploadFile(slug: string, file: File, onProgress?: (progress: number) => void): Promise<{
        url: string;
        filename: string;
    }>;
}
export default Workspace;
