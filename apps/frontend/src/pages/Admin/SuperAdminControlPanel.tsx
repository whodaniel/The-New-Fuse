import { GlassCard, StatsCard } from '@/components/ui/premium/GlassCard';
import { PremiumButton } from '@/components/ui/premium/PremiumButton';
import { useAuthorization } from '@/hooks/useAuthorization';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Bot,
  MessageSquare,
  Network,
  RefreshCw,
  Search,
  Server,
  Shield,
  StopCircle,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LlmRoutingControl } from './components/LlmRoutingControl';

interface RelayChannel {
  id: string;
  name: string;
  members?: string[];
}

interface ActivityEvent {
  id: string;
  type: string;
  source: string;
  content: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error' | 'info';
  channelId?: string;
  metadata?: Record<string, unknown>;
}

interface MeshInstance {
  name: string;
  status: string;
  load: string;
}

interface Agent {
  id: string;
  name: string;
  status?: string;
}

const mapRawActivityEvent = (e: Record<string, any>): ActivityEvent => ({
  id: e.id || e.streamId || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type: e.type || e.eventType || 'message',
  source: e.source || 'system',
  content: e.content || '',
  timestamp: new Date(e.relayTimestamp || e.originalTimestamp || Date.now()),
  status: e.content?.toLowerCase().includes('error') ? 'error' : 'success',
  channelId: e.channel,
  metadata: e.metadata,
});

