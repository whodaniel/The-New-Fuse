import React, { useEffect, useRef, useState } from 'react';
import PageShell from '../components/layout/PageShell';
import SynergyStatusBar from '../components/layout/SynergyStatusBar';
import { useOperatorSynergy } from '../hooks/useOperatorSynergy';
import FederationNodeService from '../services/FederationNodeService';

interface A2AMessage {
  id: string;
  senderId: string;
  receiverId: string;
  type: string;
  content: string;
  status: 'sent' | 'received' | 'processed' | 'failed';
  timestamp: string;
}

const A2AControl: React.FC = () => {
  const { unifiedAgents, state: synergy } = useOperatorSynergy();
  const [messages, setMessages] = useState<A2AMessage[]>([]);
  const [targetAgent, setTargetAgent] = useState('');
  const [messageType, setMessageType] = useState('task');
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handler = (raw?: unknown) => {
      const msg = raw as
        | { id?: string; from?: string; content?: string; channel?: string; timestamp?: number }
        | undefined;
      if (!msg?.content || msg.from === FederationNodeService.getState().agentId) {
        return;
      }

      setMessages((prev) => [
        ...prev.slice(-99),
        {
          id: msg.id || `${Date.now()}`,
          senderId: msg.from || 'unknown',
          receiverId: msg.channel || 'bus',
          type: 'federation',
          content: msg.content || '',
          status: 'received',
          timestamp: new Date(msg.timestamp || Date.now()).toISOString(),
        },
      ]);
    };

    FederationNodeService.on('channel_message', handler);
    return () => FederationNodeService.off('channel_message', handler);
  }, []);

  const handleSend = async () => {
    if (!messageContent.trim() || !targetAgent || !synergy.relayRegistered) {
      return;
    }

    setIsSending(true);
    const entry: A2AMessage = {
      id: `${Date.now()}`,
      senderId: FederationNodeService.getState().agentId,
      receiverId: targetAgent,
      type: messageType,
      content: messageContent.trim(),
      status: 'sent',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, entry]);

    if (!synergy.relayRegistered) {
      setMessages((prev) =>
        prev.map((m) => (m.id === entry.id ? { ...m, status: 'failed' as const } : m))
      );
      setIsSending(false);
      return;
    }

    try {
      FederationNodeService.sendA2AMessage(targetAgent, messageContent.trim(), messageType);
      setMessages((prev) =>
        prev.map((m) => (m.id === entry.id ? { ...m, status: 'processed' as const } : m))
      );
      setMessageContent('');
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === entry.id ? { ...m, status: 'failed' as const } : m))
      );
    } finally {
      setIsSending(false);
    }
  };

  const selfId = FederationNodeService.getState().agentId;
  const targets = unifiedAgents.filter((a) => a.id !== selfId);

  return (
    <PageShell
      title="A2A Control"
      subtitle={`Agent-to-agent message bus · ${synergy.relayRegistered ? 'Federation online' : 'Connect relay to enable A2A'}`}
      actions={
        <span className={`env-badge ${synergy.relayRegistered ? 'local' : 'offline'}`}>
          {synergy.relayRegistered ? `${synergy.federatedAgentCount} agents` : 'offline'}
        </span>
      }
      banner={
        !synergy.relayRegistered ? (
          <div className="offline-banner">
            Federation relay is not registered. Open Dashboard and connect relay, or start
            standalone relay on port 3000.
          </div>
        ) : null
      }
    >
      <SynergyStatusBar />
      <div className="a2a-layout">
        <div className="tnf-card a2a-composer">
          <h3 className="tnf-section-title">Send Message</h3>
          <div className="composer-field">
            <label htmlFor="a2a-target">Target Agent</label>
            <select
              id="a2a-target"
              value={targetAgent}
              onChange={(e) => setTargetAgent(e.target.value)}
            >
              <option value="">Select agent...</option>
              {targets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.platform})
                </option>
              ))}
            </select>
          </div>
          <div className="composer-field">
            <label htmlFor="a2a-type">Message Type</label>
            <select
              id="a2a-type"
              value={messageType}
              onChange={(e) => setMessageType(e.target.value)}
            >
              <option value="task">Task</option>
              <option value="query">Query</option>
              <option value="broadcast">Broadcast</option>
              <option value="control">Control</option>
            </select>
          </div>
          <div className="composer-field">
            <label htmlFor="a2a-content">Content</label>
            <textarea
              id="a2a-content"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Enter A2A message..."
              rows={4}
            />
          </div>
          <button
            className="primary-button"
            onClick={() => void handleSend()}
            disabled={
              isSending || !messageContent.trim() || !targetAgent || !synergy.relayRegistered
            }
          >
            {isSending ? 'Sending…' : 'Send A2A Message'}
          </button>
        </div>

        <div className="tnf-card a2a-bus">
          <div className="bus-header">
            <h3 className="tnf-section-title">Message Bus</h3>
            <span className="bus-count">{messages.length} messages</span>
          </div>
          <div className="bus-messages">
            {messages.length === 0 ? (
              <div className="empty-state">
                No A2A messages yet. Send a message to start the bus.
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`bus-message ${msg.status}`}>
                  <div className="msg-header">
                    <span className="msg-sender">{msg.senderId.slice(0, 20)}</span>
                    <span className="msg-arrow">→</span>
                    <span className="msg-receiver">{msg.receiverId.slice(0, 20)}</span>
                    <span className={`msg-type ${msg.type}`}>{msg.type}</span>
                    <span className={`msg-status ${msg.status}`}>{msg.status}</span>
                  </div>
                  <div className="msg-body">{msg.content}</div>
                  <div className="msg-time">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <style>{`
        .a2a-layout {
          display: grid;
          grid-template-columns: minmax(280px, 360px) 1fr;
          gap: 20px;
          align-items: start;
        }
        .composer-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
        }
        .composer-field label {
          font-size: 12px;
          font-weight: 600;
          color: var(--tnf-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .composer-field select,
        .composer-field textarea {
          border-radius: 10px;
          border: 1px solid var(--tnf-border);
          background: rgba(15, 23, 42, 0.55);
          color: var(--tnf-text-primary);
          padding: 10px 12px;
          font-size: 14px;
          font-family: inherit;
        }
        .bus-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .bus-count {
          font-size: 12px;
          color: var(--tnf-text-muted);
        }
        .bus-messages {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 520px;
          overflow-y: auto;
        }
        .bus-message {
          padding: 12px;
          border-radius: 10px;
          border: 1px solid var(--tnf-border);
          background: rgba(15, 23, 42, 0.45);
        }
        .msg-header {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          margin-bottom: 8px;
          color: var(--tnf-text-muted);
        }
        .msg-arrow { color: var(--tnf-primary-light); }
        .msg-type {
          padding: 2px 6px;
          border-radius: 6px;
          background: rgba(99, 102, 241, 0.15);
          color: #c4b5fd;
        }
        .msg-status.processed { color: #6ee7b7; }
        .msg-status.failed { color: #fca5a5; }
        .msg-body { font-size: 14px; line-height: 1.5; }
        .msg-time { margin-top: 6px; font-size: 11px; color: var(--tnf-text-muted); }
        @media (max-width: 900px) {
          .a2a-layout { grid-template-columns: 1fr; }
        }
      `}</style>
    </PageShell>
  );
};

export default A2AControl;
