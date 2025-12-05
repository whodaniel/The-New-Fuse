import React from 'react';
interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    sender: 'user' | 'agent';
    timestamp: Date;
    type?: 'text' | 'code' | 'image';
    metadata?: {
      avatar?: string;
      name?: string;
    };
  };
  className?: string;
}
export declare const MessageBubble: React.FC<MessageBubbleProps>;
export {};
