import React, { ReactElement } from "react";
import { WorkspaceData } from "@/types/workspace";
interface Source {
    content: string;
    title?: string;
    url?: string;
}
interface HistoricalMessageProps {
    uuid?: string;
    message: string;
    role: "user" | "assistant" | "system";
    workspace: WorkspaceData | null;
    sources?: Source[];
    attachments?: {
        name: string;
        contentString: string;
    }[];
    error?: string | false;
    feedbackScore?: number | null;
    chatId?: string | null;
    isLastMessage?: boolean;
    regenerateMessage?: (chatId: string) => void;
    saveEditedMessage?: (params: {
        editedMessage: string;
        chatId: string;
        role: "user" | "assistant";
        attachments?: File[];
    }) => void;
    forkThread?: (chatId: string) => void;
    createdAt: Date | string | number;
    editedAt?: Date | string | number;
}
declare const _default: React.MemoExoticComponent<({ uuid, message, role, workspace, sources, attachments, error, feedbackScore, chatId, isLastMessage, regenerateMessage, saveEditedMessage, forkThread, createdAt, editedAt, }: HistoricalMessageProps) => ReactElement>;
export default _default;
