import React from 'react';
interface AgentMessageProps {
    agent: {
        id: string;
        name: string;
        avatar?: string;
    };
    message: {
        id: string;
        content: string;
        timestamp: string;
        type: 'text' | 'code' | 'image';
        metadata?: Record<string, any>;
    };
    isCurrentUser: boolean;
}
declare const AgentMessage: React.React.FC<AgentMessageProps>;
export default AgentMessage;
