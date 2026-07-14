import React, { useMemo, useState } from 'react';
import { useOperatorSynergy } from '../../hooks/useOperatorSynergy';
import { useRoute } from '../route-context';
import FederationNodeService from '../../services/FederationNodeService';

/**
 * Live local + federated agents on every page — quick chat / A2A from current route context.
 */
export const AgentPresenceRail: React.FC = () => {
  const { unifiedAgents, state, refresh } = useOperatorSynergy();
  const { currentRoute, navigate } = useRoute();
  const [message, setMessage] = useState('');
  const [targetId, setTargetId] = useState('');

  const agents = useMemo(() => unifiedAgents, [unifiedAgents]);

  const sendToAgent = () => {
    const agentId = targetId || agents[0]?.id;
    if (!agentId || !message.trim()) return;
    const content = `[Desktop ${currentRoute}] ${message.trim()}`;
    FederationNodeService.sendA2AMessage(agentId, content, 'desktop_ui');
    setMessage('');
  };

  const askAboutPage = () => {
    const agentId = targetId || agents[0]?.id;
    if (!agentId) return;
    FederationNodeService.sendA2AMessage(
      agentId,
      `Inspect TNF Desktop page ${currentRoute}. Use federation metadata uiPathways to navigate and interact.`,
      'desktop_ui_context'
    );
  };

  return (
    <section className="agent-presence-rail" aria-label="Live AI agents">
      <div className="rail-header">
        <div>
          <strong>Live AI Agents</strong>
          <span className="rail-meta">
            {agents.length} connected · route {currentRoute}
          </span>
        </div>
        <div className="rail-actions">
          <button type="button" className="rail-btn" onClick={() => void refresh()}>
            Refresh
          </button>
          <button type="button" className="rail-btn" onClick={() => navigate('/agents')}>
            Agent Hub
          </button>
          <button type="button" className="rail-btn primary" onClick={askAboutPage} disabled={!agents.length}>
            Ask about this page
          </button>
        </div>
      </div>

      <div className="agent-chip-row" role="list">
        {agents.length === 0 ? (
          <p className="rail-empty">
            {state.relayConnected
              ? 'No agents on relay yet — start local CLI agents or enable REST API on :3001.'
              : 'Relay offline — start standalone relay (:3007) for federated agents.'}
          </p>
        ) : (
          agents.map((agent) => (
            <button
              key={agent.id}
              type="button"
              role="listitem"
              className={`agent-chip ${targetId === agent.id ? 'selected' : ''}`}
              onClick={() => {
                setTargetId(agent.id);
                navigate('/chat');
              }}
              title={`${agent.name} (${agent.source})`}
            >
              <span className={`dot ${agent.status === 'active' ? 'on' : 'idle'}`} aria-hidden />
              <span className="name">{agent.name}</span>
              <span className="src">{agent.source === 'federation' ? 'fed' : 'local'}</span>
            </button>
          ))
        )}
      </div>

      {agents.length > 0 ? (
        <div className="rail-composer">
          <select
            aria-label="Target agent"
            value={targetId || agents[0]?.id || ''}
            onChange={(e) => setTargetId(e.target.value)}
          >
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Message agent about this page…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendToAgent()}
          />
          <button type="button" className="rail-btn primary" onClick={sendToAgent} disabled={!message.trim()}>
            Send
          </button>
        </div>
      ) : null}

      <style>{`
        .agent-presence-rail {
          margin-bottom: 20px;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid var(--tnf-border);
          background: var(--tnf-surface-card);
          color: var(--tnf-text-primary);
        }
        .rail-header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }
        .rail-header strong {
          display: block;
          font-size: 14px;
          color: var(--tnf-text-primary);
        }
        .rail-meta {
          font-size: 12px;
          color: var(--tnf-text-secondary);
        }
        .rail-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .rail-btn {
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid var(--tnf-border);
          background: var(--tnf-surface);
          color: var(--tnf-text-primary);
          cursor: pointer;
        }
        .rail-btn.primary {
          border-color: rgba(99, 102, 241, 0.45);
          background: rgba(99, 102, 241, 0.2);
          color: #e0e7ff;
        }
        .rail-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .agent-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
        }
        .rail-empty {
          margin: 0;
          font-size: 13px;
          color: var(--tnf-text-secondary);
        }
        .agent-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid var(--tnf-border);
          background: var(--tnf-surface);
          color: var(--tnf-text-primary);
          cursor: pointer;
          font-size: 12px;
        }
        .agent-chip.selected {
          border-color: rgba(99, 102, 241, 0.55);
          background: rgba(99, 102, 241, 0.15);
        }
        .agent-chip .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #94a3b8;
        }
        .agent-chip .dot.on {
          background: #34d399;
        }
        .agent-chip .src {
          font-size: 10px;
          color: var(--tnf-text-secondary);
          text-transform: uppercase;
        }
        .rail-composer {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .rail-composer select,
        .rail-composer input {
          flex: 1;
          min-width: 140px;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid var(--tnf-border);
          background: rgba(15, 23, 42, 0.75);
          color: var(--tnf-text-primary);
          font-size: 13px;
        }
      `}</style>
    </section>
  );
};

export default AgentPresenceRail;
