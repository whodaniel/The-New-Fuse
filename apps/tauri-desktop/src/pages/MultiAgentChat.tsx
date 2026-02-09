import React, { useEffect, useRef, useState } from 'react';
import { wsService } from '../services/websocket';
import { useAgentStore } from '../stores/agentStore';
import type { Agent, ChatMessage } from '../types';

/**
 * Multi-Agent Chat Page
 * Chat with multiple AI agents simultaneously
 */
const MultiAgentChat: React.FC = () => {
  const { agents } = useAgentStore();
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to WebSocket
    wsService.connect();
    const unsubConnection = wsService.onConnection(setIsConnected);

    // Listen for incoming messages
    const unsubMessages = wsService.on('chat:message', (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
      setIsLoading(false);
    });

    return () => {
      unsubConnection();
      unsubMessages();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || selectedAgents.length === 0) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Send to WebSocket or simulate response
    if (isConnected) {
      wsService.sendChatMessage('main', input);
    } else {
      // Simulate agent responses
      simulateAgentResponses(input, selectedAgents);
    }
  };

  const simulateAgentResponses = (userInput: string, agentIds: string[]) => {
    agentIds.forEach((agentId, index) => {
      const agent = agents.find((a) => a.id === agentId);
      if (!agent) return;

      setTimeout(
        () => {
          const response: ChatMessage = {
            id: `${Date.now()}-${agentId}`,
            role: 'agent',
            content: generateMockResponse(agent, userInput),
            agentId: agent.id,
            agentName: agent.name,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, response]);
          if (index === agentIds.length - 1) {
            setIsLoading(false);
          }
        },
        1000 + index * 800
      );
    });
  };

  const generateMockResponse = (agent: Agent, input: string): string => {
    const responses: Record<string, string[]> = {
      claude: [
        `I've analyzed your request: "${input.slice(0, 30)}...". Here's my perspective based on careful reasoning.`,
        `Interesting question! Let me break this down systematically for you.`,
        `Based on my analysis, I would recommend the following approach...`,
      ],
      gpt: [
        `Great question! Here's what I think about "${input.slice(0, 30)}..."`,
        `I've processed your input. Let me provide a comprehensive response.`,
        `From my understanding, here's the best way to approach this...`,
      ],
      gemini: [
        `I've searched and synthesized information about "${input.slice(0, 30)}..."`,
        `Here's a multi-perspective analysis of your query.`,
        `Based on multiple sources, I can provide the following insights...`,
      ],
      perplexity: [
        `Based on my web search about "${input.slice(0, 30)}...", here's what I found:`,
        `I've gathered the latest information on this topic...`,
        `Here are the most relevant findings from across the web...`,
      ],
      custom: [
        `Processing your request: "${input.slice(0, 30)}..."`,
        `Analysis complete. Here are my findings...`,
        `I've completed the task you requested.`,
      ],
    };

    const typeResponses = responses[agent.type] || responses.custom;
    return typeResponses[Math.floor(Math.random() * typeResponses.length)];
  };

  const toggleAgent = (agentId: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  const getAgentColor = (type: Agent['type']) => {
    const colors: Record<string, string> = {
      claude: '#f97316',
      gpt: '#10b981',
      gemini: '#3b82f6',
      perplexity: '#8b5cf6',
      custom: '#64748b',
      local: '#eab308',
    };
    return colors[type] || '#64748b';
  };

  const activeAgents = agents.filter((a) => a.status !== 'error');

  return (
    <div className="chat-container">
      {/* Agent Selector Sidebar */}
      <aside className="agent-selector">
        <h3>Select Agents</h3>
        <p className="helper-text">Choose agents to chat with</p>

        <div className="agent-list">
          {activeAgents.map((agent) => (
            <button
              key={agent.id}
              className={`agent-item ${selectedAgents.includes(agent.id) ? 'selected' : ''}`}
              onClick={() => toggleAgent(agent.id)}
            >
              <div className="agent-avatar" style={{ borderColor: getAgentColor(agent.type) }}>
                {agent.type === 'claude' && '🧠'}
                {agent.type === 'gpt' && '🤖'}
                {agent.type === 'gemini' && '💎'}
                {agent.type === 'perplexity' && '🔍'}
                {agent.type === 'custom' && '⚙️'}
                {agent.type === 'local' && '🏠'}
              </div>
              <div className="agent-info">
                <span className="agent-name">{agent.name}</span>
                <span className="agent-model">{agent.config.model}</span>
              </div>
              {selectedAgents.includes(agent.id) && <span className="check-mark">✓</span>}
            </button>
          ))}
        </div>

        <div className="connection-status">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span>{isConnected ? 'Connected' : 'Offline Mode'}</span>
        </div>
      </aside>

      {/* Chat Area */}
      <main className="chat-main">
        <header className="chat-header">
          <h2>Multi-Agent Chat</h2>
          <div className="selected-agents">
            {selectedAgents.map((id) => {
              const agent = agents.find((a) => a.id === id);
              if (!agent) return null;
              return (
                <span
                  key={id}
                  className="agent-chip"
                  style={{ borderColor: getAgentColor(agent.type) }}
                >
                  {agent.name}
                </span>
              );
            })}
            {selectedAgents.length === 0 && (
              <span className="no-agents">Select agents to start chatting</span>
            )}
          </div>
        </header>

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">💬</span>
              <h3>Start a Conversation</h3>
              <p>Select one or more agents and send a message</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.role}`}>
                {msg.role === 'agent' && (
                  <div className="message-header">
                    <span
                      className="agent-badge"
                      style={{
                        backgroundColor: getAgentColor(
                          agents.find((a) => a.id === msg.agentId)?.type || 'custom'
                        ),
                      }}
                    >
                      {msg.agentName}
                    </span>
                  </div>
                )}
                <div className="message-content">{msg.content}</div>
                <div className="message-time">{new Date(msg.timestamp).toLocaleTimeString()}</div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="message agent loading">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={selectedAgents.length > 0 ? 'Type your message...' : 'Select agents first'}
            disabled={selectedAgents.length === 0}
          />
          <button
            className="send-button"
            onClick={handleSend}
            disabled={!input.trim() || selectedAgents.length === 0}
          >
            Send
          </button>
        </div>
      </main>

      <style>{`
        .chat-container {
          display: flex;
          height: 100%;
          background: var(--tnf-obsidian);
        }

        /* Agent Selector Sidebar */
        .agent-selector {
          width: 280px;
          background: var(--tnf-surface);
          border-right: 1px solid var(--tnf-border);
          padding: 24px;
          display: flex;
          flex-direction: column;
        }

        .agent-selector h3 {
          font-family: var(--tnf-font-heading);
          margin: 0 0 4px;
        }

        .helper-text {
          font-size: 13px;
          color: var(--tnf-text-muted);
          margin: 0 0 20px;
        }

        .agent-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .agent-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--tnf-surface-hover);
          border: 1px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .agent-item:hover {
          border-color: var(--tnf-border);
        }

        .agent-item.selected {
          border-color: var(--tnf-primary);
          background: rgba(99, 102, 241, 0.1);
        }

        .agent-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .agent-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .agent-name {
          font-weight: 500;
          font-size: 14px;
        }

        .agent-model {
          font-size: 11px;
          color: var(--tnf-text-muted);
        }

        .check-mark {
          color: var(--tnf-primary);
          font-weight: bold;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 16px;
          border-top: 1px solid var(--tnf-border);
          margin-top: 16px;
          font-size: 12px;
          color: var(--tnf-text-muted);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.connected {
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }

        .status-dot.disconnected {
          background: #f59e0b;
        }

        /* Chat Main */
        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .chat-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--tnf-border);
        }

        .chat-header h2 {
          font-family: var(--tnf-font-heading);
          margin: 0 0 12px;
        }

        .selected-agents {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .agent-chip {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          border: 1px solid;
          background: rgba(255, 255, 255, 0.05);
        }

        .no-agents {
          font-size: 13px;
          color: var(--tnf-text-muted);
          font-style: italic;
        }

        /* Messages */
        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--tnf-text-muted);
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          margin: 0 0 8px;
          color: var(--tnf-text-primary);
        }

        .message {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 16px;
        }

        .message.user {
          align-self: flex-end;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }

        .message.agent {
          align-self: flex-start;
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
        }

        .message-header {
          margin-bottom: 8px;
        }

        .agent-badge {
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 11px;
          color: white;
        }

        .message-content {
          line-height: 1.5;
        }

        .message-time {
          font-size: 10px;
          color: var(--tnf-text-muted);
          margin-top: 6px;
        }

        .message.user .message-time {
          color: rgba(255, 255, 255, 0.7);
        }

        .message.loading {
          padding: 16px;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: var(--tnf-text-muted);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }

        /* Input */
        .input-container {
          padding: 20px 24px;
          border-top: 1px solid var(--tnf-border);
          display: flex;
          gap: 12px;
        }

        .input-container input {
          flex: 1;
          padding: 14px 20px;
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 12px;
          color: var(--tnf-text-primary);
          font-size: 14px;
        }

        .input-container input:focus {
          outline: none;
          border-color: var(--tnf-primary);
        }

        .input-container input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .send-button {
          padding: 14px 28px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border: none;
          border-radius: 12px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .send-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }

        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default MultiAgentChat;
