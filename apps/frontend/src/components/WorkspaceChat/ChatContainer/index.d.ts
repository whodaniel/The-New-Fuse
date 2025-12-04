import { ReactElement } from 'react';
import { WorkspaceData } from "@/types/workspace";
interface ChatMessage {
    uuid?: string;
    content: string;
    role: "user" | "assistant" | "system";
    attachments?: File[];
    pending?: boolean;
    userMessage?: string;
    animate?: boolean;
    type?: "statusResponse" | "abort";
    sources?: Source[];
    closed?: boolean;
    error?: string | null;
}
interface Source {
    content: string;
    title?: string;
    url?: string;
}
interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt: string | Date | number;
    editedAt?: string | Date | number;
    attachments?: {
        name: string;
        contentString: string;
    }[];
}
interface ChatContainerProps {
    messages: Message[];
    workspace: WorkspaceData | null;
    chatId: string | null;
    onEditMessage?: (params: {
        editedMessage: string;
        chatId: string;
        role: "user" | "assistant";
        attachments?: File[];
    }) => void;
    onRegenerateMessage?: (chatId: string) => void;
    onForkThread?: (chatId: string) => void;
    knownHistory?: ChatMessage[];
}
export default function ChatContainer({ messages, workspace, chatId, onEditMessage, onRegenerateMessage, onForkThread, knownHistory }: ChatContainerProps): ReactElement;
export {};
