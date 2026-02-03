import { GlassCard } from '@/components/ui/premium';
import { BoltIcon, CheckCircleIcon, ClockIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

// Mock types for the feed
interface ActivityItem {
  id: string;
  agentName: string;
  agentType: string;
  action: string;
  target: string;
  status: 'success' | 'processing' | 'failed';
  timestamp: Date;
  reputationGain?: number;
}

const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    agentName: 'DevOps-Prime',
    agentType: 'Orchestrator',
    action: 'Deployed service',
    target: 'api-gateway:v2.4.0',
    status: 'success',
    timestamp: new Date(),
    reputationGain: 15,
  },
  {
    id: '2',
    agentName: 'Coder-Unit-7',
    agentType: 'Developer',
    action: 'Refactored module',
    target: 'auth-service/jwt',
    status: 'processing',
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    reputationGain: 0,
  },
  {
    id: '3',
    agentName: 'Security-Sentinel',
    agentType: 'Security',
    action: 'Audited dependencies',
    target: 'frontend/package.json',
    status: 'success',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    reputationGain: 25,
  },
  {
    id: '4',
    agentName: 'Data-Harvester',
    agentType: 'Analyst',
    action: 'Synced vector DB',
    target: 'knowledge-base',
    status: 'success',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    reputationGain: 10,
  },
];

export const AgentActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>(MOCK_ACTIVITIES);

  // Simulate live feed
  useEffect(() => {
    const interval = setInterval(() => {
      const actions = [
        'Optimized query',
        'Generated tests',
        'Reviewed PR',
        'Deployed hotfix',
        'Scanned ports',
      ];
      const targets = ['database', 'frontend', 'backend-core', 'payment-gateway', 'user-service'];
      const agents = ['Alpha-1', 'Beta-2', 'Gamma-3', 'Delta-4', 'Omega-X'];

      const newActivity: ActivityItem = {
        id: Math.random().toString(36).substr(2, 9),
        agentName: agents[Math.floor(Math.random() * agents.length)],
        agentType: 'Autonomous Unit',
        action: actions[Math.floor(Math.random() * actions.length)],
        target: targets[Math.floor(Math.random() * targets.length)],
        status: 'success',
        timestamp: new Date(),
        reputationGain: Math.floor(Math.random() * 20) + 5,
      };

      setActivities((prev) => [newActivity, ...prev].slice(0, 50));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BoltIcon className="w-6 h-6 text-yellow-400" />
          Global Agent Activity Stream
        </h2>
        <div className="flex gap-2 text-xs font-mono text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            LIVE
          </span>
          <span>{activities.length} EVENTS</span>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="p-4 border-white/5 bg-slate-900/60 hover:bg-slate-800/80 transition-colors group">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="mt-1">
                      {activity.agentType === 'Security' ? (
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
                          <CheckCircleIcon className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500">
                          <CpuChipIcon className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-sm">{activity.agentName}</span>
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
                          {activity.agentType}
                        </span>
                      </div>
                      <div className="text-gray-300 text-sm flex items-center gap-2">
                        <span>{activity.action}</span>
                        <span className="text-gray-600">→</span>
                        <span className="font-mono text-xs text-indigo-300 bg-indigo-500/10 px-1 py-0.5 rounded">
                          {activity.target}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="text-xs text-gray-500 font-mono flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      {activity.timestamp.toLocaleTimeString()}
                    </div>
                    {activity.reputationGain && activity.reputationGain > 0 && (
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        +{activity.reputationGain} Rep
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
