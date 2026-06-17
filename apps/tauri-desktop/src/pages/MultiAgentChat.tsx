import React, { useEffect, useRef, useState } from 'react';
import PageShell from '../components/layout/PageShell';
import SynergyStatusBar from '../components/layout/SynergyStatusBar';
import { useOperatorSynergy } from '../hooks/useOperatorSynergy';
import type { FederationChannelMessage } from '../services/FederationNodeService';
import FederationNodeService from '../services/FederationNodeService';
import { wsService } from '../services/websocket';
import type { ChatMessage } from '../types';

/**
 * Multi-Agent Chat Page
 * Chat with multiple AI agents simultaneously
 */
const MultiAgentChat: React.FC = () => {
  const { unifiedAgents, state: synergy, sendFederationMessage } = useOperatorSynergy();
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadingTimeoutRef = useRef<number | null>(null);

  const clearLoadingTimeout = () => {
    if (loadingTimeoutRef.current !== null) {
      window.clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  };

  const stopLoading = () => {
    clearLoadingTimeout();
    setIsLoading(false);
  };

  // Safety net so the typing indicator never spins forever if no reply arrives.
  const armLoadingTimeout = (ms: number, notice: string) => {
    clearLoadingTimeout();
    loadingTimeoutRef.current = window.setTimeout(() => {
      loadingTimeoutRef.current = null;
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-timeout`,
          role: 'system',
          content: notice,
          timestamp: new Date().toISOString(),
        },
      ]);
    }, ms);
  };

  useEffect(() => {
    if (selectedAgents.length === 0 && unifiedAgents.length > 0) {
      setSelectedAgents(unifiedAgents.slice(0, 2).map((agent) => agent.id));
    }
  }, [selectedAgents.length, unifiedAgents]);

  useEffect(() => {
    // Connect to WebSocket
    wsService.connect();
    const unsubConnection = wsService.onConnection(setIsConnected);

    // Listen for incoming messages
    const unsubMessages = wsService.on('chat:message', (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
      stopLoading();
    });

    return () => {
      unsubConnection();
      unsubMessages();
      clearLoadingTimeout();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handler = (raw?: unknown) => {
      const payload = raw as FederationChannelMessage | undefined;
      if (!payload?.content || payload.from === FederationNodeService.getState().agentId) return;

      const agent = unifiedAgents.find((entry) => entry.id === payload.from);
      if (selectedAgents.length > 0 && !selectedAgents.includes(payload.from)) return;

      const incoming: ChatMessage = {
        id: payload.id || `${Date.now()}-fed`,
        role: 'agent',
        content: payload.content,
        agentId: payload.from,
        agentName: agent?.name || payload.from,
        timestamp: new Date(payload.timestamp || Date.now()).toISOString(),
      };

      setMessages((prev) => [...prev, incoming]);
      stopLoading();
    };

    FederationNodeService.on('channel_message', handler);
    return () => {
      FederationNodeService.off('channel_message', handler);
    };
  }, [selectedAgents, unifiedAgents]);

  const handleSend = () => {
    if (!input.trim() || selectedAgents.length === 0) return;

    const messageText = input.trim();

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Send via API websocket, federation channel, or relay echo
    if (isConnected && synergy.apiOnline) {
      wsService.sendChatMessage('main', messageText, selectedAgents);
      armLoadingTimeout(
        30000,
        '⚠️ No response from the API within 30s. The request may still be processing — check the agent or REST API on port 3001.'
      );
    } else if (synergy.relayRegistered) {
      const joined = FederationNodeService.getState().joinedChannels;
      const channelId = joined[0] || 'general';
      sendFederationMessage(
        channelId,
        JSON.stringify({
          type: 'operator_chat',
          content: messageText,
          targets: selectedAgents,
          from: FederationNodeService.getState().agentId,
        })
      );
      armLoadingTimeout(8000, '⚠️ No federated agent replied within 8s.');
    } else {
      stopLoading();
      const offlineNotice: ChatMessage = {
        id: `${Date.now()}-offline`,
        role: 'system',
        content:
          '⚠️ Relay and API are offline — message not sent. Connect relay from Dashboard → Forefront panel or start the REST API on port 3001.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, offlineNotice]);
    }
  };

  const toggleAgent = (agentId: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  const getAgentColor = (platform: string) => {
    const colors: Record<string, string> = {
      claude: '#f97316',
      gpt: '#10b981',
      gemini: '#3b82f6',
      perplexity: '#8b5cf6',
      custom: '#64748b',
      local: '#eab308',
      'tauri-desktop': '#6366f1',
      'federation-node': '#8b5cf6',
    };
    return colors[platform] || '#64748b';
  };

  const activeAgents = unifiedAgents.filter((a) => a.status !== 'error' && a.status !== 'offline');

  return (
    <PageShell
      className="page-fill"
      title="Multi-Agent Chat"
      subtitle={`${activeAgents.length} agents available · ${synergy.relayRegistered ? 'federation' : synergy.apiOnline ? 'API' : 'offline'}`}
      banner={
        !synergy.relayRegistered && !(synergy.apiOnline && isConnected) ? (
          <div className="offline-banner">
            Chat requires the REST API websocket or a registered federation relay. Messages will not
            be delivered while offline.
          </div>
        ) : null
      }
    >
      <SynergyStatusBar />
      <div className="page-fill-body">
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
                  <div
                    className="agent-avatar"
                    style={{ borderColor: getAgentColor(agent.platform) }}
                  >
                    {agent.source === 'federation' ? '🌐' : '🤖'}
                  </div>
                  <div className="agent-info">
                    <span className="agent-name">{agent.name}</span>
                    <span className="agent-model">{agent.platform}</span>
                  </div>
                  {selectedAgents.includes(agent.id) && <span className="check-mark">✓</span>}
                </button>
              ))}
            </div>

            <div className="connection-status">
              <span
                className={`status-dot ${synergy.relayRegistered || isConnected ? 'connected' : 'disconnected'}`}
              ></span>
              <span>
                {synergy.apiOnline && isConnected
                  ? 'API + WS'
                  : synergy.relayRegistered
                    ? 'Federation'
                    : 'Offline'}
              </span>
            </div>
          </aside>

          {/* Chat Area */}
          <div className="chat-main">
            <header className="chat-header">
              <div className="selected-agents">
                {selectedAgents.map((id) => {
                  const agent = unifiedAgents.find((a) => a.id === id);
                  if (!agent) return null;
                  return (
                    <span
                      key={id}
                      className="agent-chip"
                      style={{ borderColor: getAgentColor(agent.platform) }}
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
                              unifiedAgents.find((a) => a.id === msg.agentId)?.platform || 'custom'
                            ),
                          }}
                        >
                          {msg.agentName}
                        </span>
                      </div>
                    )}
                    <div className="message-content">{msg.content}</div>
                    <div className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
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
                placeholder={
                  selectedAgents.length > 0 ? 'Type your message...' : 'Select agents first'
                }
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
          </div>

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
      </div>
    </PageShell>
  );
};

export default MultiAgentChat;
