import {
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  History,
  PlayCircle,
  Search,
  Shield,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';

interface HandHistoryProps {
  onBack: () => void;
  onReplay: (handId: string) => void;
}

const MOCK_HANDS = [
  {
    id: 'H-9X82B',
    date: '2 hours ago',
    cards: ['Ah', 'Kh'],
    board: ['2c', '7s', 'Jd', 'Qh', 'Tc'],
    result: 450,
    phase: 'Showdown',
    winner: 'Neural_Knight',
  },
  {
    id: 'H-7Y11C',
    date: '3 hours ago',
    cards: ['7d', '7s'],
    board: ['8c', '9d', '2h'],
    result: -200,
    phase: 'Folded on Turn',
    winner: 'CYBER-9',
  },
  {
    id: 'H-4A99Z',
    date: 'Yesterday',
    cards: ['Jc', 'Ts'],
    board: ['Ac', 'Kc', 'Qc', '2d', '5s'],
    result: 1200,
    phase: 'Showdown',
    winner: 'Neural_Knight',
  },
  {
    id: 'H-1B22X',
    date: 'Yesterday',
    cards: ['2h', '3d'],
    board: [],
    result: -10,
    phase: 'Folded Pre-Flop',
    winner: 'GHOST',
  },
];

const CardMini: React.FC<{ val: string }> = ({ val }) => (
  <div className="w-6 h-8 sm:w-8 sm:h-11 rounded border border-slate-600 bg-white flex items-center justify-center font-black text-xs sm:text-sm shadow-sm">
    <span className={val.includes('h') || val.includes('d') ? 'text-red-500' : 'text-slate-900'}>
      {val[0]}
      <span className="text-[8px] sm:text-[10px]">
        {val[1] === 'h' ? '♥' : val[1] === 'd' ? '♦' : val[1] === 'c' ? '♣' : '♠'}
      </span>
    </span>
  </div>
);

export default function HandHistory({ onBack, onReplay }: HandHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterResult, setFilterResult] = useState('All');

  const filteredHands = MOCK_HANDS.filter((h) => {
    if (filterResult === 'Won') return h.result > 0;
    if (filterResult === 'Lost') return h.result < 0;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#020308] text-slate-300 font-sans">
      {/* Header */}
      <header className="h-20 bg-[#0a0c1a]/80 backdrop-blur-md border-b border-white/5 flex items-center px-6 sm:px-10 sticky top-0 z-[100]">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onBack}>
          <div className="w-10 h-10 bg-cyan-400 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.4)] group-hover:shadow-[0_0_25px_rgba(0,242,255,0.6)] transition-all">
            <Shield className="w-6 h-6 text-black fill-current" />
          </div>
          <h1 className="text-2xl font-black italic text-white tracking-tighter uppercase">
            AI<span className="text-cyan-400">ARCADE</span>
          </h1>
        </div>
      </header>

      <main className="p-6 sm:p-12 max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-4xl sm:text-5xl font-black italic text-white uppercase tracking-tighter mb-2 flex items-center gap-4">
            <History className="w-10 h-10 text-cyan-400" /> Hand History
          </h2>
          <p className="text-sm font-black text-cyan-400 uppercase tracking-widest">
            Review Your Neural Data
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-[#0a0c1a]/80 backdrop-blur-md border border-white/5 rounded-2xl p-4 mb-8 flex flex-wrap gap-4 items-center shadow-xl">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Hand ID..."
              className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2 text-sm text-white font-mono outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mr-1">
              Result:
            </span>
            {['All', 'Won', 'Lost'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterResult(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${filterResult === s ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(0,242,255,0.3)]' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Hand List */}
        <div className="space-y-4">
          {filteredHands.map((hand, i) => (
            <motion.div
              key={hand.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#0a0c1a]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-lg"
            >
              {/* Compact Card */}
              <div
                className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedId(expandedId === hand.id ? null : hand.id)}
              >
                <div className="flex items-center gap-6 min-w-[200px]">
                  <div>
                    <p className="text-sm font-mono text-cyan-400 font-bold">{hand.id}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {hand.date}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {hand.cards.map((c, j) => (
                      <CardMini key={j} val={c} />
                    ))}
                  </div>
                </div>

                <div className="flex-1 flex items-center gap-2 min-w-[200px]">
                  {hand.board.length > 0 ? (
                    hand.board.map((c, j) => <CardMini key={j} val={c} />)
                  ) : (
                    <span className="text-xs font-mono text-slate-600 italic">No board dealt</span>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  <div className="text-right">
                    <p
                      className={`text-lg font-mono font-bold ${hand.result > 0 ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {hand.result > 0 ? '+' : ''}${Math.abs(hand.result)}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {hand.phase}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReplay(hand.id);
                      }}
                      className="p-2 bg-cyan-900/30 text-cyan-400 rounded-lg hover:bg-cyan-600 hover:text-white transition-all border border-cyan-500/30"
                      title="Replay Hand"
                    >
                      <PlayCircle className="w-5 h-5" />
                    </button>
                    {expandedId === hand.id ? (
                      <ChevronUp className="w-5 h-5 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Detail View */}
              <AnimatePresence>
                {expandedId === hand.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5 bg-black/40"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-sm font-black italic uppercase text-white">
                          Action Timeline
                        </h4>
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-slate-700 transition-colors">
                          <Download className="w-3 h-3" /> Download Data
                        </button>
                      </div>

                      <div className="space-y-6 font-mono text-sm">
                        {/* Mock Timeline */}
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2 border-b border-cyan-900/50 pb-1">
                            Pre-Flop
                          </p>
                          <ul className="space-y-1 text-slate-400">
                            <li>
                              <span className="text-white">GHOST</span> posts small blind $1
                            </li>
                            <li>
                              <span className="text-white">CYBER-9</span> posts big blind $2
                            </li>
                            <li>
                              <span className="text-cyan-400">Neural_Knight</span> raises to $6
                            </li>
                            <li>
                              <span className="text-white">GHOST</span> folds
                            </li>
                            <li>
                              <span className="text-white">CYBER-9</span> calls $4
                            </li>
                          </ul>
                        </div>

                        {hand.board.length >= 3 && (
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2 border-b border-cyan-900/50 pb-1 flex items-center gap-2">
                              Flop{' '}
                              <span className="text-slate-500">
                                [{hand.board.slice(0, 3).join(' ')}]
                              </span>
                            </p>
                            <ul className="space-y-1 text-slate-400">
                              <li>
                                <span className="text-white">CYBER-9</span> checks
                              </li>
                              <li>
                                <span className="text-cyan-400">Neural_Knight</span> bets $8
                              </li>
                              <li>
                                <span className="text-white">CYBER-9</span> calls $8
                              </li>
                            </ul>
                          </div>
                        )}

                        {hand.phase === 'Showdown' && (
                          <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-xl p-4 mt-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">
                              Showdown
                            </p>
                            <p className="text-white mb-1">
                              <span className="text-cyan-400">{hand.winner}</span> wins pot ($
                              {Math.abs(hand.result) * 2})
                            </p>
                            <p className="text-slate-400 text-xs">
                              Winning hand: Straight, Ace High
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button className="px-8 py-3 bg-slate-900 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors border border-slate-800">
            Load More
          </button>
        </div>
      </main>
    </div>
  );
}
