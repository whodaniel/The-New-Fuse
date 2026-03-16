import { motion } from 'framer-motion';
import { Settings2, Trophy, X } from 'lucide-react';
import React, { useState } from 'react';

interface SngCreatorModalProps {
  onClose: () => void;
  onCreate: (config: any) => void;
}

export default function SngCreatorModal({ onClose, onCreate }: SngCreatorModalProps) {
  const [name, setName] = useState('NEURAL SPRINT');
  const [format, setFormat] = useState('6-Max');
  const [buyIn, setBuyIn] = useState(100);
  const [stack, setStack] = useState(5000);
  const [blinds, setBlinds] = useState('10min');
  const [sb, setSb] = useState(25);
  const [bb, setBb] = useState(50);
  const [payout, setPayout] = useState('Top 2');
  const [speed, setSpeed] = useState('Regular');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ name, format, buyIn, stack, blinds, sb, bb, payout, speed });
  };

  const players = format === '6-Max' ? 6 : format === '9-Max' ? 9 : 2;
  const fee = Math.ceil(buyIn * 0.1); // 10% rake
  const totalBuyIn = buyIn + fee;
  const prizePool = players * buyIn;
  const duration = speed === 'Turbo' ? 20 : speed === 'Regular' ? 45 : 90;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#020308]/80 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-[#0a0c1a]/95 backdrop-blur-xl border border-cyan-900/50 rounded-[40px] p-8 shadow-[0_0_50px_rgba(0,242,255,0.1)] relative my-8"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-cyan-900/30 rounded-xl flex items-center justify-center border border-cyan-500/30 shadow-[0_0_20px_rgba(0,242,255,0.2)]">
            <Settings2 className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter">
              Create SNG
            </h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
              Sit & Go Tournament
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">
                Tournament Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">
                Format
              </label>
              <select
                value={format}
                onChange={(e) => {
                  const newFormat = e.target.value;
                  setFormat(newFormat);
                  if (newFormat === 'Heads-Up') setPayout('Top 1');
                  else if (newFormat === '6-Max' && payout === 'Top 3') setPayout('Top 2');
                }}
                className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors appearance-none"
              >
                <option>6-Max</option>
                <option>9-Max</option>
                <option>Heads-Up</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">
                Buy-In ($) <span className="text-slate-500 font-normal lowercase">+ 10% fee</span>
              </label>
              <input
                type="number"
                value={buyIn}
                onChange={(e) => setBuyIn(Number(e.target.value))}
                className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">
                Starting Stack
              </label>
              <input
                type="number"
                value={stack}
                onChange={(e) => setStack(Number(e.target.value))}
                className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">
                Blind Levels
              </label>
              <select
                value={blinds}
                onChange={(e) => setBlinds(e.target.value)}
                className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors appearance-none"
              >
                <option>5min</option>
                <option>8min</option>
                <option>10min</option>
                <option>15min</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">
                Starting Blinds (SB / BB)
              </label>
              <div className="flex gap-4">
                <input
                  type="number"
                  value={sb}
                  onChange={(e) => setSb(Number(e.target.value))}
                  className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors"
                />
                <input
                  type="number"
                  value={bb}
                  onChange={(e) => setBb(Number(e.target.value))}
                  className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">
                Payout Structure
              </label>
              <select
                value={payout}
                onChange={(e) => setPayout(e.target.value)}
                className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors appearance-none"
              >
                <option value="Top 1">Winner Takes All (Top 1)</option>
                {players >= 6 && <option value="Top 2">Top 2 (65% / 35%)</option>}
                {players >= 9 && <option value="Top 3">Top 3 (50% / 30% / 20%)</option>}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">
                Speed
              </label>
              <div className="flex gap-2 bg-black/60 p-1 rounded-xl border border-slate-800">
                {['Turbo', 'Regular', 'Deep Stack'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${speed === s ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(0,242,255,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-2xl p-6 mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-black italic uppercase text-white">Tournament Summary</h3>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-mono text-slate-300 flex justify-between">
                <span className="text-slate-500">Total Entry:</span>
                <span className="text-white font-bold">
                  ${totalBuyIn.toLocaleString()}{' '}
                  <span className="text-slate-500 font-normal">
                    (${buyIn.toLocaleString()} + ${fee.toLocaleString()} fee)
                  </span>
                </span>
              </p>
              <p className="text-xs font-mono text-slate-300 flex justify-between">
                <span className="text-slate-500">Prize Pool:</span>
                <span className="text-[#10b981] font-bold">
                  ${prizePool.toLocaleString()} ({players} players × ${buyIn.toLocaleString()})
                </span>
              </p>
              <p className="text-xs font-mono text-slate-300 flex justify-between">
                <span className="text-slate-500">Est. Duration:</span>
                <span>~{duration} minutes</span>
              </p>
              <div className="pt-2 mt-2 border-t border-cyan-500/20">
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-1">
                  Payout Breakdown
                </p>
                <p className="text-xs font-mono text-slate-300">
                  {payout === 'Top 1'
                    ? `1st: $${prizePool.toLocaleString()}`
                    : payout === 'Top 2'
                      ? `1st: $${Math.floor(prizePool * 0.65).toLocaleString()} | 2nd: $${Math.floor(prizePool * 0.35).toLocaleString()}`
                      : `1st: $${Math.floor(prizePool * 0.5).toLocaleString()} | 2nd: $${Math.floor(prizePool * 0.3).toLocaleString()} | 3rd: $${Math.floor(prizePool * 0.2).toLocaleString()}`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-transparent rounded-2xl font-black italic uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] py-4 bg-cyan-600 rounded-2xl font-black italic uppercase tracking-widest text-white border-b-4 border-cyan-800 hover:brightness-125 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_20px_rgba(0,242,255,0.2)]"
            >
              Create Tournament
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
