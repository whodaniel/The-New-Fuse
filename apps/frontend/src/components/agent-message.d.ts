import React from 'react';
interface Agent {
    id: string;
    name: string;
    avatar?: string;
}
interface Message {
    id: string;
    content: string;
    timestamp: string;
    type: 'text' | 'code' | 'image';
    agent: Agent;
    metadata?: Record<string, any>;
}
interface AgentMessageProps {
    agent: Agent;
    message: Message;
    isCurrentUser: boolean;
}
declare const AgentMessage: React.FC<AgentMessageProps>;
export default AgentMessage;
