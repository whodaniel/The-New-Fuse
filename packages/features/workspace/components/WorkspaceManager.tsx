import React, { useCallback, useState } from 'react';

import { EnhancedChatBubble } from '../chat/EnhancedChatBubble';
import { AgentLLMService } from '../services/llm/agent-llm';
import { Button, Card } from '../ui';

import type { ChatThread, UnifiedMessage, UnifiedWorkspace } from '../types/unified';

interface WorkspaceManagerProps {
  workspace: UnifiedWorkspace;
  user: {
    id: string;
    name: string;
  };
}

export function WorkspaceManager({ workspace, user }: WorkspaceManagerProps) {
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [message, setMessage] = useState('');

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !activeThread) {
      return;
    }

    const newMessage: UnifiedMessage = {
      id: crypto.randomUUID(),
      content: message.trim(),
      timestamp: new Date(),
      sender: {
        id: user.id,
        type: 'user',
        name: user.name,
      },
      metadata: {
        workspaceId: workspace.id,
        threadId: activeThread.id,
        llmProvider: workspace.llmConfig.defaultProvider,
      },
    };

    // Add user message to the thread
    const updatedMessages = [...activeThread.messages, newMessage];
    setActiveThread(prev => (prev ? {
      ...prev,
      messages: updatedMessages,
    } : null));
    setMessage('');

    try {
      // Get the active agent
      const activeAgent = workspace.agents[0]; // TODO: Implement agent selection

      if (!activeAgent) {
        throw new Error('No active agent available');
      }

      // Process message with the active agent using the singleton service
      const agentLLM = AgentLLMService.getInstance();
      const response = await agentLLM.processAgentMessage(
        activeAgent,
        newMessage,
        updatedMessages
      );

      // Add agent response to the thread
      const agentMessage: UnifiedMessage = {
        id: crypto.randomUUID(),
        content: response.content,
        timestamp: new Date(),
        sender: {
          id: activeAgent.id,
          type: 'agent',
          name: activeAgent.name,
        },
        metadata: {
          workspaceId: workspace.id,
          threadId: activeThread.id,
          llmProvider: activeAgent.llmConfig.provider,
          ...response.metadata,
        },
      };

      setActiveThread(prev => (prev ? {
        ...prev,
        messages: [...prev.messages, agentMessage],
      } : null));
    } catch (error) {
      console.error('Error processing message:', error);
      // Add error message to thread
      const errorMessage: UnifiedMessage = {
        id: crypto.randomUUID(),
        content: 'Sorry, I encountered an error processing your message.',
        timestamp: new Date(),
        sender: {
          id: 'system',
          type: 'system',
          name: 'System',
        },
        metadata: {
          workspaceId: workspace.id,
          threadId: activeThread.id,
          llmProvider: workspace.llmConfig.defaultProvider,
          error: true,
        },
      };

      setActiveThread(prev => (prev ? {
        ...prev,
        messages: [...prev.messages, errorMessage],
      } : null));
    }
  }, [message, activeThread, user, workspace]);

  return (
    <div className="flex h-full">
      {/* Thread List */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold mb-4">Threads</h2>
        {workspace.threads.map(thread => (
          <Button
            key={thread.id}
            variant={activeThread?.id === thread.id ? 'primary' : 'secondary'}
            onClick={() => setActiveThread(thread)}
            className="w-full mb-2"
          >
            {thread.name}
          </Button>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeThread ? (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {activeThread.messages.map(message => (
                <EnhancedChatBubble
                  key={message.id}
                  message={message}
                  agents={workspace.agents}
                  workspace={workspace}
                />
              ))}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 p-2"
                  placeholder="Type your message..."
                />
                <Button onClick={handleSendMessage}>Send</Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Select a Thread</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a thread from the sidebar to start chatting
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
