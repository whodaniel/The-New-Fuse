/**
 * Agents Tab - View Active Agents in Network
 */

import { useEffect, useState } from 'react';

interface Props {
  status: any;
}

export default function AgentsTab({ status }: Props) {
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    // Request agent list from background
    chrome.runtime.sendMessage({ type: 'GET_AGENT_LIST' }, (response) => {
      if (response?.success && response.agents) {
        setAgents(response.agents);
      }
    });

    // Listen for agent list updates
    const listener = (message: any) => {
      if (message.type === 'AGENT_LIST_UPDATE') {
        setAgents(message.agents || []);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const roleColors: Record<string, string> = {
    orchestrator: 'neon-text-purple',
    broker: 'neon-text-cyan',
    worker: 'neon-text-green',
    participant: 'text-secondary',
  };

  return (
    <div className="agents-tab">
      <div className="section">
        <div className="section-header">
          <span className="section-icon">🤖</span>
          <h2 className="section-title">Agent Network ({agents.length} Active)</h2>
        </div>

        {/* This Browser */}
        <div className="subsection">
          <h3 className="subsection-title">📡 This Browser</h3>
          <div className="agent-card local">
            <div className="agent-header">
              <span className="agent-name">{status.agentId}</span>
              <span className="agent-badge participant">PARTICIPANT</span>
            </div>
            <div className="agent-details">
              <div className="agent-detail">
                <span>Platform:</span>
                <span className="neon-text-cyan">{status.currentPlatform || 'Not detected'}</span>
              </div>
              <div className="agent-detail">
                <span>Status:</span>
                <span className="status-online">● Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Network Agents */}
        {agents.length > 0 && (
          <div className="subsection">
            <h3 className="subsection-title">🌐 Network Agents</h3>
            <div className="agent-list">
              {agents.map((agent) => (
                <div key={agent.name} className="agent-card">
                  <div className="agent-header">
                    <span className="agent-name">{agent.name}</span>
                    <span className={`agent-badge ${agent.role}`}>{agent.role.toUpperCase()}</span>
                  </div>
                  <div className="agent-details">
                    <div className="agent-detail">
                      <span>Platform:</span>
                      <span className={roleColors[agent.role] || 'text-secondary'}>
                        {agent.platform}
                      </span>
                    </div>
                    <div className="agent-detail">
                      <span>Status:</span>
                      <span className={`status-${agent.status}`}>● {agent.status}</span>
                    </div>
                    {agent.capabilities && (
                      <div className="agent-capabilities">
                        {agent.capabilities.slice(0, 3).map((cap: string) => (
                          <span key={cap} className="capability-tag">
                            {cap}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {agents.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p className="empty-text">No network agents detected</p>
            <p className="empty-subtext text-secondary">
              Connect to TNF Relay to see active agents
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
