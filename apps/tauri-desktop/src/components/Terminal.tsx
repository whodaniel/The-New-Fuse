/**
 * Terminal Component for TNF Tauri Desktop
 *
 * Provides an embedded terminal within the Tauri app using xterm.js
 * Allows users to run TNF CLI commands without opening a separate terminal.
 */

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';

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
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const inputBuffer = useRef<string>('');

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const terminal = new XTerm({
      theme: {
        background: '#1a1b26',
        foreground: '#c0caf5',
        cursor: '#c0caf5',
        cursorAccent: '#1a1b26',
        selection: 'rgba(125, 174, 255, 0.3)',
        black: '#15161e',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#bb9af7',
        cyan: '#7dcfff',
        white: '#a9b1d6',
        brightBlack: '#414868',
        brightRed: '#f7768e',
        brightGreen: '#9ece6a',
        brightYellow: '#e0af68',
        brightBlue: '#7aa2f7',
        brightMagenta: '#bb9af7',
        brightCyan: '#7dcfff',
        brightWhite: '#c0caf5',
      },
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 14,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
    });

    // Add addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    // Open terminal
    terminal.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Write welcome message
    terminal.writeln('\x1b[1;34m╔═══════════════════════════════════════════════════╗\x1b[0m');
    terminal.writeln('\x1b[1;34m║       TNF Terminal - AI Agent Command Center      ║\x1b[0m');
    terminal.writeln('\x1b[1;34m╚═══════════════════════════════════════════════════╝\x1b[0m');
    terminal.writeln('');
    terminal.writeln('\x1b[33mType commands or use Quick Actions above.\x1b[0m');
    terminal.writeln('');

    // Connect to shell
    connectToShell(terminal);

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
    };
  }, []);

  // Connect to system shell via Tauri
  const connectToShell = async (terminal: XTerm) => {
    try {
      // Create a new PTY session
      const id = await invoke<string>('create_shell_session');
      setSessionId(id);
      setIsConnected(true);

      // Listen for output from the shell
      const unlisten = await listen<string>(`shell-output-${id}`, (event) => {
        terminal.write(event.payload);
        if (onOutput) {
          onOutput(event.payload);
        }
      });

      // Handle user input
      terminal.onData((data) => {
        invoke('write_to_shell', { sessionId: id, data });
      });

      // Write prompt
      terminal.write('\r\n\x1b[32m$\x1b[0m ');

      // Run initial command if provided
      if (initialCommand) {
        setTimeout(() => {
          invoke('write_to_shell', { sessionId: id, data: initialCommand + '\n' });
        }, 500);
      }

      return () => {
        unlisten();
        invoke('close_shell_session', { sessionId: id });
      };
    } catch (error) {
      console.error('Failed to connect to shell:', error);
      terminal.writeln('\x1b[31mFailed to connect to shell. Using local echo mode.\x1b[0m');

      // Fallback to local echo mode
      enableLocalEchoMode(terminal);
    }
  };

  // Local echo mode fallback
  const enableLocalEchoMode = (terminal: XTerm) => {
    terminal.write('\r\n\x1b[32m$\x1b[0m ');

    terminal.onData((data) => {
      if (data === '\r') {
        // Enter pressed
        const command = inputBuffer.current;
        inputBuffer.current = '';
        terminal.write('\r\n');

        if (command.trim()) {
          executeLocalCommand(terminal, command);
        } else {
          terminal.write('\x1b[32m$\x1b[0m ');
        }
      } else if (data === '\u007F') {
        // Backspace
        if (inputBuffer.current.length > 0) {
          inputBuffer.current = inputBuffer.current.slice(0, -1);
          terminal.write('\b \b');
        }
      } else if (data >= ' ' && data <= '~') {
        // Regular character
        inputBuffer.current += data;
        terminal.write(data);
      }
    });
  };

  // Execute command locally (for basic commands when PTY unavailable)
  const executeLocalCommand = async (terminal: XTerm, command: string) => {
    try {
      const result = await invoke<string>('execute_command', { command });
      terminal.write(result);
    } catch (error) {
      terminal.writeln(`\x1b[31mError: ${error}\x1b[0m`);
    }
    terminal.write('\r\n\x1b[32m$\x1b[0m ');
  };

  // Run a quick action
  const runQuickAction = useCallback(
    (action: QuickAction) => {
      if (!xtermRef.current) return;

      const terminal = xtermRef.current;
      terminal.write(`\r\n\x1b[33m> ${action.command}\x1b[0m\r\n`);

      if (sessionId) {
        invoke('write_to_shell', { sessionId, data: action.command + '\n' });
      } else {
        executeLocalCommand(terminal, action.command);
      }
    },
    [sessionId]
  );

  return (
    <div className={`terminal-container ${className}`} style={styles.container}>
      {/* Quick Actions Bar */}
      {showQuickActions && (
        <div style={styles.quickActions}>
          <span style={styles.quickActionsLabel}>Quick Actions:</span>
          {QUICK_ACTIONS.map((action, index) => (
            <button
              key={index}
              onClick={() => runQuickAction(action)}
              style={styles.quickActionButton}
              title={action.description}
            >
              <span style={styles.quickActionIcon}>{action.icon}</span>
              <span style={styles.quickActionLabel}>{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Connection Status */}
      <div style={styles.statusBar}>
        <span
          style={{
            ...styles.statusDot,
            backgroundColor: isConnected ? '#9ece6a' : '#f7768e',
          }}
        />
        <span style={styles.statusText}>
          {isConnected ? 'Connected to shell' : 'Local echo mode'}
        </span>
      </div>

      {/* Terminal */}
      <div ref={terminalRef} style={styles.terminal} />
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
    backgroundColor: '#1a1b26',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  quickActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#16161e',
    borderBottom: '1px solid #292e42',
    overflowX: 'auto',
    flexWrap: 'nowrap',
  },
  quickActionsLabel: {
    color: '#565f89',
    fontSize: '12px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  quickActionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    backgroundColor: '#292e42',
    border: 'none',
    borderRadius: '4px',
    color: '#c0caf5',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  },
  quickActionIcon: {
    fontSize: '14px',
  },
  quickActionLabel: {
    fontWeight: 500,
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    backgroundColor: '#16161e',
    borderBottom: '1px solid #292e42',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  statusText: {
    color: '#565f89',
    fontSize: '11px',
  },
  terminal: {
    flex: 1,
    padding: '8px',
  },
};

export default Terminal;
