import { GlassCard, PremiumButton, PremiumSelect, StatsCard } from '@/components/ui/premium';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/useToast';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Bot,
  Clock,
  DollarSign,
  Download,
  Layers,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface AnalyticsData {
  overview: {
    totalAgents: number;
    activeAgents: number;
    totalInteractions: number;
    successRate: number;
    averageResponseTime: number;
    totalWorkflows: number;
  };
  performance: {
    timeRange: string;
    dataPoints: Array<{
      timestamp: string;
      requests: number;
      responses: number;
      errors: number;
      avgResponseTime: number;
    }>;
  };
  agentMetrics: Array<{
    agentId: string;
    agentName: string;
    totalTasks: number;
    successRate: number;
    avgResponseTime: number;
    lastActive: string;
  }>;
  qualityTrends: Array<{
    date: string;
    qualityScore: number;
    userSatisfaction: number;
    errorRate: number;
  }>;
  providerPerformance: Array<{
    provider: string;
    totalRequests: number;
    successRate: number;
    avgLatency: number;
    costPerRequest: number;
  }>;
  costAnalysis: {
    totalCost: number;
    costByProvider: Array<{
      provider: string;
      cost: number;
      percentage: number;
    }>;
    dailyCosts: Array<{
      date: string;
      cost: number;
    }>;
  };
}

