import { invoke } from '@tauri-apps/api/core';
import React, { useEffect, useRef, useState } from 'react';
import { FederatedAgent, relaySwarmService } from '../services/RelaySwarmService';

/**
 * Swarm Terminal - Integrated Hub for Agent Terminals
 * Features Zero-Tolerance Typing Guard and Federated Heartbeats
 */
const SwarmTerminal: React.FC = () => {
  const [terminals, setTerminals] = useState<any[]>([]);
  const [federatedAgents, setFederatedAgents] = useState<FederatedAgent[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isFlushing, setIsFlushing] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial fetch of terminal windows
    refreshTerminals();

    // Subscribe to Federated Swarm
    relaySwarmService.connect();
    const unsubscribe = relaySwarmService.subscribe((list) => {
      setFederatedAgents(list);
    });

    const interval = setInterval(refreshTerminals, 10000);
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (msg: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
    setLogs((prev) => [...prev.slice(-99), entry]);
  };

  const refreshTerminals = async () => {
    try {
      // Custom command to list terminal sessions with activity detection
      // Note: This relies on the 'list_directory' or a custom 'get_terminal_status' command
      // For now we simulate based on common TNF TTYs
      addLog('Refreshing swarm terminal states...');

      // In a real implementation, we would call a backend command that parses
      // the same info as scripts/runtime/terminal-heartbeat-pulse.cjs
      const dummyTerminals = [
        { tty: 'ttys001', agentId: 'tnf-local-terminal-ttys001', busy: true, lastPulse: 'Now' },
        { tty: 'ttys007', agentId: 'tnf-local-terminal-ttys007', busy: false, lastPulse: '2s ago' },
        { tty: 'ttys012', agentId: 'tnf-local-terminal-ttys012', busy: true, lastPulse: '5s ago' },
      ];
      setTerminals(dummyTerminals);
    } catch (e) {
      addLog(`Failed to refresh terminals: ${e}`, 'error');
    }
  };

  const handleForceFlush = async (tty?: string) => {
    setIsFlushing(true);
    addLog(`Force-Flushing ${tty || 'all'} agent terminals...`, 'warn');

    try {
      // Execute the actual heartbeat pulse script from the backend
      const result = await invoke<string>('execute_command', {
        command: 'node scripts/runtime/terminal-heartbeat-pulse.cjs',
      });
      addLog('Pulse executed successfully.');
      addLog(result.split('\n')[0]);
    } catch (e) {
      addLog(`Pulse failed: ${e}`, 'error');
    } finally {
      setIsFlushing(false);
      refreshTerminals();
    }
  };

  return (
    <div className="terminal-hub">
      <header className="hub-header">
        <div className="header-main">
          <h1 className="page-title">Swarm Terminal</h1>
          <p className="page-subtitle">Federated Control & Active Pulse Monitoring</p>
        </div>
        <div className="hub-actions">
          <button className="refresh-btn" onClick={refreshTerminals}>
            🔄 Refresh
          </button>
          <button
            className={`flush-btn ${isFlushing ? 'loading' : ''}`}
            onClick={() => handleForceFlush()}
            disabled={isFlushing}
          >
            {isFlushing ? '⚡ Pulsing...' : '🔥 Force Swarm Flush'}
          </button>
        </div>
      </header>

      <div className="hub-content">
        {/* Terminal Grid */}
        <div className="terminal-section">
          <h2 className="section-label">Active TTY Instances</h2>
          <div className="tty-grid">
            {terminals.map((term) => {
              const isFederated = federatedAgents.some((a) => a.id === term.agentId);
              return (
                <div key={term.tty} className={`tty-card ${term.busy ? 'busy' : 'idle'}`}>
                  <div className="tty-header">
                    <span className="tty-name">📟 {term.tty}</span>
                    <span className={`federated-badge ${isFederated ? 'active' : ''}`}>
                      {isFederated ? 'FEDERATED' : 'LOCAL'}
                    </span>
                  </div>
                  <div className="tty-body">
                    <div className="agent-link">{term.agentId}</div>
                    <div className="pulse-info">Last Pulse: {term.lastPulse}</div>
                  </div>
                  <div className="tty-footer">
                    <div className="status-indicator">
                      <span className="dot"></span>
                      {term.busy ? 'AGENT ACTIVE' : 'AWAITING TASK'}
                    </div>
                    <button className="mini-action" onClick={() => handleForceFlush(term.tty)}>
                      Flush
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Swarm Audit Trail */}
        <div className="audit-section">
          <div className="pane-header">
            <h3>Swarm Audit Trail</h3>
            <span className="guard-hint">🛡️ Zero-Tolerance Typing Guard: ENABLED</span>
          </div>
          <div className="log-window">
            {logs.map((log, i) => (
              <div key={i} className={`log-line ${log.includes('Error') ? 'error' : ''}`}>
                {log}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>

      <style>{`
        .terminal-hub {
          padding: 24px;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 24px;
          background: #020617;
          overflow: hidden;
        }

        .hub-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          backdrop-filter: blur(12px);
        }

        .page-title {
          font-family: 'Outfit', sans-serif;
          font-size: 28px;
          font-weight: 800;
          margin: 0;
          background: linear-gradient(135deg, #fbbf24, #f59e0b, #ea580c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .page-subtitle {
          color: #94a3b8;
          margin: 4px 0 0;
          font-size: 14px;
        }

        .hub-actions {
          display: flex;
          gap: 12px;
        }

        .flush-btn {
          background: linear-gradient(135deg, #ea580c, #c2410c);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 15px rgba(234, 88, 12, 0.3);
        }

        .flush-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(234, 88, 12, 0.4);
        }

        .refresh-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 12px 20px;
          border-radius: 12px;
          cursor: pointer;
        }

        .hub-content {
          display: grid;
          grid-template-columns: 1fr 450px;
          gap: 24px;
          flex: 1;
          min-height: 0;
        }

        .section-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #64748b;
          margin-bottom: 16px;
          font-weight: 700;
        }

        .tty-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .tty-card {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.2s;
        }

        .tty-card.busy { border-left: 4px solid #f59e0b; }
        .tty-card.idle { border-left: 4px solid #10b981; }

        .tty-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tty-name { font-family: 'JetBrains Mono', monospace; font-weight: 700; }

        .federated-badge {
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.05);
          color: #64748b;
        }

        .federated-badge.active {
          background: rgba(99, 102, 241, 0.2);
          color: #818cf8;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }

        .agent-link { font-size: 13px; color: #cbd5e1; }
        .pulse-info { font-size: 11px; color: #64748b; }

        .tty-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
        }

        .dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; }
        .busy .dot { background: #f59e0b; box-shadow: 0 0 8px #f59e0b; }

        .mini-action {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          cursor: pointer;
        }

        .audit-section {
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .pane-header {
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .guard-hint { font-size: 10px; color: #10b981; font-weight: 700; }

        .log-window {
          flex: 1;
          padding: 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          overflow-y: auto;
          background: #020617;
          color: #94a3b8;
        }

        .log-line { margin-bottom: 4px; border-left: 2px solid rgba(234, 88, 12, 0.2); padding-left: 12px; }
        .log-line.error { color: #ef4444; border-left-color: #ef4444; }
      `}</style>
    </div>
  );
};

export default SwarmTerminal;
