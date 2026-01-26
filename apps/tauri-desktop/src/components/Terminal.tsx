import React, { useEffect, useRef, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface TerminalProps {
  className?: string;
  onOutput?: (data: string) => void;
  initialCommand?: string;
  showQuickActions?: boolean;
}

interface QuickAction {
  label: string;
  icon: string;
  command: string;
  description: string;
}

// ============================================================================
// QUICK ACTIONS
// ============================================================================

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'List Agents',
    icon: '🤖',
    command: 'node scripts/tnf-agent-cli.cjs list',
    description: 'View all registered AI agents',
  },
  {
    label: 'Start Agent',
    icon: '🚀',
    command: 'node scripts/tnf-agent-cli.cjs register my-agent participant vscode',
    description: 'Register as an agent on the network',
  },
  {
    label: 'Run Orchestration',
    icon: '🎭',
    command: 'node scripts/orchestration-demo.cjs',
    description: 'Run multi-agent orchestration demo',
  },
  {
    label: 'Analyze Code',
    icon: '🔍',
    command: 'pnpm run typecheck',
    description: 'Run TypeScript type checking',
  },
  {
    label: 'Build Project',
    icon: '🏗️',
    command: 'pnpm run build',
    description: 'Build the project',
  },
  {
    label: 'Start Services',
    icon: '⚡',
    command: 'pnpm run dev',
    description: 'Start development services',
  },
];

// ============================================================================
// TERMINAL COMPONENT
// ============================================================================

export const Terminal: React.FC<TerminalProps> = ({
  className = '',
  onOutput,
  initialCommand,
  showQuickActions = true,
}) => {
  const [history, setHistory] = useState<string[]>([
    'Welcome to TNF Terminal - AI Agent Command Center',
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate connection
    const timer = setTimeout(() => {
      setIsConnected(true);
      setHistory((prev) => [...prev, 'Uplink established.', '> ']);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, currentInput]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const cmd = currentInput.trim();
      const newHistory = [...history];
      // Remove the prompt from the last line if it exists
      if (newHistory.length > 0 && newHistory[newHistory.length - 1] === '> ') {
        newHistory.pop();
      }
      newHistory.push(`> ${cmd}`);

      // Sim response
      if (cmd === 'help') {
        newHistory.push('Available commands: help, status, agents, clear');
      } else if (cmd === 'clear') {
        setHistory(['> ']);
        setCurrentInput('');
        return;
      } else if (cmd) {
        newHistory.push(`Command not found: ${cmd}`);
      }
      newHistory.push('> ');
      setHistory(newHistory);
      setCurrentInput('');
    }
  };

  const runQuickAction = (action: QuickAction) => {
    setHistory((prev) => [
      ...prev.slice(0, prev.length - 1),
      `> ${action.command}`,
      'Executing quick action...',
      '> ',
    ]);
  };

  return (
    <div className={`terminal-container ${className}`} style={styles.container}>
      {/* Quick Actions Bar */}
      {showQuickActions && (
        <div style={styles.quickActions}>
          <span style={styles.quickActionsLabel}>COMMAND PROTOCOLS:</span>
          {QUICK_ACTIONS.map((action, index) => (
            <button
              key={index}
              onClick={() => runQuickAction(action)}
              className="quick-action-btn"
              title={action.description}
            >
              <span className="icon">{action.icon}</span>
              <span className="label">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Connection Status */}
      <div style={styles.statusBar}>
        <div style={styles.statusGroup}>
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          <span style={styles.statusText}>
            {isConnected ? 'UPLINK ESTABLISHED' : 'LOCAL ECHO: OFFLINE'}
          </span>
        </div>
        <span style={styles.secureBadge}>SECURE_SHELL_V4</span>
      </div>

      {/* Terminal Viewport with Effects */}
      <div className="terminal-viewport" style={styles.terminal}>
        <div className="scanline" />
        <div className="crt-flicker" />
        <div
          className="terminal-content"
          ref={scrollRef}
          style={{
            overflowY: 'auto',
            height: '100%',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '14px',
            color: '#c0caf5',
            paddingBottom: '20px',
          }}
        >
          {history.map((line, i) => (
            <div key={i} style={{ minHeight: '20px' }}>
              {line === '> ' ? (
                <span>
                  <span style={{ color: '#10b981' }}>{'>'}</span> {currentInput}
                  <span className="cursor">█</span>
                </span>
              ) : (
                line
              )}
            </div>
          ))}
        </div>
        <input
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            opacity: 0,
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
            cursor: 'default',
          }}
          autoFocus
        />
      </div>

      <style>{`
        .terminal-container {
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5), inset 0 0 0 1px #292e42;
          background: #0f111a;
          position: relative;
        }

        /* Quick Action Buttons */
        .quick-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(41, 46, 66, 0.5);
          border: 1px solid rgba(86, 95, 137, 0.3);
          border-radius: 4px;
          color: #7aa2f7;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .quick-action-btn:hover {
          background: rgba(65, 72, 104, 0.8);
          border-color: #7aa2f7;
          box-shadow: 0 0 8px rgba(122, 162, 247, 0.2);
          transform: translateY(-1px);
        }

        .quick-action-btn .icon {
          font-size: 12px;
        }

        /* Status Indicator */
        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.5);
        }
        .status-indicator.connected {
          background: #9ece6a;
          box-shadow: 0 0 8px #9ece6a;
          animation: pulse-green 2s infinite;
        }
        .status-indicator.disconnected {
          background: #f7768e;
          box-shadow: 0 0 8px #f7768e;
        }

        @keyframes pulse-green {
          0% { opacity: 1; box-shadow: 0 0 5px #9ece6a; }
          50% { opacity: 0.7; box-shadow: 0 0 2px #9ece6a; }
          100% { opacity: 1; box-shadow: 0 0 5px #9ece6a; }
        }

        /* Terminal Viewport */
        .terminal-viewport {
          position: relative;
          flex: 1;
          overflow: hidden;
          background: #1a1b26;
        }

        .cursor {
            animation: blink 1s step-end infinite;
            color: #10b981;
            margin-left: 2px;
        }

        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }

        /* CRT Effects */
        .scanline {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            to bottom,
            rgba(255,255,255,0),
            rgba(255,255,255,0) 50%,
            rgba(0,0,0,0.2) 50%,
            rgba(0,0,0,0.2)
          );
          background-size: 100% 4px;
          pointer-events: none;
          z-index: 10;
          opacity: 0.15;
          mix-blend-mode: overlay;
        }

        .crt-flicker {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(18, 16, 16, 0.1);
          opacity: 0;
          z-index: 10;
          pointer-events: none;
          animation: flicker 0.15s infinite;
        }

        @keyframes flicker {
          0% { opacity: 0.02; }
          50% { opacity: 0.05; }
          100% { opacity: 0.02; }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    borderRadius: '4px',
    overflow: 'hidden',
    border: '1px solid #292e42',
  },
  quickActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#13141f',
    borderBottom: '1px solid #292e42',
    overflowX: 'auto',
  },
  quickActionsLabel: {
    color: '#565f89',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '1px',
    marginRight: '8px',
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 12px',
    backgroundColor: '#16161e',
    borderBottom: '1px solid #1a1b26',
    fontFamily: '"JetBrains Mono", monospace',
  },
  statusGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusText: {
    color: '#565f89',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.5px',
  },
  secureBadge: {
    fontSize: '9px',
    color: '#343b59',
    padding: '2px 4px',
    border: '1px solid #24283b',
    borderRadius: '2px',
  },
  terminal: {
    flex: 1,
    padding: '12px',
    position: 'relative',
  },
};

export default Terminal;
