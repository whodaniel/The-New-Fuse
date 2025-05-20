import { useState, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { MessageList } from './MessageList.js';
import { ChatInput } from './ChatInput.js';
import { TypingIndicator } from '@/components/ui/TypingIndicator';
import { AgentInfo } from './AgentInfo.js';
import { ChatControls } from './ChatControls.js';

interface ChatWindowProps {
  agentId: string;
  chatId?: string;
}

export function ChatWindow({ agentId, chatId }: ChatWindowProps) {
  const { 
    messages, 
    sendMessage, 
    isTyping, 
    clearChat,
    agentInfo 
  } = useChat(agentId, chatId);

  const [inputValue, setInputValue] = useState('');

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    try {
      await sendMessage(inputValue);
      setInputValue('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <AgentInfo agent={agentInfo} />
      
      <div className="flex-1 overflow-y-auto">
        <MessageList messages={messages} />
        {isTyping && <TypingIndicator />}
      </div>

      <div className="border-t border-gray-200 p-4">
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
        />
        <ChatControls onClear={clearChat} />
      </div>
    </div>
  );
}