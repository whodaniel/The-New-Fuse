import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

// Types
interface MerkabaProps {
  sunBalance: number; // Active Prize Pool (e.g. 50000)
  earthBalance: number; // Treasury Yield (e.g. 50000)
  rebalanceActive: boolean; // Is the Gyroscope moving funds right now?
}

const MerkabaMonitor: React.FC<MerkabaProps> = ({ sunBalance, earthBalance, rebalanceActive }) => {
  // Calculate the Ratio (0 to 100 scale for the needle)
  // 50 is perfect balance (1:1).
  const total = sunBalance + earthBalance;
  const sunRatio = total === 0 ? 50 : (sunBalance / total) * 100;

  // Determine System State Color
  const getSystemColor = () => {
    if (sunRatio > 60) return 'text-orange-500 shadow-orange-500/50'; // Too Hot
    if (sunRatio < 40) return 'text-cyan-500 shadow-cyan-500/50'; // Too Cold
    return 'text-purple-500 shadow-purple-500/50'; // Balanced
  };

  return (
    <div className="w-full bg-black border-y border-gray-800 relative overflow-hidden h-24 flex items-center justify-center">
      {/* --- BACKGROUND GRID --- */}
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(0,255,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />

      <div className="relative z-10 flex w-full max-w-6xl justify-between items-center px-8">
        {/* --- EARTH PYRAMID (The Treasury) --- */}
        <div className="flex flex-col items-start">
          <span className="text-[10px] text-cyan-500 font-mono tracking-widest uppercase mb-1">
            Earth Gravity (Yield)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
              ${earthBalance.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500 font-mono">APY: 5.2%</span>
          </div>
          {/* Earth Bar */}
          <div className="w-32 h-1 bg-gray-800 mt-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${100 - sunRatio}%` }}
              className="h-full bg-cyan-500"
            />
          </div>
        </div>

        {/* --- THE MERKABA GYROSCOPE (Center) --- */}
        <div className="flex flex-col items-center mx-8">
          {/* The Geometry Spinner */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* Outer Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className={`absolute inset-0 rounded-full border-2 border-dashed opacity-50 ${getSystemColor().split(' ')[0].replace('text', 'border')}`}
            />

            {/* Inner Diamond */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 bg-gray-900 border border-white transform rotate-45 flex items-center justify-center shadow-lg"
            >
              <div
                className={`w-2 h-2 rounded-full ${rebalanceActive ? 'bg-white animate-ping' : 'bg-gray-500'}`}
              />
            </motion.div>
          </div>

          {/* Status Text */}
          <span className="mt-2 text-[9px] font-mono text-gray-400 uppercase tracking-widest">
            {rebalanceActive ? 'REBALANCING...' : 'SYSTEM STABLE'}
          </span>
        </div>

        {/* --- SUN PYRAMID (The Prize Pool) --- */}
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-orange-500 font-mono tracking-widest uppercase mb-1">
            Sun Velocity (Jackpot)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-gray-500 font-mono">VELOCITY: 98%</span>
            <span className="text-3xl font-black text-orange-400 drop-shadow-[0_0_10px_rgba(255,165,0,0.5)]">
              ${sunBalance.toLocaleString()}
            </span>
          </div>
          {/* Sun Bar */}
          <div className="w-32 h-1 bg-gray-800 mt-2 rounded-full overflow-hidden flex justify-end">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${sunRatio}%` }}
              className="h-full bg-orange-500"
            />
          </div>
        </div>
      </div>

      {/* --- HYDRAULIC PULSE (When Rebalancing) --- */}
      <AnimatePresence>
        {rebalanceActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/5 z-0 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MerkabaMonitor;
