import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
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

// ⚡ Bolt: Wrapped MessageBubble in React.memo to prevent O(n) re-renders
// of the entire message list on every keystroke or update in the chat interface.
// This significantly improves performance in chat applications with long message histories.
export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ message, className }) => {
  const isAgent = message.sender === 'agent';

  const renderContent = () => {
    switch (message.type) {
      case 'code':
        return (
          <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto">
            <code>{message.content}</code>
          </pre>
        );
      case 'image':
        return (
          <img src={message.content} alt="Message attachment" className="max-w-sm rounded-md" />
        );
      default:
        return <p className="text-sm">{message.content}</p>;
    }
  };

  return (
    <div className={cn('flex gap-3', isAgent ? 'flex-row' : 'flex-row-reverse', className)}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={message.metadata?.avatar} />
        <AvatarFallback>{message.metadata?.name?.[0] || (isAgent ? 'A' : 'U')}</AvatarFallback>
      </Avatar>

      <div
        className={cn(
          'max-w-md rounded-md p-4',
          isAgent ? 'bg-gray-100 text-gray-900' : 'bg-blue-600 text-white ml-auto'
        )}
      >
        {renderContent()}
        <time className="text-xs opacity-50 mt-1 block">
          {new Date(message.timestamp).toLocaleTimeString()}
        </time>
      </div>
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';
