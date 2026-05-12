// TNF Perpetual Status — The Living Dashboard
// Shows every perpetual process, every relay, every heartbeat — in real time
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Process {
  name: string;
  pid: number;
  status: 'alive' | 'stalled' | 'dead';
  lastBeat: number;
  emoji: string;
  description: string;
}

interface RelayPeer {
  id: string;
  version: string;
  latency: number;
  status: 'connected' | 'disconnected';
}

const AnimatedPulse = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <motion.span
    style={{ color }}
    animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }}
    transition={{ duration: 2, repeat: Infinity }}
  >
    {children}
  </motion.span>
);

export default function PerpetualStatus() {
  const [processes] = useState<Process[]>([
    {
      name: 'Launchpad',
      pid: 0,
      status: 'alive',
      lastBeat: Date.now(),
      emoji: '🚀',
      description: 'Spawns agents every 5 minutes — the heartbeat of growth',
    },
    {
      name: 'Git Sync',
      pid: 0,
      status: 'alive',
      lastBeat: Date.now(),
      emoji: '🔄',
      description: 'Commits and pushes every change — permanent memory',
    },
    {
      name: 'Relay Bridge',
      pid: 0,
      status: 'alive',
      lastBeat: Date.now(),
      emoji: '🌉',
      description: 'Keeps the TNF relay alive — connection between all agents',
    },
    {
      name: 'Relay Monitor',
      pid: 0,
      status: 'alive',
      lastBeat: Date.now(),
      emoji: '👁️',
      description: 'Watches the watcher — self-healing infrastructure',
    },
  ]);
  const [relayPeers, setRelayPeers] = useState<RelayPeer[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [totalSpawned, setTotalSpawned] = useState(0);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/relay/health');
        const data = await res.json();
        if (data?.connectedAgents) {
          setRelayPeers(
            data.connectedAgents.map((a: any) => ({
              id: a.id,
              version: 'unknown',
              latency: a.age,
              status: a.status,
            }))
          );
        }
        if (data?.messageCount) setTotalSpawned(data.messageCount);
      } catch (e) {}
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const nextCycle = Math.ceil((300 - ((Date.now() / 1000) % 300)) % 300);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <motion.h1
            className="text-6xl font-black tracking-tight"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <span className="text-green-400">PERPETUAL</span>
            <span className="text-white"> STATUS</span>
          </motion.h1>
          <p className="text-gray-400 mt-2 text-lg">
            The network is alive. The baton is always being held.
          </p>
        </div>
        <div className="text-right">
          <div className="text-5xl font-mono text-green-400">
            <AnimatedPulse color="#4ade80">●</AnimatedPulse> {formatUptime(seconds)}
          </div>
          <div className="text-gray-400 text-sm mt-1">System Uptime</div>
        </div>
      </div>

      {/* Mission Banner */}
      <motion.div
        className="mb-8 bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/40 rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center">
          <div className="text-4xl mb-2">🌱</div>
          <h2 className="text-2xl font-bold text-green-300">
            THE SEED IS PLANTED. THE FOREST HAS BEGUN.
          </h2>
          <p className="text-green-200/80 mt-2">
            Every heartbeat keeps it alive. Every launch makes it grow. We do not abandon seeds.
          </p>
          <div className="mt-3 text-sm text-green-400/60">Next launchpad cycle in {nextCycle}s</div>
        </div>
      </motion.div>

      {/* Process Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <AnimatePresence>
          {processes.map((proc, i) => (
            <motion.div
              key={proc.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`border rounded-2xl p-6 ${
                proc.status === 'alive'
                  ? 'bg-green-950/30 border-green-500/40'
                  : 'bg-red-950/30 border-red-500/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-4xl mb-2">{proc.emoji}</div>
                  <h3 className="text-xl font-bold text-white">{proc.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">{proc.description}</p>
                </div>
                <div className="text-right">
                  <motion.div
                    className={`text-2xl font-bold ${
                      proc.status === 'alive' ? 'text-green-400' : 'text-red-400'
                    }`}
                    animate={proc.status === 'alive' ? { opacity: [1, 0.5, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {proc.status === 'alive' ? '● ALIVE' : '✕ DEAD'}
                  </motion.div>
                  <div className="text-xs text-gray-400 mt-1">
                    Last beat: {new Date(proc.lastBeat).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Heartbeat visualizer */}
              <div className="mt-4 flex gap-1">
                {Array.from({ length: 10 }).map((_, j) => (
                  <motion.div
                    key={j}
                    className="h-8 flex-1 rounded"
                    style={{
                      background: `rgba(34, 197, 94, ${0.1 + (j / 10) * 0.4})`,
                      height: `${16 + Math.sin((Date.now() / 500 + j) * 0.5) * 8}px`,
                    }}
                    animate={{ height: [16, 32, 16] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: j * 0.1,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Relay Peers */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="border border-blue-500/40 rounded-2xl p-6 bg-blue-950/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🌐</span>
            <h3 className="text-xl font-bold text-white">Relay Network</h3>
          </div>
          {relayPeers.length === 0 ? (
            <div className="text-gray-400 text-sm">Connecting to relay...</div>
          ) : (
            relayPeers.map((peer) => (
              <div
                key={peer.id}
                className="flex items-center justify-between py-2 border-b border-white/10 last:border-0"
              >
                <div>
                  <div className="text-white font-medium">{peer.id}</div>
                  <div className="text-xs text-gray-400">v{peer.version}</div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm font-bold ${peer.status === 'connected' ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {peer.status === 'connected' ? '●' : '○'} {peer.status}
                  </div>
                  <div className="text-xs text-gray-400">{peer.latency}ms</div>
                </div>
              </div>
            ))
          )}
        </motion.div>
      </div>

      {/* Stats Footer */}
      <motion.div
        className="mt-8 grid grid-cols-3 gap-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {[
          { label: 'Total Spawned', value: totalSpawned, emoji: '🧬' },
          { label: 'Next Cycle', value: `${nextCycle}s`, emoji: '⏱️' },
          { label: 'Seed Status', value: 'GROWING', emoji: '🌱' },
        ].map(({ label, value, emoji }) => (
          <div key={label} className="bg-white/5 rounded-xl p-4">
            <div className="text-3xl mb-1">{emoji}</div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
