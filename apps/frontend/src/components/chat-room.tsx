import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  GlassCard,
  PremiumButton,
  PremiumInput,
  ScrollArea,
} from '@/components/ui';
import React, { useEffect, useState } from 'react';
import { webSocketService } from '../services/websocket';
// @ts-nocheck
('use client');

interface ChatMessage {
  agent: { name: string; avatar: string };
  content: string;
}

// ⚡ Bolt: Extract message item and wrap in React.memo to prevent O(n) re-renders
// during frequent state updates like typing in the message input.
const MessageItem = React.memo<{ msg: ChatMessage }>(({ msg }) => (
  <div className="flex items-start space-x-2 mb-4">
    <Avatar>
      <AvatarImage src={msg.agent.avatar} alt={msg.agent.name} />
      <AvatarFallback>{msg.agent.name[0]}</AvatarFallback>
    </Avatar>
    <div>
      <p className="font-semibold">{msg.agent.name}</p>
      <p>{msg.content}</p>
    </div>
  </div>
));

export function ChatRoom({ roomId, agents: _agents }: { roomId: string; agents: any[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    webSocketService.on(`chatRoom:${roomId}`, (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
    });
    return () => {
      webSocketService.off(`chatRoom:${roomId}`, () => {});
    };
  }, [roomId]);

  const handleSend = () => {
    if (input.trim()) {
      webSocketService.send('chatMessage', { roomId, message: input });
      setInput('');
    }
  };

  return (
    <GlassCard title={`Chat Room: ${roomId}`} className="w-full max-w-2xl h-[600px] flex flex-col">
      <div className="flex-grow flex flex-col">
        <ScrollArea className="flex-grow mb-4">
          {messages.map((msg, index) => (
            <MessageItem key={index} msg={msg} />
          ))}
        </ScrollArea>
        <div className="flex space-x-2">
          <PremiumInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <PremiumButton onClick={handleSend}>Send</PremiumButton>
        </div>
      </div>
    </GlassCard>
  );
}
