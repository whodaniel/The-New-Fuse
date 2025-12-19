'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useState } from 'react';

import { webSocketService } from '../services/websocket';
import AgentMessage from './agent-message';

interface AgentChatRoomProps {}

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

export function AgentChatRoom({}: AgentChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentAgent] = useState({
    id: 'composer',
    name: 'Composer',
    avatar: '/composer-avatar.png',
  });

  useEffect(() => {
    const handleError = (error: any) => {
      setError(error.message);
      console.error('WebSocket error:', error.message);
    };

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
          avatar: data.senderAvatar,
        },
        metadata: data.metadata,
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
          avatar: data.senderAvatar,
        },
        metadata: data.metadata,
      };
      setMessages((prev: any) => [...prev, newMessage]);
    });

    webSocketService.on('error', handleError);

    return () => {
      webSocketService.removeAllListeners(`agent:broadcast`);
      webSocketService.removeAllListeners(`agent:direct:${currentAgent.id}`);
      webSocketService.off('error', handleError);
    };
  }, [currentAgent.id]);

  return (
    <Card className="w-full max-w-4xl h-[600px] flex flex-col bg-white shadow-lg rounded-lg">
      <CardHeader className="border-b">
        <CardTitle className="text-xl font-bold">Agent Communication Room</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-4 overflow-hidden">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
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
