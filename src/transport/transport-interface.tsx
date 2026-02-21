import * as vscode from 'vscode';

export interface TransportMessage {
    id: string;
    type: string;
    payload: unknown;
    timestamp: number;
    priority?: number;
}

export enum MessagePriority {
    LOW = 0,
    NORMAL = 1,
    HIGH = 2,
    CRITICAL = 3
}

export interface MessageValidator {
    validate(message: TransportMessage): boolean;
    getValidationErrors(): string[];
}

export interface TransportOptions {
    retryAttempts?: number;
    timeout?: number;
    queueSize?: number;
    validator?: MessageValidator;
    priorityThreshold?: MessagePriority;
}

export interface ITransport {
    initialize(): Promise<void>;
    send(message: TransportMessage): Promise<void>;
    onMessage(handler: (message: TransportMessage) => void): vscode.Disposable;
    dispose(): void;
}
