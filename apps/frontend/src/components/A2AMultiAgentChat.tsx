import { A2AMessageType, A2APriority, AgentType, AgentConfig } from '@the-new-fuse/a2a-core';
import {
  A2AMessage,
  A2AProvider,
  useA2AAgents,
  useA2AContext,
  useA2AConversations,
  useA2AMessages,
} from '@the-new-fuse/a2a-react';
import { AlertCircle, Send } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';

// Icons (same as before)
const SystemIcon = () => <AlertCircle className="h-4 w-4" />;
const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

// Enhanced message bubble
// ⚡ Bolt: Extracted MessageBubble out of the main component scope and wrapped
// in React.memo to prevent O(n) re-renders during frequent A2A message updates.
const MessageBubble = React.memo(({ msg, agents }: { msg: A2AMessage; agents: AgentConfig[] }) => {
  const isUser = msg.payload?.sender === 'User';
  const isSystem = msg.type === A2AMessageType.NOTIFICATION && msg.payload?.type === 'system';
  const bubbleClass = cn(
    'p-4 rounded-xl shadow-md max-w-lg',
    isUser && 'bg-blue-500 text-white ml-auto',
    isSystem && 'bg-gray-500 text-white text-center text-xs italic mx-auto',
    !isUser && !isSystem && 'bg-white dark:bg-gray-700 mr-auto'
  );

  const senderName = isUser
    ? 'You'
    : agents.find((a) => a.agentId === msg.fromAgent)?.name || msg.fromAgent;

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div className={bubbleClass}>
        {!isUser && !isSystem && (
          <div className="font-bold mb-1 text-sm opacity-75">{senderName}</div>
        )}
        <p className="whitespace-pre-wrap break-words">
          {msg.payload?.text || JSON.stringify(msg.payload, null, 2)}
        </p>
        <div className="text-xs opacity-50 mt-1">
          {new Date(msg.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';

// A2A Configuration
const A2A_CONFIG = {
  url: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
  agentId: uuidv4(), // Generate unique agent ID for this session
};

// ⚡ Bolt: Extracted MessageBubble and wrapped in React.memo to prevent O(n) re-renders
// of the entire message list on every keystroke in the chat input.
const MessageBubble = React.memo<{ msg: A2AMessage; agents: any[] }>(({ msg, agents }) => {
  const isUser = msg.payload?.sender === 'User';
  const isSystem = msg.type === A2AMessageType.NOTIFICATION && msg.payload?.type === 'system';
  const bubbleClass = cn(
    'p-4 rounded-xl shadow-md max-w-lg',
    isUser && 'bg-blue-500 text-white ml-auto',
    isSystem && 'bg-gray-500 text-white text-center text-xs italic mx-auto',
    !isUser && !isSystem && 'bg-white dark:bg-gray-700 mr-auto'
  );

  const senderName = isUser
    ? 'You'
    : agents.find((a) => a.agentId === msg.fromAgent)?.name || msg.fromAgent;

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div className={bubbleClass}>
        {!isUser && !isSystem && (
          <div className="font-bold mb-1 text-sm opacity-75">{senderName}</div>
        )}
        <p className="whitespace-pre-wrap break-words">
          {msg.payload?.text || JSON.stringify(msg.payload, null, 2)}
        </p>
        <div className="text-xs opacity-50 mt-1">
          {new Date(msg.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';

// Enhanced MultiAgentChat with A2A integration
export default function MultiAgentChat() {
  return (
    <A2AProvider
      config={A2A_CONFIG}
      autoConnect={true}
      autoRegister={true}
      agentRegistration={{
        agentId: A2A_CONFIG.agentId,
        name: 'Web Interface Agent',
        type: AgentType.COMMUNICATOR,
        version: '1.0.0',
        description: 'Web interface for multi-agent communication',
        capabilities: ['ui-interaction', 'message-display'],
      }}
    >
      <EnhancedMultiAgentChatUI />
    </A2AProvider>
  );
}

function EnhancedMultiAgentChatUI() {
  const { connectionState, connect, error: connectionError } = useA2AContext();
  const { agents, refreshAgents } = useA2AAgents();
  const { messages, sendMessage, broadcast } = useA2AMessages();
  const { conversations, joinConversation } = useA2AConversations();

  const [inputValue, setInputValue] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [mode, setMode] = useState<'direct' | 'broadcast' | 'conversation'>('direct');
  const [isAutomating, setIsAutomating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-refresh agents periodically
  useEffect(() => {
    if (connectionState.authenticated) {
      const interval = setInterval(refreshAgents, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [connectionState.authenticated, refreshAgents]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || !connectionState.authenticated) return;

    try {
      const messagePayload = {
        text: inputValue,
        sender: 'User',
        timestamp: new Date().toISOString(),
      };

      if (mode === 'direct' && selectedAgent) {
        // Send direct message to selected agent
        await sendMessage({
          toAgent: selectedAgent,
          type: A2AMessageType.REQUEST,
          priority: A2APriority.MEDIUM,
          conversationId: currentConversation || undefined,
          payload: messagePayload,
        });
      } else if (mode === 'broadcast') {
        // Broadcast to all agents
        await broadcast(messagePayload, {
          topic: 'user-broadcast',
        });
      } else if (mode === 'conversation' && currentConversation) {
        // Send to conversation
        await sendMessage({
          type: A2AMessageType.NOTIFICATION,
          priority: A2APriority.MEDIUM,
          conversationId: currentConversation,
          payload: messagePayload,
        });
      }

      setInputValue('');
    } catch {
      // Handle error - could use a state variable to show error in UI
      setInputValue((prev) => `${prev} (Failed to send)`);
    }
  }, [
    inputValue,
    mode,
    selectedAgent,
    currentConversation,
    connectionState.authenticated,
    sendMessage,
    broadcast,
  ]);

  const handleAutomateAgentCreation = useCallback(async () => {
    setIsAutomating(true);
    try {
      // Create sample A2A agents using the API
      const apiUrl = A2A_CONFIG.url.replace('ws://', 'http://').replace(':3001', ':3000');

      const agents = [
        {
          agentId: uuidv4(),
          name: 'Alice Assistant',
          type: AgentType.ASSISTANT,
          version: '1.0.0',
          description: 'Helpful assistant agent',
          capabilities: ['general-assistance'],
        },
        {
          agentId: uuidv4(),
          name: 'Bob Analyzer',
          type: AgentType.ANALYZER,
          version: '1.0.0',
          description: 'Data analysis agent',
          capabilities: ['data-analysis'],
        },
      ];

      for (const agent of agents) {
        await fetch(`${apiUrl}/a2a/agents/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agent),
        });
      }

      // Create a conversation between agents
      const response = await fetch(`${apiUrl}/a2a/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initiator: agents[0].agentId,
          participants: [agents[1].agentId],
          topic: 'Automated Agent Collaboration',
        }),
      });

      const { conversationId } = await response.json();
      setCurrentConversation(conversationId);
      setMode('conversation');

      // Refresh agents list
      await refreshAgents();

      // Send welcome message
      await broadcast(
        {
          type: 'automation_complete',
          message: 'Automated agent setup completed! Two agents are ready for collaboration.',
          conversationId,
        },
        {
          topic: 'system-announcement',
        }
      );
    } catch (error) {
      console.error('Automation failed:', error);
    } finally {
      setIsAutomating(false);
    }
  }, [broadcast, refreshAgents]);

  const handleCreateConversation = useCallback(async () => {
    if (agents.length < 2) return;

    try {
      const apiUrl = A2A_CONFIG.url.replace('ws://', 'http://').replace(':3001', ':3000');
      const response = await fetch(`${apiUrl}/a2a/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initiator: A2A_CONFIG.agentId,
          participants: agents.slice(0, 3).map((a) => a.agentId), // Include up to 3 agents
          topic: 'Multi-Agent Discussion',
        }),
      });

      const { conversationId } = await response.json();
      setCurrentConversation(conversationId);
      setMode('conversation');

      // Join the conversation
      await joinConversation(conversationId);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  }, [agents, joinConversation]);

  // Connection status component
  const ConnectionStatus = () => (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1 rounded-full text-sm',
        connectionState.connected
          ? connectionState.authenticated
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
          : 'bg-red-100 text-red-800'
      )}
    >
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          connectionState.connected
            ? connectionState.authenticated
              ? 'bg-green-500'
              : 'bg-yellow-500'
            : 'bg-red-500'
        )}
      />
      {connectionState.connected
        ? connectionState.authenticated
          ? 'Connected & Authenticated'
          : 'Connected (Authenticating...)'
        : connectionState.connecting
          ? 'Connecting...'
          : 'Disconnected'}
    </div>
  );

  if (connectionError) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-900 text-white">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Connection Error</h1>
        <p className="text-gray-400 mb-4">Could not connect to the WebSocket server.</p>
        <p className="text-gray-500 text-sm mb-6">{connectionError.message}</p>
        <button
          onClick={connect}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!connectionState.connected && !connectionState.connecting) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-900 text-white">
        <div className="w-20 h-20 border-8 border-dashed rounded-full animate-spin border-blue-500 mb-6"></div>
        <h1 className="text-3xl font-bold mb-2">A2A Multi-Agent Chat</h1>
        <p className="text-gray-400 mb-4">Connecting to A2A protocol...</p>
        <button
          onClick={connect}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      {isAutomating && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col justify-center items-center z-[100]">
          <div className="w-16 h-16 border-8 border-dashed rounded-full animate-spin border-blue-500"></div>
          <p className="text-white text-xl mt-4">Setting up A2A Agents...</p>
        </div>
      )}

      <header className="bg-white dark:bg-gray-800 shadow-sm p-3 z-10">
        <div className="flex items-center gap-4 pb-2 flex-wrap">
          <ConnectionStatus />

          <button
            onClick={handleAutomateAgentCreation}
            disabled={isAutomating || !connectionState.authenticated}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:bg-purple-400 flex items-center justify-center gap-2"
            title={!connectionState.authenticated ? "Requires active connection to setup agents" : "Automatically setup agents"}
            aria-label="Auto-Setup A2A Agents"
          >
            {isAutomating ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Setting up...</> : "🚀 Auto-Setup A2A"}
          </button>

          <button
            onClick={handleCreateConversation}
            disabled={agents.length < 2}
            className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 disabled:bg-green-400"
            title={agents.length < 2 ? "Requires at least 2 connected agents" : "Start a new conversation"}
            aria-label="Start Conversation"
          >
            Start Conversation
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Mode:</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'direct' | 'broadcast' | 'conversation')}
              aria-label="Select Mode"
              className="px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
            >
              <option value="direct">Direct Message</option>
              <option value="broadcast">Broadcast</option>
              <option value="conversation">Conversation</option>
            </select>
          </div>

          {mode === 'direct' && (
            <select
              value={selectedAgent || ''}
              onChange={(e) => setSelectedAgent(e.target.value)}
              aria-label="Select Agent"
              className="px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm"
            >
              <option value="">Select Agent</option>
              {agents.map((agent) => (
                <option key={agent.agentId} value={agent.agentId}>
                  {agent.name} ({agent.type})
                </option>
              ))}
            </select>
          )}

          <div className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {agents.length} agent(s) connected
          </div>
        </div>

        {/* Agents list */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {agents.map((agent) => (
            <div
              key={agent.agentId}
              className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-lg px-2 py-1"
            >
              <span className="text-sm">{agent.name}</span>
              <span className="text-xs opacity-75">({agent.type})</span>
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  'bg-green-500' // Assume online for now
                )}
              />
            </div>
          ))}
        </div>

        {/* Conversations list */}
        {conversations.length > 0 && (
          <div className="mt-2">
            <div className="text-sm font-medium mb-1">Active Conversations:</div>
            <div className="flex gap-2 flex-wrap">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setCurrentConversation(conv.id);
                    setMode('conversation');
                  }}
                  className={cn(
                    'px-2 py-1 text-xs rounded border',
                    currentConversation === conv.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700'
                  )}
                >
                  Conv {conv.id.slice(-6)} ({conv.participantCount} agents)
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="p-4 overflow-y-auto flex flex-col space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} agents={agents} />
        ))}
        {messages.length === 0 && connectionState.authenticated && (
          <div className="text-center text-gray-500 mt-8">
            <SystemIcon />
            <p className="mt-2">Welcome to A2A Multi-Agent Chat!</p>
            <p className="text-sm">Connect agents and start communicating.</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-white dark:bg-gray-800 shadow-inner p-2">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={
                mode === 'direct'
                  ? selectedAgent
                    ? `Message ${agents.find((a) => a.agentId === selectedAgent)?.name}...`
                    : 'Select an agent first...'
                  : mode === 'broadcast'
                    ? 'Broadcast to all agents...'
                    : currentConversation
                      ? 'Message conversation...'
                      : 'Start or join a conversation...'
              }
              disabled={
                !connectionState.authenticated ||
                (mode === 'direct' && !selectedAgent) ||
                (mode === 'conversation' && !currentConversation)
              }
              className="w-full p-2 border bg-transparent border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={
              !inputValue.trim() ||
              !connectionState.authenticated ||
              (mode === 'direct' && !selectedAgent) ||
              (mode === 'conversation' && !currentConversation)
            }
            aria-label="Send message"
            className="p-3 bg-blue-500 text-white rounded-full disabled:bg-gray-400 hover:bg-blue-600"
          >
            <Send className="h-6 w-6" />
          </button>
        </div>
      </footer>
    </div>
  );
}