const COLORS = ['#8B5CF6', '#06B6D4', '#F59E0B', '#EF4444', '#10B981', '#EC4899'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const coerceArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
const coerceObject = (value: unknown): Record<string, any> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {};

const unwrapApiData = (payload: unknown): Record<string, any> => {
  const obj = coerceObject(payload);
  if (obj.data && typeof obj.data === 'object') return coerceObject(obj.data);
  return obj;
};

// Custom dark-themed tooltip for charts
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/90 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-xl">
        <p className="text-gray-300 text-sm font-medium mb-2">{label}</p>
        {payload.map((entry: { name: string; value: number; color: string }, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}:{' '}
            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Analytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const responses = await Promise.allSettled([
        axios.get(`/api/analytics/default/overview?timeframe=${timeRange}`),
        axios.get(`/api/analytics/default/performance?timeframe=${timeRange}`),
        axios.get(`/api/analytics/default/providers/performance?timeframe=${timeRange}`),
        axios.get(`/api/analytics/default/quality-trends?timeframe=${timeRange}`),
      ]);

      const failed = responses.find((response) => response.status === 'rejected');
      if (failed) {
        const statusCode =
          failed.status === 'rejected' ? Number((failed.reason as any)?.response?.status ?? 0) : 0;
        if (statusCode === 501) {
          setErrorMessage(
            'Analytics features are not deployed on this backend yet. Enable agency analytics services to activate this dashboard.'
          );
          setData(null);
          return;
        }
        throw new Error(
          `Analytics endpoint request failed${statusCode > 0 ? ` (${statusCode})` : ''}`
        );
      }

      const fulfilled = responses as Array<PromiseFulfilledResult<any>>;
      const [overviewPayload, performancePayload, providersPayload, qualityPayload] = fulfilled.map(
        (response) => response.value?.data ?? {}
      );

      const overviewData = unwrapApiData(overviewPayload);
      const performanceDataRaw = unwrapApiData(performancePayload);
      const providersDataRaw = unwrapApiData(providersPayload);
      const qualityDataRaw = unwrapApiData(qualityPayload);

      const providerPerformance = coerceArray<AnalyticsData['providerPerformance'][number]>(
        providersDataRaw.providerPerformance ?? providersDataRaw.providers ?? providersDataRaw.items
      ).map((provider) => ({
        provider: provider.provider ?? provider.name ?? 'Unknown',
        totalRequests: Number(provider.totalRequests ?? provider.requests ?? 0),
        successRate: Number(provider.successRate ?? 0),
        avgLatency: Number(provider.avgLatency ?? provider.latency ?? 0),
        costPerRequest: Number(provider.costPerRequest ?? provider.cost ?? 0),
      }));

      const totalProviderCost = providerPerformance.reduce(
        (sum, p) => sum + p.totalRequests * p.costPerRequest,
        0
      );

      const normalizedData: AnalyticsData = {
        overview: {
          totalAgents: Number(overviewData.totalAgents ?? 0),
          activeAgents: Number(overviewData.activeAgents ?? 0),
          totalInteractions: Number(
            overviewData.totalInteractions ?? overviewData.totalRequests ?? 0
          ),
          successRate: Number(overviewData.successRate ?? 0),
          averageResponseTime: Number(
            overviewData.averageResponseTime ?? overviewData.avgResponseTime ?? 0
          ),
          totalWorkflows: Number(overviewData.totalWorkflows ?? 0),
        },
        performance: {
          timeRange,
          dataPoints: coerceArray<AnalyticsData['performance']['dataPoints'][number]>(
            performanceDataRaw.dataPoints ??
              performanceDataRaw.performance ??
              performanceDataRaw.items
          ).map((point) => ({
            timestamp: String(point.timestamp ?? point.date ?? point.label ?? ''),
            requests: Number(point.requests ?? 0),
            responses: Number(point.responses ?? 0),
            errors: Number(point.errors ?? 0),
            avgResponseTime: Number(point.avgResponseTime ?? point.latency ?? 0),
          })),
        },
        agentMetrics: coerceArray<AnalyticsData['agentMetrics'][number]>(
          overviewData.agentMetrics ?? performanceDataRaw.agentMetrics ?? []
        ).map((agent) => ({
          agentId: String(agent.agentId ?? agent.id ?? ''),
          agentName: String(agent.agentName ?? agent.name ?? 'Unknown Agent'),
          totalTasks: Number(agent.totalTasks ?? agent.tasks ?? 0),
          successRate: Number(agent.successRate ?? 0),
          avgResponseTime: Number(agent.avgResponseTime ?? 0),
          lastActive: String(agent.lastActive ?? 'N/A'),
        })),
        qualityTrends: coerceArray<AnalyticsData['qualityTrends'][number]>(
          qualityDataRaw.qualityTrends ?? qualityDataRaw.items ?? qualityDataRaw
        ).map((trend) => ({
          date: String(trend.date ?? trend.timestamp ?? ''),
          qualityScore: Number(trend.qualityScore ?? 0),
          userSatisfaction: Number(trend.userSatisfaction ?? 0),
          errorRate: Number(trend.errorRate ?? trend.errors ?? 0),
        })),
        providerPerformance,
        costAnalysis: {
          totalCost: Number(
            overviewData.costAnalysis?.totalCost ??
              providersDataRaw.costAnalysis?.totalCost ??
              totalProviderCost
          ),
          costByProvider: coerceArray<AnalyticsData['costAnalysis']['costByProvider'][number]>(
            overviewData.costAnalysis?.costByProvider ??
              providersDataRaw.costAnalysis?.costByProvider
          ).map((provider) => ({
            provider: provider.provider ?? provider.name ?? 'Unknown',
            cost: Number(provider.cost ?? 0),
            percentage: Number(provider.percentage ?? 0),
          })),
          dailyCosts: coerceArray<AnalyticsData['costAnalysis']['dailyCosts'][number]>(
            overviewData.costAnalysis?.dailyCosts ?? providersDataRaw.costAnalysis?.dailyCosts
          ).map((daily) => ({
            date: String(daily.date ?? daily.timestamp ?? ''),
            cost: Number(daily.cost ?? 0),
          })),
        },
      };

      setData(normalizedData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load analytics data');
      setData(null);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(
        `/api/analytics/default/export?timeframe=${timeRange}&format=json`,
        {
          responseType: 'blob',
        }
      );
      const blob = response.data as Blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${timeRange}-${new Date().toISOString()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Analytics data exported successfully',
      });
    } catch (error) {
      const statusCode = Number((error as any)?.response?.status ?? 0);
      if (statusCode === 501) {
        toast({
          title: 'Unavailable',
          description: 'Analytics export is not deployed on this backend.',
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: 'Error',
        description: 'Failed to export analytics data',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-12 h-12 text-purple-500" />
        </motion.div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <GlassCard className="max-w-md">
          <div className="p-8 text-center">
            <Zap className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-300 font-medium">Unable to load analytics</p>
            <p className="text-gray-500 text-sm mt-2">{errorMessage}</p>
            <PremiumButton onClick={handleRefresh} className="mt-4" icon={RefreshCw}>
              Retry
            </PremiumButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Ensure data structure exists before rendering
  if (
    !data ||
    !data.overview ||
    !data.agentMetrics ||
    !data.costAnalysis ||
    !data.costAnalysis.costByProvider
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <GlassCard className="max-w-md">
          <div className="p-8 text-center">
            <Zap className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-400">Failed to load analytics data</p>
            <PremiumButton onClick={handleRefresh} className="mt-4" icon={RefreshCw}>
              Retry
            </PremiumButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Safe access to arrays
  const agentMetrics = Array.isArray(data.agentMetrics) ? data.agentMetrics : [];
  const costByProvider = Array.isArray(data.costAnalysis?.costByProvider)
    ? data.costAnalysis.costByProvider
    : [];
  const performanceData = Array.isArray(data.performance?.dataPoints)
    ? data.performance.dataPoints
    : [];
  const qualityTrends = Array.isArray(data.qualityTrends) ? data.qualityTrends : [];
  const dailyCosts = Array.isArray(data.costAnalysis?.dailyCosts)
    ? data.costAnalysis.dailyCosts
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[50%] left-[30%] w-[30%] h-[30%] bg-cyan-600/10 rounded-full blur-[100px] animate-pulse" />
      </div>

      <div className="relative z-10 p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4"
        >
          <div>
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 flex items-center gap-3">
              <BarChart3 className="w-10 h-10 text-purple-400" />
              Analytics & Performance
            </h2>
            <p className="text-gray-400 text-lg mt-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Monitor your system performance and usage metrics
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <PremiumSelect
              value={timeRange}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTimeRange(e.target.value)}
              className="w-[180px]"
              options={[
                { value: '24h', label: 'Last 24 hours' },
                { value: '7d', label: 'Last 7 days' },
                { value: '30d', label: 'Last 30 days' },
                { value: '90d', label: 'Last 90 days' },
              ]}
            />
            <PremiumButton
              variant="glass"
              onClick={handleRefresh}
              disabled={refreshing}
              icon={RefreshCw}
              className={refreshing ? 'animate-spin' : ''}
            >
              Refresh
            </PremiumButton>
            <PremiumButton onClick={handleExport} icon={Download}>
              Export
            </PremiumButton>
          </div>
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <TabsList className="bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-xl">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg px-4 py-2 text-gray-400 transition-all"
              >
                <Activity className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="performance"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg px-4 py-2 text-gray-400 transition-all"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Performance
              </TabsTrigger>
              <TabsTrigger
                value="agents"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg px-4 py-2 text-gray-400 transition-all"
              >
                <Bot className="w-4 h-4 mr-2" />
                Agents
              </TabsTrigger>
              <TabsTrigger
                value="quality"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg px-4 py-2 text-gray-400 transition-all"
              >
                <Target className="w-4 h-4 mr-2" />
                Quality
              </TabsTrigger>
              <TabsTrigger
                value="costs"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg px-4 py-2 text-gray-400 transition-all"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Costs
              </TabsTrigger>
            </TabsList>
          </motion.div>

          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                <motion.div variants={itemVariants}>
                  <StatsCard
                    label="Total Agents"
                    value={data.overview.totalAgents}
                    change={`${data.overview.activeAgents} active`}
                    changeType="positive"
                    icon={Bot}
                    gradient="blue"
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <StatsCard
                    label="Total Interactions"
                    value={data.overview.totalInteractions.toLocaleString()}
                    change={`${data.overview.averageResponseTime}ms avg response`}
                    changeType="neutral"
                    icon={Activity}
                    gradient="purple"
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <StatsCard
                    label="Success Rate"
                    value={`${data.overview.successRate}%`}
                    change="Across all agents"
                    changeType="positive"
                    icon={Target}
                    gradient="green"
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <StatsCard
                    label="Total Workflows"
                    value={data.overview.totalWorkflows}
                    change="Executed successfully"
                    changeType="positive"
                    icon={Layers}
                    gradient="orange"
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <StatsCard
                    label="Avg Response Time"
                    value={`${data.overview.averageResponseTime}ms`}
                    change="Fleet performance"
                    changeType="positive"
                    icon={Clock}
                    gradient="cyan"
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <StatsCard
                    label="Active Rate"
                    value={`${Math.round((data.overview.activeAgents / data.overview.totalAgents) * 100)}%`}
                    change="Agent utilization"
                    changeType="positive"
                    icon={Zap}
                    gradient="pink"
                  />
                </motion.div>
              </motion.div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <GlassCard
                  icon={TrendingUp}
                  title="Performance Metrics"
                  subtitle="Request and response trends over time"
                  gradient="purple"
                >
                  <div className="h-[400px] mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={performanceData}>
                        <defs>
                          <linearGradient id="requestsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="responsesGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: '#94a3b8' }} iconType="circle" />
                        <Line
                          type="monotone"
                          dataKey="requests"
                          stroke="#8B5CF6"
                          strokeWidth={2}
                          dot={{ fill: '#8B5CF6', r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Requests"
                        />
                        <Line
                          type="monotone"
                          dataKey="responses"
                          stroke="#06B6D4"
                          strokeWidth={2}
                          dot={{ fill: '#06B6D4', r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Responses"
                        />
                        <Line
                          type="monotone"
                          dataKey="errors"
                          stroke="#EF4444"
                          strokeWidth={2}
                          dot={{ fill: '#EF4444', r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Errors"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              </motion.div>
            </TabsContent>

            {/* Agents Tab */}
            <TabsContent value="agents" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <GlassCard
                  icon={Bot}
                  title="Agent Performance"
                  subtitle="Individual agent metrics and activity"
                  gradient="blue"
                >
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Agent Name
                          </th>
                          <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Total Tasks
                          </th>
                          <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Success Rate
                          </th>
                          <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Avg Response
                          </th>
                          <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Last Active
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {agentMetrics.map(
                          (
                            agent: {
                              agentId: string;
                              agentName: string;
                              totalTasks: number;
                              successRate: number;
                              avgResponseTime: number;
                              lastActive: string;
                            },
                            index: number
                          ) => (
                            <motion.tr
                              key={agent.agentId}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="hover:bg-white/5 transition-colors"
                            >
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/10">
                                    <Bot className="w-5 h-5 text-purple-400" />
                                  </div>
                                  <span className="text-white font-medium">{agent.agentName}</span>
                                </div>
                              </td>
                              <td className="p-4 text-gray-300">
                                {agent.totalTasks.toLocaleString()}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-white/10 rounded-full h-2">
                                    <div
                                      className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full"
                                      style={{ width: `${agent.successRate}%` }}
                                    />
                                  </div>
                                  <span className="text-emerald-400 font-medium">
                                    {agent.successRate}%
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 text-gray-300">{agent.avgResponseTime}ms</td>
                              <td className="p-4 text-gray-400 flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {agent.lastActive}
                              </td>
                            </motion.tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </motion.div>
            </TabsContent>

            {/* Quality Tab */}
            <TabsContent value="quality" className="space-y-6">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-6 md:grid-cols-2"
              >
                <motion.div variants={itemVariants}>
                  <GlassCard
                    icon={Target}
                    title="Quality Trends"
                    subtitle="Quality score and user satisfaction over time"
                    gradient="green"
                  >
                    <div className="h-[300px] mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={qualityTrends}>
                          <defs>
                            <linearGradient id="qualityGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="satisfactionGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                          <YAxis stroke="#94a3b8" fontSize={12} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ color: '#94a3b8' }} iconType="circle" />
                          <Area
                            type="monotone"
                            dataKey="qualityScore"
                            stroke="#10B981"
                            fillOpacity={1}
                            fill="url(#qualityGradient)"
                            name="Quality Score"
                          />
                          <Area
                            type="monotone"
                            dataKey="userSatisfaction"
                            stroke="#06B6D4"
                            fillOpacity={1}
                            fill="url(#satisfactionGradient)"
                            name="User Satisfaction"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <GlassCard
                    icon={Zap}
                    title="Error Rate"
                    subtitle="Error occurrences over time"
                    gradient="orange"
                  >
                    <div className="h-[300px] mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={qualityTrends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                          <YAxis stroke="#94a3b8" fontSize={12} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ color: '#94a3b8' }} iconType="circle" />
                          <Line
                            type="monotone"
                            dataKey="errorRate"
                            stroke="#EF4444"
                            strokeWidth={2}
                            dot={{ fill: '#EF4444', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Error Rate (%)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>
                </motion.div>
              </motion.div>
            </TabsContent>

            {/* Costs Tab */}
            <TabsContent value="costs" className="space-y-6">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-6 md:grid-cols-2"
              >
                <motion.div variants={itemVariants}>
                  <GlassCard
                    icon={DollarSign}
                    title="Cost by Provider"
                    subtitle="Distribution of costs across providers"
                    gradient="purple"
                  >
                    <div className="h-[300px] mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={costByProvider}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ provider, percentage }) =>
                              `${provider}: ${percentage.toFixed(1)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="cost"
                          >
                            {costByProvider.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ color: '#94a3b8' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <GlassCard
                    icon={TrendingUp}
                    title="Daily Costs"
                    subtitle="Cost trends over the selected period"
                    gradient="cyan"
                  >
                    <div className="h-[300px] mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailyCosts}>
                          <defs>
                            <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                          <YAxis stroke="#94a3b8" fontSize={12} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ color: '#94a3b8' }} iconType="circle" />
                          <Area
                            type="monotone"
                            dataKey="cost"
                            stroke="#8B5CF6"
                            fillOpacity={1}
                            fill="url(#costGradient)"
                            name="Daily Cost ($)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>
                </motion.div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <GlassCard gradient="purple">
                  <div className="flex items-center justify-between p-2">
                    <div>
                      <p className="text-gray-400 text-sm">Total Cost for Selected Period</p>
                      <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mt-1">
                        ${data.costAnalysis.totalCost.toLocaleString()}
                      </div>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/20">
                      <DollarSign className="w-8 h-8 text-green-400" />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;
