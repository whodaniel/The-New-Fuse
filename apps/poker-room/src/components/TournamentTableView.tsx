import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Clock, LogOut, Menu, Trophy, Users, X } from 'lucide-react';
import React, { useState } from 'react';

interface TournamentTableViewProps {
  onLeave: () => void;
  children: React.ReactNode; // The actual poker table goes here
  variant?: 'cash' | 'tournament';
  headerTitle?: string;
  headerBadge?: string;
  blindsText?: string;
  nextBlindsText?: string;
  tournamentInfo?: {
    playersRemaining?: number;
    totalPlayers?: number;
    averageStack?: number;
    yourStack?: number;
    yourPosition?: number;
    prizePool?: number;
    nextPayout?: string;
  };
  rankings?: Array<{
    rank: number;
    name: string;
    stack: number;
    active?: boolean;
    isMe?: boolean;
  }>;
}

export default function TournamentTableView({
  onLeave,
  children,
  variant = 'tournament',
  headerTitle,
  headerBadge,
  blindsText,
  nextBlindsText,
  tournamentInfo,
  rankings,
}: TournamentTableViewProps) {
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const showTournamentPanels = variant !== 'cash';
  const hasRankings = Array.isArray(rankings) && rankings.length > 0;
  const playersRemaining = tournamentInfo?.playersRemaining;
  const totalPlayers = tournamentInfo?.totalPlayers;
  const averageStack = tournamentInfo?.averageStack;
  const yourStack = tournamentInfo?.yourStack;
  const yourPosition = tournamentInfo?.yourPosition;
  const prizePool = tournamentInfo?.prizePool;
  const nextPayout = tournamentInfo?.nextPayout;
  const blindsLabel = showTournamentPanels ? 'Current Blinds' : 'Stakes';
  const displayBlinds = blindsText || (showTournamentPanels ? '100/200 (25)' : '—');

  return (
    <div className="fixed inset-0 bg-[#020308] font-sans overflow-hidden flex flex-col">
      {/* Top Bar */}
      <header className="h-16 bg-[#0a0c1a]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 sm:px-6 z-50">
        <div className="flex items-center gap-4">
          {showTournamentPanels && (
            <button
              onClick={() => setShowLeft(!showLeft)}
              className="p-2 text-slate-400 hover:text-white lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {showTournamentPanels ? (
                <Trophy className="w-4 h-4 text-cyan-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-cyan-400" />
              )}
              <h2 className="text-sm sm:text-base font-black italic uppercase text-white tracking-tighter">
                {headerTitle || (showTournamentPanels ? 'NEURAL SPRINT #42' : 'CASH TABLE')}
              </h2>
            </div>
            {showTournamentPanels ? (
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-cyan-900/30 text-cyan-400 border border-cyan-500/50 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />{' '}
                  {headerBadge || 'Level 5'}
                </span>
              </div>
            ) : (
              headerBadge && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-cyan-900/30 text-cyan-400 border border-cyan-500/50 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    {headerBadge}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 sm:gap-12">
          <div className="text-center hidden sm:block">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">
              {blindsLabel}
            </p>
            <p className="text-sm font-mono text-white">{displayBlinds}</p>
          </div>

          {showTournamentPanels && (
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
                  {nextBlindsText || 'Next: 150/300'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {showTournamentPanels && (
            <button
              onClick={() => setShowRight(!showRight)}
              className="p-2 text-slate-400 hover:text-white lg:hidden"
            >
              <Users className="w-5 h-5" />
            </button>
          )}
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
          {showTournamentPanels && showLeft && (
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
                    {typeof playersRemaining === 'number' ? playersRemaining : '—'}{' '}
                    <span className="text-sm text-slate-500">
                      / {typeof totalPlayers === 'number' ? totalPlayers : '—'}
                    </span>
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                    Average Stack
                  </p>
                  <p className="text-lg font-mono text-slate-300">
                    {typeof averageStack === 'number' ? `$${averageStack.toLocaleString()}` : '—'}
                  </p>
                </div>

                <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-1">
                    Your Stack
                  </p>
                  <p className="text-2xl font-mono text-green-400 font-bold drop-shadow-[0_0_8px_rgba(74,222,128,0.3)]">
                    {typeof yourStack === 'number' ? `$${yourStack.toLocaleString()}` : '—'}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
                    Position:{' '}
                    {typeof yourPosition === 'number'
                      ? `${yourPosition}${typeof totalPlayers === 'number' ? ` of ${totalPlayers}` : ''}`
                      : '—'}
                  </p>
                </div>

                {typeof prizePool === 'number' && (
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                      Prize Pool
                    </p>
                    <p className="text-xl font-mono text-[#10b981] font-bold">
                      ${prizePool.toLocaleString()}
                    </p>
                  </div>
                )}

                {nextPayout && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                      Next Payout
                    </p>
                    <p className="text-sm font-mono text-white">{nextPayout}</p>
                  </div>
                )}
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
          {showTournamentPanels && showRight && (
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
                    {hasRankings ? (
                      rankings!.map((p) => (
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-slate-500 text-xs">
                          Awaiting live leaderboard data...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Bar */}
      {showTournamentPanels ? (
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
      ) : (
        <div className="h-12 bg-[#0a0c1a] border-t border-white/5 flex items-center justify-between px-6 z-50">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-400">
            <AlertCircle className="w-4 h-4" /> Live Cash Action
          </div>
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
            {headerBadge && <span>{headerBadge}</span>}
            {displayBlinds !== '—' && <span className="text-cyan-300">Stakes {displayBlinds}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
