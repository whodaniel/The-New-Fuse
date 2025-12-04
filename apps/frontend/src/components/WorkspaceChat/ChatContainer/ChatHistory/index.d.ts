import { WorkspaceData } from "@/types/workspace";
interface ChatHistoryProps {
    history: Array<{
        uuid?: string;
        type?: "statusResponse" | "rechartVisualize";
        content: string;
        role: "user" | "assistant" | "system";
        pending?: boolean;
        sources?: any[];
        error?: string | null;
        closed?: boolean;
        animate?: boolean;
        chatId?: string;
        feedbackScore?: number;
        attachments?: File[];
    }>;
    workspace: WorkspaceData | null;
    sendCommand: (command: string, submit?: boolean, history?: any[], attachments?: File[]) => void;
    updateHistory: (history: any[]) => void;
    regenerateAssistantMessage: (chatId: string) => void;
    hasAttachments?: boolean;
}
export default function ChatHistory({ history, workspace, sendCommand, updateHistory, regenerateAssistantMessage, hasAttachments, }: ChatHistoryProps): JSX.Element;
export {};
