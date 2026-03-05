// @ts-nocheck
'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GlassCard, PremiumButton, PremiumInput } from '@/components/ui/premium';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useState } from 'react';
import { webSocketService } from '../services/websocket';

interface ChatMessage {
  agent: { name: string; avatar: string };
  content: string;
}

export function ChatRoom({ roomId, agents }: { roomId: string; agents: any[] }) {
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
            <div key={index} className="flex items-start space-x-2 mb-4">
              <Avatar>
                <AvatarImage src={msg.agent.avatar} alt={msg.agent.name} />
                <AvatarFallback>{msg.agent.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{msg.agent.name}</p>
                <p>{msg.content}</p>
              </div>
            </div>
          ))}
        </ScrollArea>
        <div className="flex space-x-2">
          <PremiumInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <PremiumButton onClick={handleSend}>Send</PremiumButton>
        </div>
      </div>
    </GlassCard>
  );
}
