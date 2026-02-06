import React from 'react';
import { Agent, UnifiedMessage, UnifiedWorkspace } from '../types/unified';

interface EnhancedChatBubbleProps {
  message: UnifiedMessage;
  agents: Agent[];
  workspace: UnifiedWorkspace;
}

export const EnhancedChatBubble: React.FC<EnhancedChatBubbleProps> = ({ message }) => {
  return (
    <div
      className={`p-4 rounded-lg mb-2 max-w-[80%] ${message.sender.type === 'user' ? 'bg-blue-100 dark:bg-blue-900 ml-auto' : 'bg-gray-100 dark:bg-gray-800'}`}
    >
      <div className="text-xs text-gray-500 mb-1">{message.sender.name}</div>
      <div className="whitespace-pre-wrap">{message.content}</div>
    </div>
  );
};
