import { User } from 'firebase/auth';
import { Agent, Message, ConversationRule } from '../types/multi-agent-chat.types';
export declare class MultiAgentChatFirebaseService {
    private app;
    private auth;
    private db;
    constructor();
    authenticateUser(): Promise<User>;
    subscribeToAgents(userId: string, callback: (agents: Agent[]) => void): () => void;
    subscribeToMessages(userId: string, callback: (messages: Message[]) => void): () => void;
    subscribeToRules(userId: string, callback: (rules: ConversationRule[]) => void): () => void;
    createAgent(userId: string, agentData: Partial<Agent>): Promise<string>;
    updateAgent(userId: string, id: string, updates: Partial<Agent>): Promise<void>;
    deleteAgent(userId: string, id: string): Promise<void>;
    addMessage(userId: string, messageData: any): Promise<void>;
    clearMessages(userId: string): Promise<void>;
    createRule(userId: string, rule: Partial<ConversationRule>): Promise<void>;
    updateRule(userId: string, id: string, updates: Partial<ConversationRule>): Promise<void>;
    deleteRule(userId: string, id: string): Promise<void>;
    clearAllData(userId: string): Promise<void>;
}
//# sourceMappingURL=multi-agent-chat-firebase.service.d.ts.map