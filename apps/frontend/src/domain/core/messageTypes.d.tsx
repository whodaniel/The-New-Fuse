import { MessageType } from '../../models/enums.js';
export interface BaseMessage {
    id: string;
    type: MessageType;
    timestamp: number;
    metadata?: Record<string, any>;
}
export interface TextMessage extends BaseMessage {
    type: MessageType.TEXT;
    content: string;
}
export interface CodeMessage extends BaseMessage {
    type: MessageType.CODE;
    content: string;
    language: string;
    fileName?: string;
}
export interface ImageMessage extends BaseMessage {
    type: MessageType.IMAGE;
    url: string;
    alt?: string;
    dimensions?: {
        width: number;
        height: number;
    };
}
export interface FileMessage extends BaseMessage {
    type: MessageType.FILE;
    url: string;
    name: string;
    size: number;
    mimeType: string;
}
export interface SystemMessage extends BaseMessage {
    type: MessageType.SYSTEM;
    content: string;
    level: 'info' | 'warning' | 'error';
}
export type Message = TextMessage | CodeMessage | ImageMessage | FileMessage | SystemMessage;
export interface MessageThread {
    id: string;
    messages: Message[];
    metadata?: Record<string, any>;
}
export interface MessageReaction {
    messageId: string;
    userId: string;
    reaction: string;
    timestamp: number;
}
export interface MessageEdit {
    messageId: string;
    userId: string;
    oldContent: string;
    newContent: string;
    timestamp: number;
}
export declare class MessageFactory {
    static createTextMessage(content: string, metadata?: Record<string, any>): TextMessage;
    static createCodeMessage(content: string, language: string, fileName?: string, metadata?: Record<string, any>): CodeMessage;
    static createImageMessage(url: string, alt?: string, dimensions?: {
        width: number;
        height: number;
    }, metadata?: Record<string, any>): ImageMessage;
    static createFileMessage(url: string, name: string, size: number, mimeType: string, metadata?: Record<string, any>): FileMessage;
    static createSystemMessage(content: string, level?: SystemMessage['level'], metadata?: Record<string, any>): SystemMessage;
}
