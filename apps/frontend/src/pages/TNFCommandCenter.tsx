/**
 * TNF Unified Command Center
 * Single pane of glass for entire TNF + OpenClaw mesh
 * 
 * Sections:
 * - Mesh Health (OpenClaw instances)
 * - Agent Activity (live state)
 * - System Metrics
 * - Task Queue
 * - Recent Logs
 * - Quick Actions
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Cpu,
  Database,
  Globe,
  Layers,
  Network,
  RefreshCw,
  Server,
  Shield,
  Terminal,
  Users,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { GlassCard } from '../components/ui/premium/GlassCard';
import { PremiumButton } from '../components/ui/premium/PremiumButton';

// ============================================================================
// TYPES
// ============================================================================

interface MeshInstance {
  id: string;
  name: string;
  url: string;
  status: 'online' | 'offline' | 'degraded';
  latency?: number;
  activeSessions?: number;
  model?: string;
  lastCheck: number;
}

interface AgentActivity {
  sessionKey: string;
  status: 'idle' | 'thinking' | 'working' | 'error';
  currentTool?: string;
  startedAt?: number;
  lastActivity: number;
}

interface SystemMetrics {
  totalSessions: number;
  activeAgents: number;
  messagesProcessed: number;
  errorRate: number;
  avgLatency: number;
}

interface TaskItem {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  createdAt: number;
}

interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
}

// ============================================================================
// MESH HEALTH COMPONENT
// ============================================================================

const MeshHealthPanel: React.FC<{
  instances: MeshInstance[];
  onRefresh: () => void;
  loading: boolean;
}> = ({ instances, onRefresh, loading }) => {
  const getStatusColor = (status: MeshInstance['status']) => {
    switch (status) {
      case 'online':
        return 'text-green-500';
      case 'offline':
        return 'text-red-500';
      case 'degraded':
        return 'text-yellow-500';
    }
  };

  const getStatusIcon = (status: MeshInstance['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'offline':
        return <WifiOff className="w-5 h-5 text-red-500" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Network className="w-5 h-5" />
          OpenClaw Mesh
        </h3>
        <PremiumButton
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </PremiumButton>
      </div>
      
      <div className="space-y-3">
        {instances.map((instance) => (
          <div
            key={instance.id}
            className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/10"
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(instance.status)}
              <div>
                <div className="font-medium">{instance.name}</div>
                <div className="text-xs text-gray-400">{instance.url}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={getStatusColor(instance.status)}>
                {instance.latency ? `${instance.latency}ms` : instance.status}
              </div>
              {instance.model && (
                <div className="text-xs text-gray-500">{instance.model}</div>
              )}
              {instance.activeSessions !== undefined && (
                <div className="text-xs text-gray-500">
                  {instance.activeSessions} sessions
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ============================================================================
// AGENT ACTIVITY PANEL
// ============================================================================

const AgentActivityPanel: React.FC<{ activities: AgentActivity[] }> = ({
  activities,
}) => {
  const getStatusColor = (status: AgentActivity['status']) => {
    switch (status) {
      case 'idle':
        return 'bg-gray-500';
      case 'thinking':
        return 'bg-purple-500 animate-pulse';
      case 'working':
        return 'bg-cyan-500 animate-pulse';
      case 'error':
        return 'bg-red-500';
    }
  };

  const activeCount = activities.filter(
    (a) => a.status === 'thinking' || a.status === 'working'
  ).length;

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Agent Activity
        </h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${activeCount > 0 ? 'bg-cyan-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-sm text-gray-400">
            {activeCount} active
          </span>
        </div>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No active agents
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.sessionKey}
              className="flex items-center gap-3 p-2 rounded bg-black/20"
            >
              <div className={`w-3 h-3 rounded-full ${getStatusColor(activity.status)}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {activity.sessionKey.split(':').pop()}
                </div>
                {activity.currentTool && (
                  <div className="text-xs text-gray-400">
                    Tool: {activity.currentTool}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {activity.status}
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
};

// ============================================================================
// METRICS PANEL
// ============================================================================

const MetricsPanel: React.FC<{ metrics: SystemMetrics }> = ({ metrics }) => {
  return (
    <GlassCard className="p-4">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5" />
        System Metrics
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 rounded-lg bg-black/20">
          <div className="text-2xl font-bold text-cyan-400">
            {metrics.totalSessions}
          </div>
          <div className="text-xs text-gray-400">Sessions</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-black/20">
          <div className="text-2xl font-bold text-purple-400">
            {metrics.activeAgents}
          </div>
          <div className="text-xs text-gray-400">Active Agents</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-black/20">
          <div className="text-2xl font-bold text-green-400">
            {metrics.messagesProcessed.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400">Messages</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-black/20">
          <div className="text-2xl font-bold text-yellow-400">
            {metrics.avgLatency}ms
          </div>
          <div className="text-xs text-gray-400">Avg Latency</div>
        </div>
      </div>
      
      {metrics.errorRate > 0 && (
        <div className="mt-4 p-2 rounded bg-red-500/20 border border-red-500/50">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4" />
            Error Rate: {(metrics.errorRate * 100).toFixed(1)}%
          </div>
        </div>
      )}
    </GlassCard>
  );
};

// ============================================================================
// TASK QUEUE PANEL
// ============================================================================

const TaskQueuePanel: React.FC<{ tasks: TaskItem[] }> = ({ tasks }) => {
  const getPriorityColor = (priority: TaskItem['priority']) => {
    switch (priority) {
      case 'critical':
        return 'border-l-red-500 bg-red-500/10';
      case 'high':
        return 'border-l-orange-500 bg-orange-500/10';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'border-l-gray-500 bg-gray-500/10';
    }
  };

  const getStatusIcon = (status: TaskItem['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'in_progress':
        return '🔄';
      case 'completed':
        return '✅';
      case 'blocked':
        return '🚫';
    }
  };

  return (
    <GlassCard className="p-4">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5" />
        Task Queue
      </h3>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No pending tasks
          </div>
        ) : (
          tasks.slice(0, 10).map((task) => (
            <div
              key={task.id}
              className={`p-2 rounded border-l-4 ${getPriorityColor(task.priority)}`}
            >
              <div className="flex items-center gap-2">
                <span>{getStatusIcon(task.status)}</span>
                <span className="text-sm font-medium truncate flex-1">
                  {task.title}
                </span>
              </div>
              {task.assignee && (
                <div className="text-xs text-gray-400 mt-1">
                  Assigned: {task.assignee}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
};

// ============================================================================
// LOGS PANEL
// ============================================================================

const LogsPanel: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-400';
      case 'warn':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      case 'debug':
        return 'text-gray-500';
    }
  };

  return (
    <GlassCard className="p-4">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <Terminal className="w-5 h-5" />
        Recent Logs
      </h3>
      
      <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No recent logs
          </div>
        ) : (
          logs.slice(0, 20).map((log, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-gray-500">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={getLevelColor(log.level)}>[{log.level.toUpperCase()}]</span>
              <span className="text-gray-400">[{log.source}]</span>
              <span className="text-gray-200 truncate">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
};

// ============================================================================
// QUICK ACTIONS PANEL
// ============================================================================

const QuickActionsPanel: React.FC<{
  onAction: (action: string) => void;
}> = ({ onAction }) => {
  const actions = [
    { id: 'deploy', label: 'Deploy to Production', icon: Globe, color: 'text-green-400' },
    { id: 'restart-mesh', label: 'Restart Mesh', icon: RefreshCw, color: 'text-yellow-400' },
    { id: 'clear-logs', label: 'Clear Logs', icon: Terminal, color: 'text-gray-400' },
    { id: 'run-tests', label: 'Run Tests', icon: Shield, color: 'text-blue-400' },
    { id: 'new-agent', label: 'New Agent', icon: Brain, color: 'text-purple-400' },
    { id: 'view-docs', label: 'Documentation', icon: Database, color: 'text-cyan-400' },
  ];

  return (
    <GlassCard className="p-4">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5" />
        Quick Actions
      </h3>
      
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action.id)}
            className="flex items-center gap-2 p-3 rounded-lg bg-black/20 hover:bg-black/40 border border-white/10 hover:border-white/20 transition-all text-left"
          >
            <action.icon className={`w-4 h-4 ${action.color}`} />
            <span className="text-sm">{action.label}</span>
          </button>
        ))}
      </div>
    </GlassCard>
  );
};

// ============================================================================
// MAIN COMMAND CENTER
// ============================================================================

export const TNFCommandCenter: React.FC = () => {
  // State
  const [meshInstances, setMeshInstances] = useState<MeshInstance[]>([
    {
      id: 'local-desktop',
      name: 'Local Desktop',
      url: 'ws://127.0.0.1:18789',
      status: 'offline',
      lastCheck: 0,
    },
    {
      id: 'cloud-primary',
      name: 'Cloud Primary',
      url: 'https://openclaw-cloud-production-934c.up.railway.app',
      status: 'offline',
      lastCheck: 0,
    },
    {
      id: 'sandbox',
      name: 'Sandbox',
      url: 'ws://127.0.0.1:18791',
      status: 'offline',
      lastCheck: 0,
    },
  ]);

  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalSessions: 0,
    activeAgents: 0,
    messagesProcessed: 0,
    errorRate: 0,
    avgLatency: 0,
  });
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(0);

  // Fetch mesh health
  const fetchMeshHealth = useCallback(async () => {
    setLoading(true);
    const now = Date.now();

    // Check each mesh instance
    const updatedInstances = await Promise.all(
      meshInstances.map(async (instance) => {
        try {
          const start = Date.now();
          const response = await fetch(`${instance.url}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
          });
          const latency = Date.now() - start;

          if (response.ok) {
            const data = await response.json();
            return {
              ...instance,
              status: 'online' as const,
              latency,
              activeSessions: data.activeSessions,
              model: data.model,
              lastCheck: now,
            };
          } else {
            return {
              ...instance,
              status: 'degraded' as const,
              latency,
              lastCheck: now,
            };
          }
        } catch (error) {
          return {
            ...instance,
            status: 'offline' as const,
            lastCheck: now,
          };
        }
      })
    );

    setMeshInstances(updatedInstances);
    
    // Calculate aggregate metrics
    const onlineInstances = updatedInstances.filter((i) => i.status === 'online');
    const totalSessions = onlineInstances.reduce(
      (sum, i) => sum + (i.activeSessions || 0),
      0
    );
    const avgLatency = onlineInstances.length
      ? Math.round(
          onlineInstances.reduce((sum, i) => sum + (i.latency || 0), 0) /
            onlineInstances.length
        )
      : 0;

    setMetrics((prev) => ({
      ...prev,
      totalSessions,
      avgLatency,
    }));

    setLastRefresh(now);
    setLoading(false);
  }, [meshInstances]);

  // Fetch agent activities from Cloudflare
  const fetchAgentActivities = useCallback(async () => {
    try {
      const response = await fetch(
        'https://tnf-agent-orchestration.bizsynth.workers.dev/agent-status'
      );
      if (response.ok) {
        const data = await response.json();
        setAgentActivities(data.activities || []);
        setMetrics((prev) => ({
          ...prev,
          activeAgents: data.activities?.filter(
            (a: AgentActivity) => a.status === 'thinking' || a.status === 'working'
          ).length || 0,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch agent activities:', error);
    }
  }, []);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    // TODO: Wire to real task queue
    // For now, show placeholder
    setTasks([
      {
        id: '1',
        title: 'Agent Activity Pulse Implementation',
        status: 'in_progress',
        priority: 'high',
        createdAt: Date.now() - 3600000,
      },
      {
        id: '2',
        title: 'Jules Session Triage (3130712200087854334)',
        status: 'pending',
        priority: 'medium',
        createdAt: Date.now() - 7200000,
      },
      {
        id: '3',
        title: 'Move entire UI into TNF branding',
        status: 'pending',
        priority: 'critical',
        createdAt: Date.now() - 86400000,
      },
    ]);
  }, []);

  // Handle quick actions
  const handleAction = useCallback((action: string) => {
    setLogs((prev) => [
      {
        timestamp: Date.now(),
        level: 'info',
        source: 'command-center',
        message: `Action triggered: ${action}`,
      },
      ...prev.slice(0, 99),
    ]);

    switch (action) {
      case 'restart-mesh':
        // TODO: Implement mesh restart
        break;
      case 'new-agent':
        window.location.href = '/agents/new';
        break;
      case 'view-docs':
        window.location.href = '/docs';
        break;
      default:
        console.log('Unknown action:', action);
    }
  }, []);

  // Initial load and refresh interval
  useEffect(() => {
    fetchMeshHealth();
    fetchAgentActivities();
    fetchTasks();

    const interval = setInterval(() => {
      fetchMeshHealth();
      fetchAgentActivities();
    }, 30000); // 30s refresh

    return () => clearInterval(interval);
  }, [fetchMeshHealth, fetchAgentActivities, fetchTasks]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            TNF Command Center
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Unified control panel for The New Fuse + OpenClaw Mesh
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Last refresh: {lastRefresh ? new Date(lastRefresh).toLocaleTimeString() : 'Never'}
          </div>
          <PremiumButton onClick={() => {
            fetchMeshHealth();
            fetchAgentActivities();
            fetchTasks();
          }} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh All
          </PremiumButton>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <MeshHealthPanel
            instances={meshInstances}
            onRefresh={fetchMeshHealth}
            loading={loading}
          />
          <AgentActivityPanel activities={agentActivities} />
          <QuickActionsPanel onAction={handleAction} />
        </div>

        {/* Center Column */}
        <div className="space-y-6">
          <MetricsPanel metrics={metrics} />
          <TaskQueuePanel tasks={tasks} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <LogsPanel logs={logs} />
          
          {/* Embedded Observatory Link */}
          <GlassCard className="p-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5" />
              Deep Dive
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <a
                href="/observatory"
                className="flex items-center gap-2 p-2 rounded bg-black/20 hover:bg-black/40 text-sm"
              >
                <Database className="w-4 h-4 text-cyan-400" />
                Observatory
              </a>
              <a
                href="/admin"
                className="flex items-center gap-2 p-2 rounded bg-black/20 hover:bg-black/40 text-sm"
              >
                <Shield className="w-4 h-4 text-purple-400" />
                Admin Panel
              </a>
              <a
                href="/a2a-control"
                className="flex items-center gap-2 p-2 rounded bg-black/20 hover:bg-black/40 text-sm"
              >
                <Users className="w-4 h-4 text-green-400" />
                A2A Control
              </a>
              <a
                href="/admin/system-metrics"
                className="flex items-center gap-2 p-2 rounded bg-black/20 hover:bg-black/40 text-sm"
              >
                <Activity className="w-4 h-4 text-yellow-400" />
                Metrics
              </a>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default TNFCommandCenter;
