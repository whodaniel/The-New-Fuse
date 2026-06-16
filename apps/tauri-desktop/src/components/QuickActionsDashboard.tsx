/**
 * Quick Actions Dashboard
 *
 * A visual dashboard for non-technical users to access TNF features
 * without needing to use CLI commands.
 *
 * Philosophy: Every CLI command should have a corresponding button.
 */

import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-shell';
import React, { useCallback, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface ActionCategory {
  name: string;
  icon: string;
  description: string;
  actions: QuickAction[];
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  description: string;
  command?: string;
  url?: string;
  handler?: () => Promise<void>;
  requiresConfirmation?: boolean;
  confirmMessage?: string;
}

interface ExecutionResult {
  success: boolean;
  message: string;
  output?: string;
}

// ============================================================================
// ACTION CATEGORIES
// ============================================================================

const ACTION_CATEGORIES: ActionCategory[] = [
  {
    name: 'Operator Forefront',
    icon: '🚀',
    description: 'One-click operator surface: local UI, browser control, harness',
    actions: [
      {
        id: 'forefront-boot',
        label: 'Launch Forefront Stack',
        icon: '⚡',
        description: 'Boot harness, relay, local UI, and open browser control',
        command: 'node scripts/local-ui/tnf-forefront-boot.cjs',
      },
      {
        id: 'local-ui',
        label: 'Start Local UI',
        icon: '🖥️',
        description: 'Web operator shell on http://localhost:1420',
        command: 'pnpm run tnf:local-ui',
      },
      {
        id: 'cursor-harness',
        label: 'Onboard Cursor Harness',
        icon: '🎯',
        description: 'Wire Cursor CLI into TNF harness protocol + MCP routing',
        command: 'node scripts/cursor/tnf-cursor-harness-onboard.cjs',
      },
      {
        id: 'relay-start',
        label: 'Start Browser Relay',
        icon: '🔌',
        description: 'Start relay-core for Chrome extension browser control',
        command: 'pnpm run relay:start',
      },
    ],
  },
  {
    name: 'AI Agents',
    icon: '🤖',
    description: 'Manage AI agents and multi-agent conversations',
    actions: [
      {
        id: 'join-network',
        label: 'Join Agent Network',
        icon: '🔗',
        description: 'Register this app as an agent on the Redis network',
        command: 'node scripts/tnf-agent-cli.cjs register tauri-app participant tauri',
      },
      {
        id: 'view-agents',
        label: 'View Active Agents',
        icon: '👥',
        description: 'See all AI agents currently connected',
        command: 'node scripts/tnf-agent-cli.cjs list',
      },
      {
        id: 'start-conversation',
        label: 'Start AI Conversation',
        icon: '💬',
        description: 'Begin a new multi-AI conversation',
        command: 'node scripts/tnf-agent-cli.cjs convo start general',
      },
      {
        id: 'run-orchestration',
        label: 'Run Orchestration Demo',
        icon: '🎭',
        description: 'Demo: Orchestrator + Broker + Workers pattern',
        command: 'node scripts/orchestration-demo.cjs',
      },
    ],
  },
  {
    name: 'Analysis & Tools',
    icon: '🔍',
    description: 'Code analysis and development tools',
    actions: [
      {
        id: 'typecheck',
        label: 'TypeScript Check',
        icon: '📝',
        description: 'Check for TypeScript errors',
        command: 'pnpm run typecheck',
      },
      {
        id: 'lint',
        label: 'Lint Code',
        icon: '🧹',
        description: 'Run linting on the codebase',
        command: 'pnpm run lint',
      },
      {
        id: 'test',
        label: 'Run Tests',
        icon: '🧪',
        description: 'Execute test suite',
        command: 'pnpm run test',
      },
      {
        id: 'build',
        label: 'Build Project',
        icon: '🏗️',
        description: 'Build the entire project',
        command: 'pnpm run build',
        requiresConfirmation: true,
        confirmMessage: 'Building the project may take several minutes. Continue?',
      },
    ],
  },
  {
    name: 'External Tools',
    icon: '🌐',
    description: 'Open external TNF tools and services',
    actions: [
      {
        id: 'open-theia',
        label: 'Open Theia IDE',
        icon: '💻',
        description: 'Open the cloud-based Theia IDE',
        url: 'https://skideancer-ide-241337102384.us-central1.run.app',
      },
      {
        id: 'open-website',
        label: 'Open TNF Website',
        icon: '🌍',
        description: 'Open the main TNF website',
        url: 'https://thenewfuse.com',
      },
      {
        id: 'open-github',
        label: 'Open GitHub',
        icon: '📦',
        description: 'View the TNF GitHub repository',
        url: 'https://github.com/whodaniel/fuse',
      },
      {
        id: 'open-cloud_runtime',
        label: 'CloudRuntime Dashboard',
        icon: '🚂',
        description: 'Manage CloudRuntime deployments',
        url: 'https://cloud_runtime.app/dashboard',
      },
    ],
  },
  {
    name: 'Development',
    icon: '⚡',
    description: 'Start and manage development services',
    actions: [
      {
        id: 'start-dev',
        label: 'Start Dev Server',
        icon: '▶️',
        description: 'Start all development services',
        command: 'pnpm run dev',
      },
      {
        id: 'start-redis',
        label: 'Start Redis',
        icon: '🔴',
        description: 'Ensure Redis server is running',
        command: 'redis-server --daemonize yes || echo "Redis already running"',
      },
      {
        id: 'check-services',
        label: 'Check Services',
        icon: '✅',
        description: 'Verify all services are running',
        command: 'scripts/check-health.sh',
      },
      {
        id: 'clean-node',
        label: 'Clean Node Modules',
        icon: '🗑️',
        description: 'Remove node_modules for fresh install',
        command: 'rm -rf node_modules && pnpm install',
        requiresConfirmation: true,
        confirmMessage:
          'This will delete node_modules and reinstall. This may take a while. Continue?',
      },
    ],
  },
  {
    name: 'Settings',
    icon: '⚙️',
    description: 'Configure TNF settings',
    actions: [
      {
        id: 'edit-env',
        label: 'Edit Environment',
        icon: '📄',
        description: 'Open .env file for editing',
        command: 'code .env',
      },
      {
        id: 'view-modes',
        label: 'View AI Modes',
        icon: '🎨',
        description: 'List available AI interaction modes',
        command: 'cat .agent/workflows/*.md',
      },
      {
        id: 'view-config',
        label: 'View Configuration',
        icon: '📋',
        description: 'Display current configuration',
        command: 'cat package.json | head -30',
      },
    ],
  },
];

// ============================================================================
// QUICK ACTIONS DASHBOARD COMPONENT
// ============================================================================

export const QuickActionsDashboard: React.FC = () => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('AI Agents');
  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [results, setResults] = useState<Map<string, ExecutionResult>>(new Map());
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState('');

  // Execute a command
  const executeCommand = useCallback(async (action: QuickAction) => {
    if (action.requiresConfirmation) {
      const confirmed = window.confirm(action.confirmMessage || 'Are you sure?');
      if (!confirmed) return;
    }

    setIsExecuting(action.id);
    setResults((prev) => new Map(prev).set(action.id, { success: true, message: 'Running...' }));

    try {
      if (action.url) {
        // Open URL
        await open(action.url);
        setResults((prev) =>
          new Map(prev).set(action.id, {
            success: true,
            message: 'Opened in browser',
          })
        );
      } else if (action.command) {
        // Execute command
        const output = await invoke<string>('execute_command', { command: action.command });
        setTerminalOutput((prev) => prev + `\n$ ${action.command}\n${output}\n`);
        setResults((prev) =>
          new Map(prev).set(action.id, {
            success: true,
            message: 'Completed',
            output,
          })
        );
      } else if (action.handler) {
        // Custom handler
        await action.handler();
        setResults((prev) =>
          new Map(prev).set(action.id, {
            success: true,
            message: 'Completed',
          })
        );
      }
    } catch (error) {
      setResults((prev) =>
        new Map(prev).set(action.id, {
          success: false,
          message: `Error: ${error}`,
        })
      );
    } finally {
      setIsExecuting(null);
    }
  }, []);

  // Toggle category
  const toggleCategory = (name: string) => {
    setExpandedCategory((prev) => (prev === name ? null : name));
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          <span style={styles.titleIcon}>⚡</span>
          Quick Actions
        </h1>
        <p style={styles.subtitle}>
          One-click access to all TNF features. No command line required!
        </p>
      </div>

      {/* Categories */}
      <div style={styles.categories}>
        {ACTION_CATEGORIES.map((category) => (
          <div key={category.name} style={styles.category}>
            {/* Category Header */}
            <button onClick={() => toggleCategory(category.name)} style={styles.categoryHeader}>
              <span style={styles.categoryIcon}>{category.icon}</span>
              <div style={styles.categoryInfo}>
                <span style={styles.categoryName}>{category.name}</span>
                <span style={styles.categoryDescription}>{category.description}</span>
              </div>
              <span style={styles.expandIcon}>
                {expandedCategory === category.name ? '▼' : '▶'}
              </span>
            </button>

            {/* Actions */}
            {expandedCategory === category.name && (
              <div style={styles.actions}>
                {category.actions.map((action) => {
                  const result = results.get(action.id);
                  const isRunning = isExecuting === action.id;

                  return (
                    <button
                      key={action.id}
                      onClick={() => executeCommand(action)}
                      disabled={isRunning}
                      style={{
                        ...styles.actionButton,
                        ...(isRunning ? styles.actionButtonRunning : {}),
                        ...(result?.success === false ? styles.actionButtonError : {}),
                      }}
                    >
                      <span style={styles.actionIcon}>{action.icon}</span>
                      <div style={styles.actionInfo}>
                        <span style={styles.actionLabel}>{action.label}</span>
                        <span style={styles.actionDescription}>{action.description}</span>
                        {result && (
                          <span
                            style={{
                              ...styles.actionResult,
                              color: result.success ? '#9ece6a' : '#f7768e',
                            }}
                          >
                            {result.message}
                          </span>
                        )}
                      </div>
                      {isRunning && <span style={styles.spinner}>⏳</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Terminal Output Toggle */}
      <button onClick={() => setShowTerminal(!showTerminal)} style={styles.terminalToggle}>
        {showTerminal ? '▼ Hide Terminal Output' : '▶ Show Terminal Output'}
      </button>

      {showTerminal && (
        <pre style={styles.terminalOutput}>{terminalOutput || 'No commands executed yet.'}</pre>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          💡 Tip: Hover over any action to see what it does before clicking.
        </p>
      </div>
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
    backgroundColor: 'var(--tnf-obsidian, #020617)',
    color: 'var(--tnf-text-primary, #f8fafc)',
    padding: '20px',
    overflow: 'auto',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '24px',
    fontWeight: 700,
    fontFamily: 'var(--tnf-font-heading)',
    color: 'var(--tnf-text-primary)',
    margin: '0 0 8px 0',
  },
  titleIcon: {
    fontSize: '28px',
  },
  subtitle: {
    color: 'var(--tnf-text-muted)',
    fontSize: '14px',
    margin: 0,
  },
  categories: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  category: {
    backgroundColor: 'var(--tnf-surface)',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid var(--tnf-border)',
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '16px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--tnf-text-primary)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.2s',
  },
  categoryIcon: {
    fontSize: '24px',
  },
  categoryInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  categoryName: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--tnf-text-primary)',
  },
  categoryDescription: {
    fontSize: '12px',
    color: 'var(--tnf-text-muted)',
  },
  expandIcon: {
    fontSize: '12px',
    color: 'var(--tnf-text-muted)',
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '8px',
    padding: '0 8px 12px 8px',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    backgroundColor: 'var(--tnf-surface-hover)',
    border: '1px solid var(--tnf-border)',
    borderRadius: '6px',
    color: 'var(--tnf-text-primary)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  actionButtonRunning: {
    opacity: 0.7,
    cursor: 'wait',
  },
  actionButtonError: {
    borderColor: 'var(--tnf-error)',
  },
  actionIcon: {
    fontSize: '20px',
    marginTop: '2px',
  },
  actionInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  actionLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--tnf-text-primary)',
  },
  actionDescription: {
    fontSize: '11px',
    color: 'var(--tnf-text-muted)',
  },
  actionResult: {
    fontSize: '11px',
    marginTop: '4px',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
  terminalToggle: {
    marginTop: '16px',
    padding: '8px 12px',
    backgroundColor: 'transparent',
    border: '1px solid var(--tnf-border)',
    borderRadius: '4px',
    color: 'var(--tnf-text-muted)',
    cursor: 'pointer',
    fontSize: '12px',
    alignSelf: 'flex-start',
  },
  terminalOutput: {
    marginTop: '8px',
    padding: '12px',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: '6px',
    border: '1px solid var(--tnf-border)',
    fontFamily: 'var(--tnf-font-mono, monospace)',
    fontSize: '12px',
    color: 'var(--tnf-success)',
    maxHeight: '200px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: '16px',
    borderTop: '1px solid var(--tnf-border)',
  },
  footerText: {
    color: 'var(--tnf-text-muted)',
    fontSize: '12px',
    margin: 0,
  },
};

export default QuickActionsDashboard;