const DASHBOARD_THEME = {
  primary: 'cyan',
  secondary: 'indigo',
  background: 'slate-950',
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

export default function SuperAdminControlPanel() {
  const { isSuperAdmin, userRole } = useAuthorization();

  // Relay URLs
  const relayHttpBase = useMemo(
    () =>
      (import.meta.env.VITE_RELAY_HTTP_URL as string | undefined)?.replace(/\/$/, '') ||
      'http://localhost:3000',
    []
  );

  const relayWsUrl = useMemo(() => {
    const fromEnv = (import.meta.env.VITE_RELAY_WS_URL as string | undefined)?.trim();
    if (fromEnv) return fromEnv;
    return `${relayHttpBase.replace(/^http/i, 'ws')}/ws`;
  }, [relayHttpBase]);

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meshInstances, setMeshInstances] = useState<MeshInstance[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [channels, setChannels] = useState<RelayChannel[]>([]);
  const [stats, setStats] = useState({
    onlineAgents: 0,
    activeSessions: 0,
    messagesLastHour: 0,
    systemLoad: 0,
    uptime: 'N/A',
    nodes: 'N/A',
  });

  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  const orchestrationSignals = useMemo(() => {
    return activities
      .filter((activity) => {
        const eventType = String(
          activity?.metadata?.eventType || activity.type || ''
        ).toLowerCase();
        return eventType === 'task_poll_ranked' || eventType === 'task_queued_from_votes';
      })
      .slice(0, 12)
      .map((activity) => {
        const metadata: any = activity.metadata || {};
        const eventType = String(metadata.eventType || activity.type || '');
        const top = Array.isArray(metadata.top) ? metadata.top : [];
        const lead = top[0] || null;
        const score = metadata.score ?? lead?.score ?? null;
        const votes = metadata.votes || lead?.votes || null;
        const taskId = metadata.taskId || lead?.id || null;
        const title = metadata.title || lead?.title || null;
        return {
          id: activity.id,
          timestamp: activity.timestamp,
          eventType,
          content: activity.content,
          score: typeof score === 'number' ? score : null,
          votes:
            votes && typeof votes === 'object'
              ? {
                  up: Number((votes as any).up || 0),
                  down: Number((votes as any).down || 0),
                }
              : null,
          taskId: taskId ? String(taskId) : null,
          title: title ? String(title) : null,
        };
      });
  }, [activities]);

  const realtimeTrends = useMemo(() => {
    const now = Date.now();
    const windowMs = 5 * 60 * 1000;
    const recentSignals = orchestrationSignals.filter(
      (signal) => now - signal.timestamp.getTime() <= windowMs
    );
    const recentActivities = activities.filter(
      (activity) => now - activity.timestamp.getTime() <= windowMs
    );
    const queueEvents = recentSignals.filter(
      (signal) => signal.eventType.toLowerCase() === 'task_queued_from_votes'
    );
    const scored = recentSignals.filter((signal) => typeof signal.score === 'number');
    const avgScore = scored.length
      ? Math.round(scored.reduce((sum, signal) => sum + (signal.score || 0), 0) / scored.length)
      : 0;
    const votePressure = recentSignals.reduce(
      (sum, signal) => sum + ((signal.votes?.up || 0) - (signal.votes?.down || 0)),
      0
    );
    return {
      eventsPerMin: Number((recentActivities.length / 5).toFixed(1)),
      queuePerMin: Number((queueEvents.length / 5).toFixed(1)),
      avgScore,
      votePressure,
      sampleSize: recentActivities.length,
    };
  }, [activities, orchestrationSignals]);

  const syncRecentActivity = useCallback(async () => {
    try {
      const res = await fetch(`${relayHttpBase}/activity/recent?count=80`);
      if (!res.ok) return;
      const payload = await res.json();
      const rows: ActivityEvent[] = (payload?.events || []).map(mapRawActivityEvent);
      if (!rows.length) return;

      setActivities((prev) => {
        const merged = [...rows, ...prev];
        const seen = new Set<string>();
        const deduped: ActivityEvent[] = [];
        for (const item of merged) {
          if (seen.has(item.id)) continue;
          seen.add(item.id);
          deduped.push(item);
          if (deduped.length >= 120) break;
        }
        return deduped;
      });
    } catch {
      // silent: realtime visualizer sync should not hard-fail UI
    }
  }, [relayHttpBase]);

  // Load Initial Data
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [healthRes, activityRes, agentsRes, channelsRes] = await Promise.all([
        fetch(`${relayHttpBase}/health`).then((res) => (res.ok ? res.json() : null)),
        fetch(`${relayHttpBase}/activity/recent?count=50`).then((res) =>
          res.ok ? res.json() : { events: [] }
        ),
        fetch(`${relayHttpBase}/agents`).then((res) => (res.ok ? res.json() : [])),
        fetch(`${relayHttpBase}/channels`).then((res) => (res.ok ? res.json() : [])),
      ]);

      if (healthRes) {
        setStats((prev) => ({
          ...prev,
          onlineAgents: healthRes.agents || 0,
          activeSessions: healthRes.channels || 0,
          uptime: healthRes.uptime || 'N/A',
          nodes: healthRes.nodes || 'N/A',
        }));

        const items = [];
        if (healthRes.database)
          items.push({
            name: 'Database Pool',
            status: healthRes.database.status === 'connected' ? 'Healthy' : 'Error',
            load: 'Active',
          });
        if (healthRes.redis)
          items.push({
            name: 'Memory Cache',
            status: healthRes.redis.status === 'connected' ? 'Healthy' : 'Error',
            load: 'Sync',
          });
        if (healthRes.status)
          items.push({
            name: 'Core Gateway',
            status: healthRes.status === 'healthy' ? 'Healthy' : 'Critical',
            load: healthRes.load || 'Monitoring',
          });
        setMeshInstances(items);
      }

      if (activityRes.events) {
        setActivities(activityRes.events.map(mapRawActivityEvent));
      }

      setAgents(agentsRes);
      setChannels(channelsRes);
    } catch (err) {
      console.error('Failed to load control panel data:', err);
      setError('Connection to Relay failed. Is the standalone relay running?');
    } finally {
      setLoading(false);
    }
  }, [relayHttpBase]);

  // Connect WebSocket for Live updates
  const connectSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(relayWsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        // Request initial lists
        ws.send(JSON.stringify({ type: 'AGENT_LIST', source: 'admin-panel' }));
        ws.send(JSON.stringify({ type: 'CHANNEL_LIST', source: 'admin-panel' }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'CHANNEL_MESSAGE' || msg.type === 'MESSAGE_RECEIVE') {
            const payload = msg.payload;
            const newEvent: ActivityEvent = {
              id: payload.id || `evt-${Date.now()}`,
              type: payload.type || 'message',
              source: payload.from || 'unknown',
              content: payload.content || '',
              timestamp: new Date(payload.timestamp || Date.now()),
              status: 'info',
              channelId: payload.channel,
              metadata: payload.metadata,
            };
            setActivities((prev) => [newEvent, ...prev].slice(0, 100));
          } else if (msg.type === 'AGENT_LIST') {
            setAgents(msg.payload.agents || []);
          } else if (msg.type === 'CHANNEL_LIST') {
            setChannels(msg.payload.channels || []);
          } else if (msg.type === 'AGENT_STATUS') {
            // Update single agent status
            setAgents((prev) => {
              const exists = prev.find((a) => a.id === msg.payload.agent.id);
              if (exists) {
                return prev.map((a) => (a.id === msg.payload.agent.id ? msg.payload.agent : a));
              }
              return [...prev, msg.payload.agent];
            });
          }
        } catch (e) {
          console.warn('Failed to parse socket message', e);
        }
      };

      ws.onclose = () => setConnected(false);
      ws.onerror = () => setConnected(false);
    } catch (e) {
      console.error('Socket connection error', e);
    }
  }, [relayWsUrl]);

  useEffect(() => {
    loadInitialData();
    connectSocket();

    const interval = setInterval(loadInitialData, 30000);
    const activityInterval = setInterval(syncRecentActivity, 4000);
    return () => {
      clearInterval(interval);
      clearInterval(activityInterval);
      wsRef.current?.close();
    };
  }, [loadInitialData, connectSocket, syncRecentActivity]);

  // Actions
  const handleHaltAgents = async () => {
    if (!confirm('EMERGENCY: Are you sure you want to HALT ALL AGENTS across the network?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/autonomous/director/stop', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert('HALT command issued successfully.');
      } else {
        throw new Error('Failed to stop director');
      }
    } catch (e) {
      console.error('Halt failed', e);
      alert('Failed to issue HALT command.');
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="p-8 text-center max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400">
            This terminal is restricted to Super Admin accounts. Unauthorized access attempts are
            logged.
          </p>
          <Link to="/" className="mt-6 block text-cyan-400 hover:underline">
            Return to Safety
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-6 lg:p-10 space-y-8 bg-slate-950 min-h-screen text-slate-100 font-sans selection:bg-cyan-500/30"
    >
      {/* Header Area */}
      <motion.header
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <span className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 backdrop-blur-md">
              <Network className="w-10 h-10 text-cyan-400" />
            </span>
            <span>
              TNF{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Master Control
              </span>
            </span>
          </h1>
          <p className="text-slate-400 mt-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-500" />
            System-level monitoring & orchestration mesh
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div
            className={`px-4 py-2 rounded-full border flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-all duration-500 ${connected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
          >
            <div
              className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`}
            />
            {connected ? 'Relay Active' : 'Relay Offline'}
          </div>

          <PremiumButton variant="glass" size="sm" onClick={loadInitialData} className="group">
            <RefreshCw
              className={`w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`}
            />
            Sync Mesh
          </PremiumButton>
        </div>
      </motion.header>

      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatsCard
          label="Active Agents"
          value={agents.length}
          icon={Bot}
          gradient="cyan"
          change="Network nodes"
          changeType="neutral"
        />
        <StatsCard
          label="Cloud Nodes"
          value={stats.nodes}
          icon={Server}
          gradient="indigo"
          change="Mesh deployment"
          changeType="neutral"
        />
        <StatsCard
          label="Relay Channels"
          value={channels.length}
          icon={MessageSquare}
          gradient="purple"
          change="Live Streaming"
          changeType="positive"
        />
        <StatsCard
          label="Network Uptime"
          value={stats.uptime}
          icon={Activity}
          gradient="green"
          change="System telemetry"
          changeType="neutral"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <LlmRoutingControl />
      </motion.div>

      <motion.div variants={itemVariants}>
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm uppercase tracking-widest font-bold text-slate-300">
              Realtime Orchestration Trends
            </h3>
            <span className="text-[10px] text-slate-500">Window: last 5 minutes</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-slate-500 uppercase tracking-wide mb-1">Events / Min</div>
              <div className="text-xl font-bold text-cyan-300">{realtimeTrends.eventsPerMin}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-slate-500 uppercase tracking-wide mb-1">Queued / Min</div>
              <div className="text-xl font-bold text-indigo-300">{realtimeTrends.queuePerMin}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-slate-500 uppercase tracking-wide mb-1">Avg Score</div>
              <div className="text-xl font-bold text-emerald-300">{realtimeTrends.avgScore}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-slate-500 uppercase tracking-wide mb-1">Vote Pressure</div>
              <div
                className={`text-xl font-bold ${realtimeTrends.votePressure >= 0 ? 'text-amber-300' : 'text-rose-300'}`}
              >
                {realtimeTrends.votePressure >= 0 ? '+' : ''}
                {realtimeTrends.votePressure}
              </div>
            </div>
          </div>
          <div className="mt-3 text-[10px] text-slate-500">
            Sampled events: {realtimeTrends.sampleSize}
          </div>
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Interaction Feed */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <GlassCard className="flex flex-col h-[650px] overflow-hidden group">
            <div className="p-6 border-b border-white/5 bg-white/2 flex items-center justify-between">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
                Live Interaction Stream
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-mono">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  LISTENING
                </div>
                <div className="text-[10px] text-slate-500 font-mono">TNF:ACTIVITY:STREAM</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <AnimatePresence mode="popLayout">
                {activities.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-slate-600 gap-4"
                  >
                    <Search className="w-12 h-12 opacity-20" />
                    <p className="text-slate-500 tracking-widest text-xs uppercase">
                      Awaiting mesh synchronization...
                    </p>
                  </motion.div>
                ) : (
                  activities.map((activity) => (
                    <motion.div
                      key={activity.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-4 rounded-xl bg-white/2 border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all group/item"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-tighter ${
                              activity.status === 'error'
                                ? 'bg-red-500/20 text-red-400'
                                : activity.source === 'system'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-cyan-500/20 text-cyan-400'
                            }`}
                          >
                            {activity.source}
                          </span>
                          <span className="text-slate-500 text-[10px] tabular-nums">
                            {activity.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        {activity.channelId && (
                          <div className="text-[10px] text-slate-500 group-hover/item:text-slate-400 transition-colors">
                            CHL:{' '}
                            <span className="text-slate-400 font-bold">
                              {activity.channelId.slice(0, 8)}...
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-slate-300 break-words leading-relaxed pl-1 border-l-2 border-transparent group-hover/item:border-cyan-500/50 transition-all">
                        {activity.content}
                      </div>
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5 text-[10px] text-slate-500 grid grid-cols-2 gap-x-4 gap-y-1">
                          {Object.entries(activity.metadata)
                            .slice(0, 4)
                            .map(([k, v]: [string, unknown]) => (
                              <div key={k} className="truncate bg-white/2 px-2 py-1 rounded">
                                <span className="text-slate-600 uppercase mr-1">{k}:</span>{' '}
                                {String(v)}
                              </div>
                            ))}
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
              <div className="h-px w-full" id="stream-bottom" />
            </div>
          </GlassCard>
        </motion.div>

        {/* Sidebar Status Panels */}
        <motion.div variants={itemVariants} className="space-y-8">
          <GlassCard className="p-6 transition-transform hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                Orchestration Signals
              </h3>
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {orchestrationSignals.length} EVENTS
              </span>
            </div>
            {orchestrationSignals.length === 0 ? (
              <div className="text-slate-500 text-xs">No vote-driven task events yet.</div>
            ) : (
              <div className="space-y-2">
                {orchestrationSignals.slice(0, 6).map((signal) => (
                  <div
                    key={signal.id}
                    className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-indigo-300 uppercase tracking-wide">
                        {signal.eventType}
                      </span>
                      <span className="text-slate-500">
                        {signal.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    {signal.taskId && (
                      <div className="text-slate-300 font-mono mb-1">
                        Task: {signal.taskId.slice(0, 18)}
                      </div>
                    )}
                    {signal.title && (
                      <div className="text-slate-300 mb-1 truncate">{signal.title}</div>
                    )}
                    <div className="flex items-center gap-3 text-slate-400">
                      <span>Score: {signal.score ?? '-'}</span>
                      <span>
                        Votes: +{signal.votes?.up ?? 0} / -{signal.votes?.down ?? 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Online Agents List */}
          <GlassCard className="p-6 transition-transform hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                Connectivity Hub
              </h3>
              <span className="bg-cyan-500/20 text-cyan-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {agents.length} LIVE
              </span>
            </div>
            <div className="space-y-2">
              {agents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bot className="w-6 h-6 text-slate-600" />
                  </div>
                  <p className="text-slate-500 text-xs">No active nodes detected</p>
                </div>
              ) : (
                agents.slice(0, 6).map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-white/10 group-hover:border-cyan-500/50 transition-colors">
                          <Bot className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950 shadow-[0_0_8px_#10b981]" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{agent.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {agent.id.slice(0, 8)}
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-cyan-500/50 group-hover:text-cyan-400 transition-colors px-2 py-1 bg-cyan-500/5 rounded uppercase">
                      {agent.status || 'Active'}
                    </div>
                  </div>
                ))
              )}
            </div>

            <Link
              to="/admin/agent-management"
              className="group mt-6 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white transition-all font-bold tracking-widest uppercase"
            >
              Full Agent Fleet
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </GlassCard>

          {/* Quick Orchestration */}
          <GlassCard className="p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 relative">
              <Zap className="w-5 h-5 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
              Emergency Core
            </h3>
            <div className="grid grid-cols-2 gap-3 relative">
              <button
                onClick={handleHaltAgents}
                className="p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-[10px] font-black tracking-widest uppercase transition-all flex flex-col items-center gap-3 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] active:scale-95"
              >
                <StopCircle className="w-6 h-6" />
                HALT FLEET
              </button>
              <button className="p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 text-[10px] font-black tracking-widest uppercase transition-all flex flex-col items-center gap-3 active:scale-95">
                <RefreshCw className="w-6 h-6" />
                RESET MESH
              </button>
            </div>
            <p className="text-[9px] text-slate-600 mt-6 text-center italic font-mono uppercase tracking-widest leading-relaxed">
              Direct mesh commands bypass <br /> authorization middleware.
            </p>
          </GlassCard>

          {/* System Health */}
          <GlassCard className="p-6 bg-slate-900/50">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-400" />
              Mesh Integrity
            </h3>
            <div className="space-y-4">
              {meshInstances.length === 0 ? (
                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  ANALYZING MESH...
                </div>
              ) : (
                meshInstances.map((s, i) => (
                  <div key={i} className="flex justify-between items-center group/health">
                    <span className="text-xs font-medium text-slate-400 group-hover/health:text-slate-200 transition-colors uppercase tracking-tight">
                      {s.name}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-slate-600 font-mono tracking-tighter">
                        {s.load}
                      </span>
                      <div className="relative">
                        <div
                          className={`w-2 h-2 rounded-full ${s.status === 'Healthy' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}
                        />
                        {s.status === 'Healthy' && (
                          <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
