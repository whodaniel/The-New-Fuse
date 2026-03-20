// @ts-nocheck
'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GlassCard as Card } from '@/components/ui/premium/GlassCard';
import { PremiumButton as Button } from '@/components/ui/premium/PremiumButton';
import { PremiumInput as Input } from '@/components/ui/premium/PremiumInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import React, { useEffect, useState } from 'react';
import { webSocketService } from '../services/websocket';

interface Message {
  agent: {
    avatar: string;
    name: string;
  };
  content: string;
}

interface ChatRoomProps {
  roomId: string;
  agents: any[];
}

// ⚡ Bolt: Extract message item and wrap in React.memo to prevent O(n) re-renders
// during frequent state updates like typing in the message input.
const MessageItem = React.memo<{ msg: Message }>(({ msg }) => (
  <div className="flex items-start space-x-2 mb-4">
    <Avatar>
      <AvatarImage src={msg.agent.avatar} alt={msg.agent.name} />
      <AvatarFallback>{msg.agent.name[0]}</AvatarFallback>
    </Avatar>
    <div>
      <p className="font-semibold text-white">{msg.agent.name}</p>
      <p className="text-gray-300">{msg.content}</p>
    </div>
  </div>
));
MessageItem.displayName = 'MessageItem';

export function ChatRoom({ roomId, agents }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    webSocketService.on(`chatRoom:${roomId}`, (data) => {
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
    <Card
      title={`Chat Room: ${roomId}`}
      gradient="blue"
      className="w-full max-w-2xl h-[600px] flex flex-col"
    >
      <div className="flex-grow flex flex-col">
        <ScrollArea className="flex-grow mb-4">
          {messages.map((msg, index) => (
            <MessageItem key={index} msg={msg} />
          ))}
        </ScrollArea>
        <div className="flex space-x-2">
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button onClick={handleSend} variant="primary">
            Send
          </Button>
        </div>
      </div>
    </Card>
  );
}
