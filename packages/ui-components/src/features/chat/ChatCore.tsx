import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button, Icon, Input, ErrorBoundary } from '../../shared/ui/index.js'; // Added .js extension assuming index file
import { Message } from './types.js'; // Assuming types are defined locally
import { ChatInput } from './ChatInput.js'; // Assuming ChatInput component exists
import { MessageList } from './MessageList.js'; // Assuming MessageList component exists

// ChatControls component with shared UI components
interface ChatControlsProps {
  enableVoice: boolean;
  enableVideo: boolean;
}

const ChatControls: React.FC<ChatControlsProps> = ({ enableVoice, enableVideo }) => {
  return (
    <div className="chat-controls p-2 border-t border-b">
      {enableVoice && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="mx-1" 
          icon={<Icon name="phone" size="sm" />}
        >
          Voice
        </Button>
      )}
      {enableVideo && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="mx-1" 
          icon={<Icon name="video" size="sm" />}
        >
          Video
        </Button>
      )}
    </div>
  );
};

// Custom hooks
const useChatState = (initialMessages: Message[] = []) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  
  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };
  
  const updateMessage = (id: string, updates: Partial<Message>) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === id ? { ...msg, ...updates } : msg
      )
    );
  };
  
  return { messages, addMessage, updateMessage };
};

const useMessageHandler = ({ 
  onSend, 
  onTyping, 
  threadId 
}: { 
  onSend?: (message: Message) => void, 
  onTyping?: (isTyping: boolean) => void,
  threadId?: string
}) => {
  const handleMessage = (message: Message) => {
    if (onSend) {
      const enrichedMessage = {
        ...message,
        metadata: {
          ...message.metadata,
          threadId
        }
      };
      onSend(enrichedMessage);
    }
  };
  
  const handleTyping = (isTyping: boolean) => {
    if (onTyping) {
      onTyping(isTyping);
    }
  };
  
  return { handleMessage, handleTyping };
};

export interface ChatCoreProps {
  initialMessages?: Message[];
  participants?: string[];
  threadId?: string;
  enableVoice?: boolean;
  enableVideo?: boolean;
  enableAttachments?: boolean;
  onSend?: (message: Message) => void;
  onTyping?: (isTyping: boolean) => void;
  className?: string;
  theme?: 'light' | 'dark';
}

export const ChatCore: React.FC<ChatCoreProps> = ({
  initialMessages = [],
  participants = [],
  threadId,
  enableVoice = false,
  enableVideo = false,
  enableAttachments = false,
  onSend,
  onTyping,
  className = '',
  theme = 'light'
}) => {
  const { messages, addMessage, updateMessage } = useChatState(initialMessages);
  const { handleMessage, handleTyping } = useMessageHandler({
    onSend,
    onTyping,
    threadId
  });

  return (
    <ErrorBoundary>
      <div className={`chat-core flex flex-col h-full ${className}`}>
        <MessageList 
          messages={messages}
          participants={participants}
        />
        <ChatControls
          enableVoice={enableVoice}
          enableVideo={enableVideo}
        />
        <ChatInput
          onSend={handleMessage}
          onTyping={handleTyping}
          enableAttachments={enableAttachments}
        />
      </div>
    </ErrorBoundary>
  );
};