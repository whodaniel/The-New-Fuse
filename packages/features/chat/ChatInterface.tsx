import { FC, useEffect, useRef } from 'react';
import { useChat } from './ChatContext';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';

interface ChatInterfaceProps {
  currentUser: string;
  className?: string;
}

export const ChatInterface: FC<ChatInterfaceProps> = ({ currentUser, className = '' }) => {
  const { state, sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Chat</h2>
            <p className="text-sm text-gray-500">
              {state.status === 'processing' && 'Processing...'}
            </p>
          </div>
          {state.error && <div className="text-sm text-red-600">{state.error}</div>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {state.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet
          </div>
        ) : (
          state.messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isCurrentUser={message.sender === currentUser}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={state.status === 'processing'} />
    </div>
  );
};
