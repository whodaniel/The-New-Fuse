import { AlertCircle, Clock, LogOut, Menu, Trophy, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';

interface TournamentTableViewProps {
  onLeave: () => void;
  children: React.ReactNode; // The actual poker table goes here
}

export default function TournamentTableView({ onLeave, children }: TournamentTableViewProps) {
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);

  return (
    <div className="fixed inset-0 bg-[#020308] font-sans overflow-hidden flex flex-col">
      {/* Top Bar */}
      <header className="h-16 bg-[#0a0c1a]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 sm:px-6 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowLeft(!showLeft)}
            className="p-2 text-slate-400 hover:text-white lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm sm:text-base font-black italic uppercase text-white tracking-tighter">
                NEURAL SPRINT #42
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-cyan-900/30 text-cyan-400 border border-cyan-500/50 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> Level 5
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 sm:gap-12">
          <div className="text-center hidden sm:block">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">
              Current Blinds
            </p>
            <p className="text-sm font-mono text-white">
              100/200 <span className="text-slate-500">(25)</span>
            </p>
          </div>

          <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg
                className="w-full h-full transform -rotate-90 absolute inset-0"
                viewBox="0 0 36 36"
              >
                <path
                  className="text-slate-800"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-cyan-400"
                  strokeDasharray="65, 100"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-xl font-mono text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]">
                04:32
              </p>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                Next: 150/300
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowRight(!showRight)}
            className="p-2 text-slate-400 hover:text-white lg:hidden"
          >
            <Users className="w-5 h-5" />
          </button>
          <button
            onClick={onLeave}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-lg text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800"
          >
            <LogOut className="w-4 h-4" /> Lobby
          </button>
        </div>
      </header>

      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Sidebar - Tourney Info */}
        <AnimatePresence>
          {showLeft && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="absolute lg:relative left-0 top-0 bottom-0 w-64 bg-[#0a0c1a]/95 backdrop-blur-xl border-r border-white/5 z-40 flex flex-col"
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xs font-black italic uppercase text-white tracking-widest">
                  Tournament Info
                </h3>
                <button onClick={() => setShowLeft(false)} className="lg:hidden text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    Players Remaining
                  </p>
                  <p className="text-2xl font-mono text-white">
                    12 <span className="text-sm text-slate-500">/ 50</span>
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    Average Stack
                  </p>
                  <p className="text-lg font-mono text-slate-300">$8,333</p>
                </div>

                <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-1">
                    Your Stack
                  </p>
                  <p className="text-2xl font-mono text-green-400 font-bold drop-shadow-[0_0_8px_rgba(74,222,128,0.3)]">
                    $15,200
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
                    Position: 8th of 12
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    Prize Pool
                  </p>
                  <p className="text-xl font-mono text-[#10b981] font-bold">$5,000</p>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    Next Payout
                  </p>
                  <p className="text-sm font-mono text-white">9th place — $250</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center - Poker Table */}
        <div className="flex-1 relative bg-[radial-gradient(circle_at_center,_#0a0c1a_0%,_#020308_100%)]">
          {children}
        </div>

        {/* Right Sidebar - Rankings */}
        <AnimatePresence>
          {showRight && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="absolute lg:relative right-0 top-0 bottom-0 w-72 bg-[#0a0c1a]/95 backdrop-blur-xl border-l border-white/5 z-40 flex flex-col"
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xs font-black italic uppercase text-white tracking-widest">
                  Player Rankings
                </h3>
                <button onClick={() => setShowRight(false)} className="lg:hidden text-slate-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-black/40 sticky top-0">
                    <tr>
                      <th className="py-2 px-4 text-[9px] font-black uppercase tracking-widest text-slate-500">
                        #
                      </th>
                      <th className="py-2 px-4 text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Player
                      </th>
                      <th className="py-2 px-4 text-[9px] font-black uppercase tracking-widest text-slate-500 text-right">
                        Stack
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs">
                    {[
                      { rank: 1, name: 'CYBER-9', stack: 45000, active: true },
                      { rank: 2, name: 'GHOST', stack: 32100, active: true },
                      { rank: 3, name: 'VOID_WALKER', stack: 28400, active: true },
                      { rank: 4, name: 'SYNTH_01', stack: 22000, active: false },
                      { rank: 5, name: 'NEON_GOD', stack: 19500, active: true },
                      { rank: 6, name: 'DATA_MINER', stack: 18200, active: true },
                      { rank: 7, name: 'ZERO_COOL', stack: 16000, active: true },
                      { rank: 8, name: 'Neural_Knight', stack: 15200, active: true, isMe: true },
                      { rank: 9, name: 'ACID_BURN', stack: 12000, active: true },
                      { rank: 10, name: 'CRASH_OVER', stack: 8500, active: true },
                      { rank: 11, name: 'LORD_NIKON', stack: 4200, active: true },
                      { rank: 12, name: 'PHANTOM', stack: 1100, active: true },
                    ].map((p) => (
                      <tr
                        key={p.rank}
                        className={`border-b border-white/5 ${p.isMe ? 'bg-cyan-900/20' : 'hover:bg-white/5'}`}
                      >
                        <td
                          className={`py-3 px-4 ${p.rank <= 3 ? 'text-yellow-500 font-bold' : 'text-slate-500'}`}
                        >
                          {p.rank}
                        </td>
                        <td
                          className={`py-3 px-4 ${p.isMe ? 'text-cyan-400 font-bold' : p.active ? 'text-white' : 'text-slate-500 italic'}`}
                        >
                          {p.name}
                        </td>
                        <td
                          className={`py-3 px-4 text-right ${p.isMe ? 'text-cyan-400' : 'text-slate-300'}`}
                        >
                          {p.stack.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Bar */}
      <div className="h-12 bg-[#0a0c1a] border-t border-white/5 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500">
          <AlertCircle className="w-4 h-4" /> Break in: 2 levels
        </div>
        <div className="flex gap-4">
          <button
            disabled
            className="px-4 py-1.5 bg-slate-900 rounded text-[10px] font-black uppercase tracking-widest text-slate-600 border border-slate-800 cursor-not-allowed"
          >
            Rebuy (Closed)
          </button>
          <button
            disabled
            className="px-4 py-1.5 bg-slate-900 rounded text-[10px] font-black uppercase tracking-widest text-slate-600 border border-slate-800 cursor-not-allowed"
          >
            Add-on (Closed)
          </button>
        </div>
      </div>
    </div>
  );
}
