import React from 'react';
import { cn } from '../lib/utils';
import { Avatar } from './ui/avatar';
import { Card } from './ui/card';

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

const AgentMessage: React.FC<AgentMessageProps> = ({ agent, message, isCurrentUser }) => {
  const messageClasses = cn(
    'flex w-full max-w-md gap-2 p-4',
    isCurrentUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
  );

  const renderMessageContent = () => {
    switch (message.type) {
      case 'code':
        return (
          <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto">
            <code>{message.content}</code>
          </pre>
        );
      case 'image':
        return (
          <img
            src={message.content}
            alt={message.metadata?.alt || 'Message image'}
            className="max-w-full rounded-md"
          />
        );
      default:
        return <p className="text-sm">{message.content}</p>;
    }
  };

  return (
    <Card className={messageClasses}>
      <Avatar name={agent.name} src={agent.avatar} size="sm" className="h-8 w-8" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{agent.name}</span>
          <span className="text-xs text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        {renderMessageContent()}
      </div>
    </Card>
  );
};

export default AgentMessage;
