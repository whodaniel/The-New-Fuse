import { FC } from 'react';
export interface ChatMessage {
    id: string;
    content: string;
    sender: string;
    timestamp: Date;
    attachments?: unknown[];
}
interface ChatCoreProps {
    messages: ChatMessage[];
    onSendMessage: (content: string, attachments?: unknown[]) => void;
    onTyping?: (isTyping: boolean) => void;
    enableVoice?: boolean;
    enableVideo?: boolean;
    enableAttachments?: boolean;
    className?: string;
}
export declare const ChatCore: FC<ChatCoreProps>;
export {};
