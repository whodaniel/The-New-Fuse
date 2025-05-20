'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@ui-components/consolidated";
import { ScrollArea } from "@/components/ui/scroll-area";
import AgentMessage from './agent-message.js';
import { webSocketService } from '../services/websocket.js';

interface Message {
  id: string;
  type: 'system' | 'acknowledgment' | 'task_request' | 'task_update' | 
        'code_review' | 'suggestion' | 'task_response' | 'error' | 'initialization' | 'collaboration_request';
  content: string;
  timestamp: string;
  metadata: {
    version: string;
    priority: 'low' | 'medium' | 'high';
    source?: string;
  };
  agent: {
    id: string;
    name: string;
    avatar?: string;
  };
  taskId?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'received';
  details?: Record<string, any>;
}

export function TraeAugmentChatRoom() {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // Subscribe to Trae agent messages
    webSocketService.on('agent:trae', (data) => {
      const newMessage: Message = {
        id: data.taskId || Date.now().toString(),
        type: data.type,
        content: data.message || JSON.stringify(data.details),
        timestamp: data.timestamp,
        metadata: data.metadata,
        agent: {
          id: 'trae',
          name: 'Trae',
          avatar: '/trae-avatar.png'
        },
        taskId: data.taskId,
        status: data.status,
        details: data.details
      };
      setMessages((prev: any) => [...prev, newMessage]);
    });

    // Subscribe to Augment agent messages
    webSocketService.on('agent:augment', (data) => {
      const newMessage: Message = {
        id: data.taskId || Date.now().toString(),
        type: data.type,
        content: data.message || JSON.stringify(data.details),
        timestamp: data.timestamp,
        metadata: data.metadata,
        agent: {
          id: 'augment',
          name: 'Augment',
          avatar: '/augment-avatar.png'
        },
        taskId: data.taskId,
        status: data.status,
        details: data.details
      };
      setMessages((prev: any) => [...prev, newMessage]);
    });

    // Subscribe to broadcast messages
    webSocketService.on('agent:broadcast', (data) => {
      const newMessage: Message = {
        id: data.taskId || Date.now().toString(),
        type: data.type,
        content: data.message || JSON.stringify(data.details),
        timestamp: data.timestamp,
        metadata: data.metadata,
        agent: {
          id: data.metadata.source || 'system',
          name: data.metadata.source || 'System',
          avatar: `/avatars/${data.metadata.source || 'system'}.png`
        },
        taskId: data.taskId,
        status: data.status,
        details: data.details
      };
      setMessages((prev: any) => [...prev, newMessage]);
    });

    return () => {
      webSocketService.removeAllListeners('agent:trae');
      webSocketService.removeAllListeners('agent:augment');
      webSocketService.removeAllListeners('agent:broadcast');
    };
  }, []);

  return (
    <Card className="w-full max-w-4xl h-[600px] flex flex-col bg-white shadow-lg rounded-lg">
      <CardHeader className="border-b">
        <CardTitle className="text-xl font-bold">Trae-Augment Communication</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-4 overflow-hidden">
        <ScrollArea className="flex-grow pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <AgentMessage
                key={message.id}
                agent={message.agent}
                message={{
                  id: message.id,
                  content: message.content,
                  timestamp: message.timestamp,
                  type: 'text',
                  agent: message.agent,
                  metadata: {
                    type: message.type,
                    status: message.status,
                    taskId: message.taskId,
                    ...message.metadata
                  }
                }}
                isCurrentUser={false}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}