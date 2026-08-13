import * as React from 'react';

const TNF_MONITOR_ID = 'tnf-ai-monitor';

interface TNFLogEntry {
  timestamp: string;
  agentId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: unknown;
}

export const getOrCreateMonitor = (): HTMLElement => {
  let monitor = document.getElementById(TNF_MONITOR_ID);
  if (!monitor) {
    monitor = document.createElement('div');
    monitor.id = TNF_MONITOR_ID;
    monitor.setAttribute('data-tnf-monitor', 'true');
    monitor.style.cssText = `
      position: absolute;
      left: -9999px;
      top: -9999px;
      width: 1px;
      height: 1px;
      overflow: hidden;
      pointer-events: none;
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 0px;
    `;
    document.body.appendChild(monitor);
  }
  return monitor;
};

const logToMonitor = (entry: TNFLogEntry): void => {
  const monitor = getOrCreateMonitor();
  const logLine = `[${entry.timestamp}] [${entry.agentId.toUpperCase()}] [${entry.level.toUpperCase()}] ${entry.message}${entry.data ? ' ' + JSON.stringify(entry.data) : ''}`;

  const existingContent = monitor.textContent || '';
  const lines = existingContent.split('\n').filter(Boolean);

  lines.push(logLine);
  if (lines.length > 100) {
    lines.splice(0, lines.length - 100);
  }

  monitor.textContent = lines.join('\n');
};

const monitorHeartbeat = (
  agentId: string,
  status: 'alive' | 'dead',
  metadata?: Record<string, unknown>
): void => {
  const entry: TNFLogEntry = {
    timestamp: new Date().toISOString(),
    agentId,
    level: 'info',
    message: status === 'alive' ? '❤️ HEARTBEAT' : '💀 HEARTBEAT_STOP',
    data: metadata,
  };
  logToMonitor(entry);
};

export interface UseTNFLoggerOptions {
  agentId: string;
  maxLogs?: number;
}

export interface UseTNFLoggerReturn {
  log: (message: string, data?: unknown, level?: TNFLogEntry['level']) => void;
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
  debug: (message: string, data?: unknown) => void;
  heartbeat: (metadata?: Record<string, unknown>) => void;
  getRecentLogs: () => TNFLogEntry[];
}

export function useTNFLogger(options: UseTNFLoggerOptions): UseTNFLoggerReturn {
  const { agentId, maxLogs = 50 } = options;
  const logsRef = React.useRef<TNFLogEntry[]>([]);

  const createEntry = React.useCallback(
    (message: string, data?: unknown, level: TNFLogEntry['level'] = 'info'): TNFLogEntry => {
      return {
        timestamp: new Date().toISOString(),
        agentId,
        level,
        message,
        data,
      };
    },
    [agentId]
  );

  const log = React.useCallback(
    (message: string, data?: unknown, level: TNFLogEntry['level'] = 'info') => {
      const entry = createEntry(message, data, level);

      logsRef.current.push(entry);
      if (logsRef.current.length > maxLogs) {
        logsRef.current.shift();
      }

      logToMonitor(entry);
      console.log(`[TNF:${agentId}]`, message, data ?? '');
    },
    [agentId, maxLogs, createEntry]
  );

  const info = React.useCallback(
    (message: string, data?: unknown) => {
      log(message, data, 'info');
    },
    [log]
  );

  const warn = React.useCallback(
    (message: string, data?: unknown) => {
      log(message, data, 'warn');
    },
    [log]
  );

  const error = React.useCallback(
    (message: string, data?: unknown) => {
      log(message, data, 'error');
    },
    [log]
  );

  const debug = React.useCallback(
    (message: string, data?: unknown) => {
      log(message, data, 'debug');
    },
    [log]
  );

  const heartbeat = React.useCallback(
    (metadata?: Record<string, unknown>) => {
      monitorHeartbeat(agentId, 'alive', metadata);
    },
    [agentId]
  );

  const getRecentLogs = React.useCallback((): TNFLogEntry[] => {
    return [...logsRef.current];
  }, []);

  return {
    log,
    info,
    warn,
    error,
    debug,
    heartbeat,
    getRecentLogs,
  };
}

export interface TNFMonitorState {
  isAccessible: boolean;
  lastHeartbeat: string | null;
  agentId: string | null;
}

export function getTNFMonitorState(): TNFMonitorState {
  const monitor = document.getElementById(TNF_MONITOR_ID);

  if (!monitor || !monitor.textContent) {
    return {
      isAccessible: false,
      lastHeartbeat: null,
      agentId: null,
    };
  }

  const lines = monitor.textContent.split('\n').filter(Boolean);
  const heartbeatLine = lines.reverse().find((line) => line.includes('HEARTBEAT'));

  let lastHeartbeat: string | null = null;
  let agentId: string | null = null;

  if (heartbeatLine) {
    const match = heartbeatLine.match(/\[([^\]]+)\].*HEARTBEAT/);
    if (match) {
      agentId = match[1];
      const tsMatch = heartbeatLine.match(/^(\[.*?\])/);
      lastHeartbeat = tsMatch ? tsMatch[1] : null;
    }
  }

  return {
    isAccessible: true,
    lastHeartbeat,
    agentId,
  };
}

export function readTNFAIMonitor(): string {
  const monitor = document.getElementById(TNF_MONITOR_ID);
  return monitor?.textContent || '';
}
