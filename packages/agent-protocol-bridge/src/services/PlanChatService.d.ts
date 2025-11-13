/**
 * PlanChatService.ts
 *
 * Traycer-style plan chat and iteration interface.
 * Enables users to iterate on plans with surgical precision and ask questions.
 */
import { EventEmitter } from 'events';
export interface ChatMessage {
    id: string;
    planId: string;
    stepId?: string;
    content: string;
    type: 'user' | 'assistant' | 'system';
    messageType: 'question' | 'suggestion' | 'modification' | 'clarification' | 'approval' | 'general';
    context?: ChatContext;
    attachments?: ChatAttachment[];
    references?: ChatReference[];
    metadata?: Record<string, any>;
    timestamp: Date;
    userId?: string;
}
export interface ChatContext {
    currentStep?: string;
    codeSelection?: {
        file: string;
        startLine: number;
        endLine: number;
        content: string;
    };
    workspace?: string;
    relatedFiles?: string[];
    planState?: string;
}
export interface ChatAttachment {
    id: string;
    type: 'file' | 'image' | 'code_snippet' | 'log' | 'diff';
    name: string;
    content: string;
    metadata?: Record<string, any>;
}
export interface ChatReference {
    type: 'step' | 'file' | 'comment' | 'external_link';
    id: string;
    title: string;
    description?: string;
}
export interface PlanModification {
    id: string;
    planId: string;
    type: 'add_step' | 'modify_step' | 'remove_step' | 'reorder_steps' | 'change_priority' | 'update_description';
    data: any;
    reason: string;
    suggestedBy: 'user' | 'assistant';
    status: 'proposed' | 'accepted' | 'rejected';
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface ChatSession {
    id: string;
    planId: string;
    title: string;
    status: 'active' | 'paused' | 'completed';
    messages: ChatMessage[];
    modifications: PlanModification[];
    participants: string[];
    context: ChatContext;
    createdAt: Date;
    updatedAt: Date;
    lastActivity: Date;
}
export interface SurgicalEdit {
    id: string;
    planId: string;
    stepId?: string;
    operation: 'insert' | 'replace' | 'delete' | 'move';
    target: {
        type: 'step' | 'description' | 'file_change' | 'command' | 'dependency';
        path: string[];
    };
    oldValue?: any;
    newValue?: any;
    reason: string;
    preview?: string;
    timestamp: Date;
}
export declare class PlanChatService extends EventEmitter {
    private chatSessions;
    private planModifications;
    private surgicalEdits;
    constructor();
    /**
     * Start a new chat session for a plan
     */
    startChatSession(planId: string, title?: string, context?: ChatContext): Promise<ChatSession>;
    /**
     * Add a message to a chat session
     */
    addMessage(sessionId: string, messageData: Omit<ChatMessage, 'id' | 'planId' | 'timestamp'>): Promise<ChatMessage>;
    /**
     * Process user message and suggest plan modifications
     */
    private processUserMessage;
    /**
     * Analyze message intent using simple pattern matching
     */
    private analyzeMessageIntent;
    /**
     * Handle plan modification requests
     */
    private handlePlanModificationRequest;
}
//# sourceMappingURL=PlanChatService.d.ts.map