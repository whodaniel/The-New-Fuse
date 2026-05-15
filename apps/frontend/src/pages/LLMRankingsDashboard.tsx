// @ts-nocheck
import {
  GlassCard,
  StatsCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Cpu,
  Globe,
  Loader2,
  RefreshCw,
  Shield,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

interface CompositeScore {
  compositeRank: number;
  nvidiaId: string;
  avgArenaScore: number;
  healthStatus: string;
  latencyMs: number | null;
}

interface Recommendation {
  action: string;
  model: string;
  currentPriority: number | null;
  proposedPriority: number | null;
  delta: number | string;
  reason: string;
}

interface NvidiaHealthItem {
  model: string;
  status: string;
  httpStatus: number | null;
  latencyMs: number | null;
}

interface NewsItem {
  title: string;
  url: string;
  source: string;
  sentiment: string;
  publishedAt: string;
  relevantNvidiaModels: string[];
}

interface RankingData {
  compositeScores: CompositeScore[];
  recommendations: Recommendation[];
  newsDigest: NewsItem[];
  summary: {
    totalModelsScored: number;
    liveModels: number;
    recommendationsCount: number;
    newsItems: number;
  };
  generatedAt: string;
}

interface IntelData {
  nvidiaHealth: NvidiaHealthItem[];
  completedAt: string;
  summary: {
    nvidiaLive: number;
    nvidiaSlow: number;
    arenaSourcesOk: number;
  };
}

function healthColor(status: string) {
  switch (status) {
    case 'live': return 'text-green-400';
    case 'slow': return 'text-yellow-400';
    case 'eol': return 'text-red-400';
    case 'error': return 'text-orange-400';
    default: return 'text-muted-foreground';
  }
}

function healthBg(status: string) {
  switch (status) {
    case 'live': return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'slow': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case 'eol': return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'error': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
}

function actionBg(action: string) {
  switch (action) {
    case 'add': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    case 'reorder': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    case 'remove-eol': return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'demote': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
}

export default function LLMRankingsDashboard() {
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [intelData, setIntelData] = useState<IntelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [recsRes, intelRes] = await Promise.all([
        axios.get('/api/llm-intel/ranking-recommendations'),
        axios.get('/api/llm-intel/arena-intel-latest'),
      ]);
      setRankingData(recsRes.data);
      setIntelData(intelRes.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('No intel data yet. Run `pnpm tnf:llm:collect` and `pnpm tnf:llm:optimize` first.');
      } else {
        setError(err.message || 'Failed to load LLM ranking data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const scores = rankingData?.compositeScores || [];
  const recommendations = rankingData?.recommendations || [];
  const newsDigest = rankingData?.newsDigest || [];
  const nvidiaHealth = intelData?.nvidiaHealth || [];
  const summary = { ...rankingData?.summary, ...intelData?.summary };
  const maxArenaScore = Math.max(...scores.map(s => s.avgArenaScore || 0), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading LLM rankings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Activity className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-6 space-y-6 max-w-7xl mx-auto">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            LLM Rankings Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {rankingData?.generatedAt ? `Updated ${new Date(rankingData.generatedAt).toLocaleString()}` : 'No data'}
            {' · '}
            <span className="text-yellow-400">Advisory only</span> — configs not auto-modified
          </p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-lg border border-border hover:border-primary/50 transition-colors" title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard title="Models Scored" value={summary.totalModelsScored || 0} icon={<BarChart3 className="h-4 w-4" />} />
        <StatsCard title="NVIDIA Live" value={summary.nvidiaLive || summary.liveModels || 0} icon={<Zap className="h-4 w-4 text-green-400" />} />
        <StatsCard title="NVIDIA Slow" value={summary.nvidiaSlow || 0} icon={<Activity className="h-4 w-4 text-yellow-400" />} />
        <StatsCard title="Recommendations" value={summary.recommendationsCount || 0} icon={<TrendingUp className="h-4 w-4 text-cyan-400" />} />
        <StatsCard title="Arena Sources OK" value={summary.arenaSourcesOk || 0} icon={<Globe className="h-4 w-4 text-indigo-400" />} />
        <StatsCard title="News Items" value={summary.newsItems || 0} icon={<Shield className="h-4 w-4 text-purple-400" />} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs defaultValue="rankings">
          <TabsList>
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="nvidia">NVIDIA Health</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
          </TabsList>

          <TabsContent value="rankings">
            <GlassCard className="p-0 overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-surface z-10">
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Rank</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Model</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Arena</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Health</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Latency</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map((s, i) => (
                      <tr key={s.nvidiaId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-bold">{s.compositeRank || '-'}</td>
                        <td className="px-4 py-3 font-mono text-sm text-indigo-400">{s.nvidiaId}</td>
                        <td className="px-4 py-3">{s.avgArenaScore || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${healthBg(s.healthStatus)}`}>
                            {s.healthStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{s.latencyMs ? `${s.latencyMs}ms` : '-'}</td>
                        <td className="px-4 py-3">
                          <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                              style={{ width: `${s.avgArenaScore ? (s.avgArenaScore / maxArenaScore * 100) : 0}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="recommendations">
            <GlassCard className="p-0 overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-surface z-10">
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Action</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Model</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Cur Prio</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Prop Prio</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Delta</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendations.map((r, i) => (
                      <tr key={`${r.model}-${i}`} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${actionBg(r.action)}`}>
                            {r.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-indigo-400">{r.model}</td>
                        <td className="px-4 py-3">{r.currentPriority ?? '-'}</td>
                        <td className="px-4 py-3">{r.proposedPriority ?? '-'}</td>
                        <td className={`px-4 py-3 font-semibold ${typeof r.delta === 'number' && r.delta < 0 ? 'text-green-400' : typeof r.delta === 'number' && r.delta > 0 ? 'text-red-400' : ''}`}>
                          {r.delta === 'new' ? '+new' : typeof r.delta === 'number' ? (r.delta > 0 ? '+' : '') + r.delta : r.delta}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{r.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="nvidia">
            <GlassCard className="p-0 overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-surface z-10">
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Model</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">HTTP</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Latency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nvidiaHealth.map((h) => (
                      <tr key={h.model} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-sm text-indigo-400">{h.model}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${healthBg(h.status)}`}>
                            {h.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">{h.httpStatus || '-'}</td>
                        <td className="px-4 py-3 text-sm">{h.latencyMs ? `${h.latencyMs}ms` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="news">
            <GlassCard className="divide-y divide-border">
              {newsDigest.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No relevant news items found</div>
              ) : (
                newsDigest.map((n, i) => (
                  <div key={i} className="p-4 hover:bg-muted/20 transition-colors">
                    <a href={n.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-400 hover:underline">
                      {n.title || 'Untitled'}
                    </a>
                    <div className="text-xs text-muted-foreground mt-1">
                      {n.source} · {n.sentiment} · {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : '?'}
                    </div>
                    {n.relevantNvidiaModels?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {n.relevantNvidiaModels.map(m => (
                          <span key={m} className="px-1.5 py-0.5 rounded text-xs font-mono bg-indigo-500/10 text-indigo-400">{m}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </GlassCard>
          </TabsContent>
        </Tabs>
      </motion.div>

      <motion.div variants={itemVariants} className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
        TNF LLM Intelligence Pipeline · Data: <code>data/llm-intel/</code> · Cron: every 4h · Advisory only
      </motion.div>
    </motion.div>
  );
}
