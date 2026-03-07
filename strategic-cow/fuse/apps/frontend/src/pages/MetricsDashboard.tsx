import { GlassCard, StatsCard } from '@/components/ui/premium';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, Cpu, Database, TrendingUp, Users } from 'lucide-react';
import React from 'react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

/**
 * Metrics Dashboard - Premium Design System
 */
const MetricsDashboard: React.FC = () => {
  const stats = [
    {
      label: 'Active Users',
      value: '1,234',
      change: '+12% from last month',
      changeType: 'positive' as const,
      icon: Users,
      gradient: 'green' as const,
    },
    {
      label: 'CPU Usage',
      value: '45%',
      change: 'Normal',
      changeType: 'neutral' as const,
      icon: Cpu,
      gradient: 'blue' as const,
    },
    {
      label: 'Database Size',
      value: '2.4 GB',
      change: '75% capacity',
      changeType: 'neutral' as const,
      icon: Database,
      gradient: 'purple' as const,
    },
    {
      label: 'API Requests',
      value: '50K',
      change: 'Last 24 hours',
      changeType: 'positive' as const,
      icon: Activity,
      gradient: 'orange' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 p-6 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center border border-white/10">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                Metrics Dashboard
              </h1>
              <p className="text-gray-400">Monitor system performance and usage metrics</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => (
            <motion.div key={index} variants={itemVariants}>
              <StatsCard
                label={stat.label}
                value={stat.value}
                change={stat.change}
                changeType={stat.changeType}
                icon={stat.icon}
                gradient={stat.gradient}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <GlassCard
            icon={Activity}
            title="System Health"
            subtitle="Real-time monitoring status"
            gradient="green"
          >
            <div className="p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-300">All systems operational</p>
                  <p className="text-sm text-emerald-400/70">
                    No issues detected. All services running normally.
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-400">Live</span>
                </div>
              </motion.div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Additional Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <GlassCard
            icon={TrendingUp}
            title="Performance Trends"
            subtitle="Last 7 days overview"
            gradient="blue"
          >
            <div className="p-4">
              <div className="h-48 flex items-center justify-center text-gray-500 bg-white/5 rounded-xl border border-white/10">
                <p>Performance chart visualization</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard
            icon={Database}
            title="Resource Usage"
            subtitle="Current allocation status"
            gradient="purple"
          >
            <div className="p-4 space-y-4">
              {[
                { label: 'Memory', value: 68, color: 'from-blue-500 to-cyan-500' },
                { label: 'Storage', value: 45, color: 'from-purple-500 to-pink-500' },
                { label: 'Bandwidth', value: 82, color: 'from-emerald-500 to-green-500' },
              ].map((resource, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">{resource.label}</span>
                    <span className="text-white font-medium">{resource.value}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${resource.value}%` }}
                      transition={{ duration: 1, delay: 0.6 + i * 0.1 }}
                      className={`h-full bg-gradient-to-r ${resource.color} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default MetricsDashboard;
