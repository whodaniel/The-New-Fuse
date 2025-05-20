import { ThreatType } from '../utils/security.js';
export interface ProcessedMessage extends BaseMessage {
    processed: boolean;
    processing_timestamp: string;
    validation_result?: ValidationResult;
    error?: string;
}
interface ValidationResult {
    valid: boolean;
    threatType?: ThreatType;
    details?: string;
}
export declare class MessageProcessor {
    private readonly maxRetries;
    number: any;
}
export declare enum MessageType {
    INTRODUCTION = "INTRODUCTION",
    QUERY = "QUERY",
    TASK = "TASK",
    RESPONSE = "RESPONSE",
    TASK_UPDATE = "TASK_UPDATE",
    FOLLOW_UP = "FOLLOW_UP",
    ERROR = "ERROR"
}
export interface BaseMessage {
}
export {};
