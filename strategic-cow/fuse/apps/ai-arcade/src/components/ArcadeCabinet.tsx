import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
// import { ethers } from 'ethers'; // Removed direct ethers dep for now to avoid build issues if not present

// Types
interface AuctionProps {
  id: number;
  agentName: string; // e.g., "Neon Quest Architect"
  agentRole: 'CODER' | 'STRATEGIST' | 'GAME';
  currentPrice: number; // e.g., 45.20
  nextDrop: number; // e.g., 0.20
  bidFee: number; // e.g., 1.00
  endTime: Date;
  onBid: () => void; // Function to trigger smart contract
  onBuy: () => void;
}

const ArcadeCabinet: React.FC<AuctionProps> = ({
  id,
  agentName,
  agentRole,
  currentPrice,
  nextDrop,
  bidFee,
  endTime,
  onBid,
  onBuy,
}) => {
  const [isGlitching, setIsGlitching] = useState(false);
  const [pipeActive, setPipeActive] = useState(false);

  // FX: Glitch effect when price drops
  useEffect(() => {
    setIsGlitching(true);
    const timer = setTimeout(() => setIsGlitching(false), 300);
    return () => clearTimeout(timer);
  }, [currentPrice]);

  const handleInsertCoin = () => {
    // 1. Trigger Visuals
    setPipeActive(true);
    setTimeout(() => setPipeActive(false), 1000); // Reset pipe after 1s

    // 2. Trigger Blockchain Logic
    onBid();
  };

  return (
    <div className="relative w-full max-w-md mx-auto p-1 rounded-xl bg-gradient-to-b from-gray-800 to-black shadow-[0_0_40px_rgba(0,255,255,0.2)] border border-cyan-900/50">
      {/* --- CABINET HEADER (Marquee) --- */}
      <div className="flex justify-between items-center px-4 py-2 bg-black/80 rounded-t-lg border-b border-cyan-500/30">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${Date.now() < endTime.getTime() ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
          />
          <span className="text-cyan-400 font-mono text-xs tracking-widest uppercase">
            Live Auction #{id}
          </span>
        </div>
        <div className="text-pink-500 font-bold text-xs font-mono border border-pink-500/50 px-2 py-0.5 rounded">
          {agentRole}
        </div>
      </div>

      {/* --- THE CRT SCREEN (Main Display) --- */}
      <div className="relative h-64 bg-gray-900 m-2 rounded-lg overflow-hidden border-4 border-gray-800 shadow-inner">
        {/* Scanline Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_2px,3px_100%] opacity-20" />

        {/* Agent Hologram (Placeholder) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <span className="text-9xl text-cyan-900 font-black tracking-tighter">AI</span>
        </div>

        {/* The Price Ticker */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full">
          <h3 className="text-cyan-500 font-mono text-sm tracking-widest mb-2">CURRENT PRICE</h3>

          <AnimatePresence>
            <motion.div
              key={currentPrice}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-6xl font-black tracking-tight text-white drop-shadow-[0_0_10px_rgba(0,255,255,0.8)] ${isGlitching ? 'skew-x-12 text-pink-500' : ''}`}
            >
              ${currentPrice.toFixed(2)}
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 flex gap-4 text-xs font-mono text-gray-400">
            <span>DROP: -${nextDrop.toFixed(2)}</span>
            <span className="text-yellow-500">FEES → MERKABA</span>
          </div>
        </div>
      </div>

      {/* --- HYDRAULIC PIPE VISUALIZER --- */}
      <div className="h-4 mx-8 bg-gray-900 rounded-full border border-gray-700 relative overflow-hidden">
        {/* The "Fluid" */}
        <motion.div
          initial={{ x: '-100%' }}
          animate={pipeActive ? { x: '100%' } : { x: '-100%' }}
          transition={{ duration: 0.8, ease: 'linear' }}
          className="absolute inset-0 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70 blur-sm"
        />
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-500 font-mono tracking-widest">
          TREASURY INJECTION SYSTEM
        </div>
      </div>

      {/* --- CONTROL PANEL --- */}
      <div className="p-4 grid grid-cols-2 gap-4">
        {/* INSERT COIN BUTTON */}
        <button
          onClick={handleInsertCoin}
          className="group relative h-14 bg-gray-800 rounded border-b-4 border-gray-950 active:border-b-0 active:translate-y-1 transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="relative flex flex-col items-center justify-center h-full">
            <span className="text-pink-400 font-black text-lg tracking-wider group-hover:text-white">
              BID
            </span>
            <span className="text-[10px] text-pink-300/70 font-mono">
              COST: ${bidFee.toFixed(2)}
            </span>
          </div>
        </button>

        {/* BUY NOW BUTTON */}
        <button
          onClick={onBuy}
          className="group relative h-14 bg-gray-800 rounded border-b-4 border-gray-950 active:border-b-0 active:translate-y-1 transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="relative flex flex-col items-center justify-center h-full">
            <span className="text-cyan-400 font-black text-lg tracking-wider group-hover:text-white">
              BUY
            </span>
            <span className="text-[10px] text-cyan-300/70 font-mono">WIN NOW</span>
          </div>
        </button>
      </div>

      {/* --- FOOTER INFO --- */}
      <div className="px-4 pb-3 flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 font-mono uppercase">Agent ID</span>
          <span className="text-xs text-gray-300 font-bold">{agentName}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-gray-500 font-mono uppercase">Merkaba Link</span>
          <span className={`text-xs font-bold ${pipeActive ? 'text-yellow-400' : 'text-gray-600'}`}>
            {pipeActive ? 'RECEIVING ENERGY...' : 'STANDBY'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ArcadeCabinet;
