import { FC } from "react";

export interface Message {
    id: string;
    content: string;
    sender: string;
    timestamp: Date;
    type: 'text' | 'code' | 'file' | 'system';
    attachments?: Attachment[];
    metadata?: Record<string, unknown>;
}

export interface Attachment {
    id: string;
    type: 'image' | 'file' | 'code';
    url: string;
    name: string;
    size?: number;
    metadata?: Record<string, unknown>;
}

export interface ChatCoreProps {
    initialMessages?: Message[];
    participants?: string[];
    threadId?: string;
    enableVoice?: boolean;
    enableVideo?: boolean;
    enableAttachments?: boolean;
    onSend?: (message: Message) => void;
    onTyping?: (isTyping: boolean) => void;
    className?: string;
    theme?: 'light' | 'dark';
}

export declare const ChatCore: FC<ChatCoreProps>;
