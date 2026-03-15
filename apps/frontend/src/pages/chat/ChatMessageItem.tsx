import { Message } from '@/services/chatApi';
import React from 'react';

interface ChatMessageItemProps {
  message: Message;
}

const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ChatMessageItem: React.FC<ChatMessageItemProps> = React.memo(({ message }) => {
  return (
    <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-md shadow-none ${
          message.sender === 'user'
            ? 'bg-primary text-primary-foreground'
            : message.sender === 'system'
              ? 'bg-muted text-muted-foreground'
              : 'bg-secondary text-secondary-foreground'
        }`}
      >
        {message.sender === 'agent' && (
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-lg">{message.agentAvatar}</span>
            <span className="text-xs font-medium opacity-75">{message.agentName}</span>
          </div>
        )}
        {message.sender === 'system' && (
          <div className="text-xs font-medium opacity-75 mb-1">System Message</div>
        )}
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content.includes('```') ? (
            <div className="space-y-2">
              {message.content.split('```').map((part, index) =>
                index % 2 === 0 ? (
                  <div key={index}>{part}</div>
                ) : (
                  <div
                    key={index}
                    className="bg-black/80 text-green-400 p-2 rounded text-xs font-mono overflow-x-auto my-1"
                  >
                    {part}
                  </div>
                )
              )}
            </div>
          ) : (
            message.content
          )}
        </div>
        <div
          className={`text-xs mt-1 text-right ${
            message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}
        >
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </div>
  );
});

export default ChatMessageItem;
