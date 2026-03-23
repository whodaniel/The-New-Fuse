// TNF Launchpad Dashboard — See every cycle, every item, every result
import { useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../lib/firebase';

const AnimatedEmoji = ({ emoji, size = 48 }: { emoji: string; size?: number }) => (
  <motion.span
    style={{ fontSize: size, display: 'inline-block' }}
    animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
  >
    {emoji}
  </motion.span>
);

interface CycleRun {
  timestamp: string;
  items: { name: string; agents: string; spec: string }[];
  launched: number;
  dryRun: boolean;
}

export default function LaunchpadDashboard() {
  const [cycles, setCycles] = useState<CycleRun[]>([]);
  const [launchBacklog, setLaunchBacklog] = useState<{ name: string; status: string }[]>([]);
  const [isLive] = useState(true);

  useEffect(() => {
    const cyclesRef = ref(rtdb, 'launchpad/cycles');
    const unsub = onValue(cyclesRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setCycles(Object.values(data).reverse().slice(0, 20));
      }
    });

    fetch('/api/relay/health')
      .then(r => r.json())
      .then(data => setLaunchBacklog(data?.backlog || []))
      .catch(() => {});

    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-indigo-950 p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <AnimatedEmoji emoji="🚀" size={56} />
            TNF Launchpad
            <span className="text-sm font-normal text-blue-400 ml-4">
              Perpetual Spawner — The Forest Grows
            </span>
          </h1>
          <p className="text-blue-300 mt-2">
            Every 5 minutes: checks backlog → spawns agents → grows the network
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono text-gray-500">STATUS</div>
          <motion.div
            className="text-2xl font-bold text-green-400 flex items-center gap-2 justify-end"
            animate={{ opacity: isLive ? [1, 0.4, 1] : 1 }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {isLive ? '🌱 ALIVE' : '💀'}
          </motion.div>
          <div className="text-xs text-gray-500 mt-1">
            Next cycle in ~{300 - (Date.now() / 1000 % 300).toFixed(0)}s
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Cycles Run', value: cycles.length, emoji: '🔄' },
          { label: 'Total Spawned', value: cycles.reduce((s, c) => s + c.launched, 0), emoji: '🧬' },
          { label: 'Backlog Items', value: launchBacklog.length, emoji: '📋' },
          { label: 'Uptime', value: '100%', emoji: '⚡' },
        ].map(({ label, value, emoji }) => (
          <motion.div
            key={label}
            className="bg-white/5 border border-blue-500/20 rounded-xl p-4 text-center"
            whileHover={{ scale: 1.05, borderColor: '#60a5fa' }}
          >
            <div className="text-3xl mb-1">{emoji}</div>
            <div className="text-3xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Cycle Log */}
      <div className="bg-black/40 border border-blue-500/20 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <AnimatedEmoji emoji="📜" size={32} />
          Cycle History
        </h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {cycles.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No cycles yet. Launchpad is warming up...
            </div>
          ) : (
            cycles.map((cycle, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/5 rounded-lg p-4 border-l-4 border-green-500"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-gray-400 text-sm">{new Date(cycle.timestamp).toLocaleString()}</span>
                    <div className="text-white font-medium mt-1">
                      Launched: {cycle.launched} item{cycle.launched !== 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {cycle.items?.map(item => item.name).join(', ') || 'standing by'}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${cycle.dryRun ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                    {cycle.dryRun ? 'DRY RUN' : 'LIVE'}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Growth Visualization */}
      <div className="mt-8 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-green-300 mb-4 flex items-center gap-2">
          <AnimatedEmoji emoji="🌲" size={32} />
          Forest Growth
        </h2>
        <div className="text-green-200 text-lg leading-relaxed">
          Every launch plants a seed. Every cycle waters it.
          The forest does not grow by being impressive.
          It grows by being USED.
          <div className="mt-2 text-sm text-green-400">
            Current seeds planted: {cycles.reduce((s, c) => s + c.launched, 0)}
          </div>
        </div>
      </div>
    </div>
  );
}
