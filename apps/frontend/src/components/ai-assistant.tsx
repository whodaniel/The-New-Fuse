'use client';
import { GlassCard, PremiumButton, PremiumInput } from '@/components/ui/premium';
import { Bot, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { webSocketService } from '../services/websocket';

interface Message {
  type: 'user' | 'ai';
  content: string;
}

// ⚡ Bolt: Extract message item and wrap in React.memo to prevent O(n) re-renders
// during frequent state updates like typing in the message input.
const MessageItem = React.memo<{ msg: Message }>(({ msg }) => (
  <div
    className={`p-2 rounded-md ${msg.type === 'user' ? 'bg-blue-500 text-white self-end' : 'bg-gray-200 text-black self-start'}`}
  >
    {msg.content}
  </div>
));
MessageItem.displayName = 'MessageItem';

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    webSocketService.on('aiInsight', (insight: string) => {
      setMessages((prev) => [...prev, { type: 'ai', content: insight }]);
    });
    return () => {
      webSocketService.off('aiInsight', () => {});
    };
  }, []);

  const handleSendMessage = () => {
    if (input.trim()) {
      setMessages((prev) => [...prev, { type: 'user', content: input }]);
      webSocketService.send('userMessage', { message: input });
      setInput('');
    }
  };

  return (
    <div className="fixed bottom-4 right-4">
      {!isOpen && (
        <PremiumButton onClick={() => setIsOpen(true)} className="rounded-full h-16 w-16">
          <Bot className="h-8 w-8" />
        </PremiumButton>
      )}
      {isOpen && (
        <GlassCard title="AI Assistant" className="w-80 h-96 flex flex-col">
          <div className="absolute top-4 right-4">
            <PremiumButton variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </PremiumButton>
          </div>
          <div className="flex-grow overflow-auto">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <MessageItem key={index} msg={msg} />
              ))}
            </div>
          </div>
          <div className="p-4 border-t flex">
            <PremiumInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me anything..."
              className="flex-grow"
            />
            <PremiumButton onClick={handleSendMessage} className="ml-2">
              Send
            </PremiumButton>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
