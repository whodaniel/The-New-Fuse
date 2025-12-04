import React from 'react';
import { WorkspaceData } from "@/types/workspace";
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
interface MessageGroupProps {
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
}
export default function MessageGroup({ messages, workspace, chatId, onEditMessage, onRegenerateMessage, onForkThread }: MessageGroupProps): React.ReactElement | null;
export {};
