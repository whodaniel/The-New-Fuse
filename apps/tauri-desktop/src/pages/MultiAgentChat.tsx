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
        <div className="sidebar-header">
          <h3>Neural Link</h3>
          <p className="helper-text">Select active nodes</p>
        </div>

        <div className="agent-list">
          {activeAgents.map((agent) => (
            <button
              key={agent.id}
              className={`agent-item ${selectedAgents.includes(agent.id) ? 'selected' : ''}`}
              onClick={() => toggleAgent(agent.id)}
            >
              <div
                className="agent-avatar"
                style={{
                  borderColor: getAgentColor(agent.type),
                  boxShadow: selectedAgents.includes(agent.id)
                    ? `0 0 15px ${getAgentColor(agent.type)}40`
                    : 'none',
                }}
              >
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
              {selectedAgents.includes(agent.id) && <span className="check-mark">●</span>}
            </button>
          ))}
        </div>

        <div className="connection-status">
          <div className="status-indicator-wrapper">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span className="status-ring"></span>
          </div>
          <div className="status-details">
            <span className="status-label">{isConnected ? 'SYSTEM ONLINE' : 'OFFLINE MODE'}</span>
            <span className="status-sub">{isConnected ? 'Latency: 12ms' : 'Reconnecting...'}</span>
          </div>
        </div>
      </aside>

      {/* Chat Area */}
      <main className="chat-main">
        <header className="chat-header">
          <div className="header-info">
            <h2>Swarm Protocol</h2>
            <span className="active-count">
              {selectedAgents.length} {selectedAgents.length === 1 ? 'Node' : 'Nodes'} Active
            </span>
          </div>
          <div className="selected-agents-pills">
            {selectedAgents.map((id) => {
              const agent = agents.find((a) => a.id === id);
              if (!agent) return null;
              return (
                <span
                  key={id}
                  className="agent-pill"
                  style={{
                    backgroundColor: `${getAgentColor(agent.type)}20`,
                    borderColor: getAgentColor(agent.type),
                    color: getAgentColor(agent.type),
                  }}
                >
                  {agent.name}
                </span>
              );
            })}
            {selectedAgents.length === 0 && <span className="no-agents-pill">No active nodes</span>}
          </div>
        </header>

        <div className="messages-viewport">
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-visual-ring">
                  <div className="empty-visual-inner">⚡</div>
                </div>
                <h3>Neural Interface Ready</h3>
                <p>Initialize swarm communication sequence</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`message-row ${msg.role}`}>
                  {msg.role === 'agent' && (
                    <div
                      className="message-avatar"
                      style={{
                        borderColor: getAgentColor(
                          agents.find((a) => a.id === msg.agentId)?.type || 'custom'
                        ),
                      }}
                    >
                      {agents.find((a) => a.id === msg.agentId)?.name[0]}
                    </div>
                  )}
                  <div className="message-bubble-container">
                    {msg.role === 'agent' && (
                      <span
                        className="message-agent-name"
                        style={{
                          color: getAgentColor(
                            agents.find((a) => a.id === msg.agentId)?.type || 'custom'
                          ),
                        }}
                      >
                        {msg.agentName}
                      </span>
                    )}
                    <div className="message-bubble">{msg.content}</div>
                    <span className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="message-row agent loading">
                <div className="message-avatar loading-pulse">...</div>
                <div className="typing-indicator-bubble">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="input-area">
          <div className="input-wrapper">
            <input
              type="text"
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={
                selectedAgents.length > 0
                  ? 'Broadcast message to active nodes...'
                  : 'Select nodes to enable transmission'
              }
              disabled={selectedAgents.length === 0}
            />
            <div className="input-actions">
              <button
                className="send-button"
                onClick={handleSend}
                disabled={!input.trim() || selectedAgents.length === 0}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .chat-container {
          display: flex;
          height: 100%;
          background: #0f111a;
          color: #e0e7ff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          overflow: hidden;
        }

        /* Sidebar */
        .agent-selector {
          width: 320px;
          background: rgba(19, 21, 31, 0.8);
          border-right: 1px solid #1f2937;
          display: flex;
          flex-direction: column;
          backdrop-filter: blur(20px);
        }

        .sidebar-header {
          padding: 24px;
          border-bottom: 1px solid #1f2937;
        }

        .sidebar-header h3 {
          margin: 0;
          font-family: 'Outfit', sans-serif;
          font-size: 20px;
          background: linear-gradient(135deg, #fff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .helper-text {
          margin-top: 4px;
          font-size: 13px;
          color: #64748b;
        }

        .agent-list {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .agent-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          color: #cbd5e1;
        }

        .agent-item:hover {
          background: rgba(255, 255, 255, 0.06);
          transform: translateY(-1px);
        }

        .agent-item.selected {
          background: rgba(99, 102, 241, 0.1);
          border-color: rgba(99, 102, 241, 0.4);
        }

        .agent-avatar {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          border: 2px solid #334155;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          background: #0f172a;
          transition: all 0.2s;
        }

        .agent-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .agent-name {
          font-weight: 600;
          font-size: 14px;
          color: #f1f5f9;
        }

        .agent-model {
          font-size: 11px;
          color: #94a3b8;
          font-family: 'JetBrains Mono', monospace;
        }

        .check-mark {
          color: #818cf8;
          font-size: 10px;
          text-shadow: 0 0 10px #818cf8;
        }

        .connection-status {
          padding: 20px;
          background: rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          gap: 14px;
          border-top: 1px solid #1f2937;
        }

        .status-indicator-wrapper {
          position: relative;
          width: 12px;
          height: 12px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          z-index: 2;
        }

        .status-dot.connected { background: #10b981; box-shadow: 0 0 8px #10b981; }
        .status-dot.disconnected { background: #ef4444; box-shadow: 0 0 8px #ef4444; }

        .status-ring {
          position: absolute;
          top: -2px;
          left: -2px;
          width: 16px;
          height: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          animation: spin 3s linear infinite;
        }

        .status-details {
          display: flex;
          flex-direction: column;
        }

        .status-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #e2e8f0;
        }

        .status-sub {
          font-size: 10px;
          color: #64748b;
        }

        /* Main Chat */
        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: radial-gradient(circle at top right, #1e293b 0%, #0f111a 60%);
          position: relative;
        }

        .chat-header {
          padding: 20px 32px;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 10;
        }

        .header-info h2 {
          margin: 0;
          font-family: 'Outfit', sans-serif;
          font-size: 18px;
          letter-spacing: 0.5px;
        }

        .active-count {
          font-size: 12px;
          color: #94a3b8;
        }

        .selected-agents-pills {
          display: flex;
          gap: 8px;
        }

        .agent-pill {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid;
          backdrop-filter: blur(4px);
        }

        .no-agents-pill {
          font-size: 12px;
          color: #64748b;
          font-style: italic;
        }

        /* Messages */
        .messages-viewport {
          flex: 1;
          position: relative;
          overflow: hidden;
        }

        .messages-container {
          height: 100%;
          overflow-y: auto;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Scrollbar */
        .messages-container::-webkit-scrollbar { width: 6px; }
        .messages-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #64748b;
          text-align: center;
        }

        .empty-visual-ring {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 1px dashed rgba(99, 102, 241, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          animation: spin 20s linear infinite;
        }

        .empty-visual-inner {
          font-size: 32px;
          animation: pulse 2s infinite;
        }

        .message-row {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          max-width: 80%;
        }

        .message-row.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .message-row.agent {
          align-self: flex-start;
        }

        .message-avatar {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: #1e293b;
          border: 2px solid #334155;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        .message-bubble-container {
          display: flex;
          flex-direction: column;
        }

        .message-agent-name {
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 4px;
          margin-left: 12px;
        }

        .message-bubble {
          padding: 14px 18px;
          border-radius: 18px;
          font-size: 15px;
          line-height: 1.6;
          position: relative;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .user .message-bubble {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .agent .message-bubble {
          background: rgba(31, 41, 55, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #f1f5f9;
          border-top-left-radius: 4px;
        }

        .message-time {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.3);
          margin-top: 6px;
          align-self: flex-end;
          margin-right: 4px;
        }

        .user .message-time {
          align-self: flex-start;
          margin-left: 4px;
          margin-right: 0;
        }

        /* Typing Indicator */
        .typing-indicator-bubble {
          background: rgba(31, 41, 55, 0.7);
          padding: 12px 16px;
          border-radius: 18px;
          border-top-left-radius: 4px;
          display: flex;
          gap: 6px;
        }

        .dot {
          width: 8px;
          height: 8px;
          background: #64748b;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Input Area */
        .input-area {
          padding: 24px 32px;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .input-wrapper {
          position: relative;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          transition: all 0.2s;
        }

        .input-wrapper:focus-within {
          background: rgba(255, 255, 255, 0.05);
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }

        .chat-input {
          width: 100%;
          padding: 18px 60px 18px 24px;
          background: transparent;
          border: none;
          color: white;
          font-size: 15px;
        }

        .chat-input:focus {
          outline: none;
        }

        .input-actions {
          position: absolute;
          right: 8px;
          top: 8px;
          bottom: 8px;
        }

        .send-button {
          height: 100%;
          aspect-ratio: 1;
          border-radius: 10px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: all 0.2s;
        }

        .send-button:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
        }

        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #334155;
        }
      `}</style>
    </div>
  );
};

export default MultiAgentChat;
