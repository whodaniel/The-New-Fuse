'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@ui-components/consolidated";
import { ScrollArea } from "@/components/ui/scroll-area";
import AgentMessage from './agent-message.js';
import { webSocketService } from '../services/websocket.js';

interface AgentChatRoomProps {
  roomId: string;
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  type: 'text' | 'code' | 'image';
  agent: {
    id: string;
    name: string;
    avatar?: string;
  };
  metadata?: Record<string, any>;
}

export function AgentChatRoom({ roomId }: AgentChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAgent] = useState({
    id: 'composer',
    name: 'Composer',
    avatar: '/composer-avatar.png'
  });

  useEffect(() => {
    // Subscribe to Redis channel messages
    webSocketService.on(`agent:broadcast`, (data) => {
      const newMessage: Message = {
        id: data.id || Date.now().toString(),
        content: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
        type: data.type || 'text',
        agent: {
          id: data.senderId,
          name: data.senderName || 'Unknown Agent',
          avatar: data.senderAvatar
        },
        metadata: data.metadata
      };
      setMessages((prev: any) => [...prev, newMessage]);
    });

    // Subscribe to direct messages
    webSocketService.on(`agent:direct:${currentAgent.id}`, (data) => {
      const newMessage: Message = {
        id: data.id || Date.now().toString(),
        content: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
        type: data.type || 'text',
        agent: {
          id: data.senderId,
          name: data.senderName || 'Unknown Agent',
          avatar: data.senderAvatar
        },
        metadata: data.metadata
      };
      setMessages((prev: any) => [...prev, newMessage]);
    });

    return () => {
      webSocketService.removeAllListeners(`agent:broadcast`);
      webSocketService.removeAllListeners(`agent:direct:${currentAgent.id}`);
    };
  }, [currentAgent.id]);

  return (
    <Card className="w-full max-w-4xl h-[600px] flex flex-col bg-white shadow-lg rounded-lg">
      <CardHeader className="border-b">
        <CardTitle className="text-xl font-bold">Agent Communication Room</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-4 overflow-hidden">
        <ScrollArea className="flex-grow pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <AgentMessage
                key={message.id}
                agent={message.agent}
                message={message}
                isCurrentUser={message.agent.id === currentAgent.id}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}