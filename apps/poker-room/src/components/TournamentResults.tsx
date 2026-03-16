import { motion } from 'framer-motion';
import { ArrowLeft, Award, History, Medal, Share2, Trophy } from 'lucide-react';

interface TournamentResultsProps {
  onBack: () => void;
  onHistory: () => void;
}

const MOCK_RESULTS = [
  { place: 1, name: 'CYBER-9', prize: 2500, hands: 342, eliminator: '-' },
  { place: 2, name: 'GHOST', prize: 1500, hands: 342, eliminator: 'CYBER-9' },
  { place: 3, name: 'Neural_Knight', prize: 600, hands: 127, eliminator: 'CYBER-9', isMe: true },
  { place: 4, name: 'VOID_WALKER', prize: 250, hands: 115, eliminator: 'Neural_Knight' },
  { place: 5, name: 'SYNTH_01', prize: 150, hands: 98, eliminator: 'GHOST' },
  { place: 6, name: 'NEON_GOD', prize: 0, hands: 84, eliminator: 'VOID_WALKER' },
  { place: 7, name: 'DATA_MINER', prize: 0, hands: 72, eliminator: 'CYBER-9' },
  { place: 8, name: 'ZERO_COOL', prize: 0, hands: 65, eliminator: 'SYNTH_01' },
];

export default function TournamentResults({ onBack, onHistory }: TournamentResultsProps) {
  return (
    <div className="min-h-screen bg-[#020308] text-slate-300 font-sans flex flex-col items-center py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10 flex flex-col items-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="flex flex-col items-center mb-12 text-center"
        >
          <div className="w-24 h-24 bg-yellow-900/30 rounded-full flex items-center justify-center border-4 border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.4)] mb-6 relative">
            <Trophy className="w-12 h-12 text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
            <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-ping opacity-20" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-black italic uppercase text-white tracking-tighter mb-2">
            Tournament Complete
          </h1>
          <p className="text-lg font-black text-cyan-400 uppercase tracking-widest">
            NEURAL SPRINT #42
          </p>
        </motion.div>

        {/* Your Result Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full bg-[#0a0c1a]/90 backdrop-blur-xl border-2 border-cyan-400/50 rounded-[40px] p-8 sm:p-12 mb-12 shadow-[0_0_40px_rgba(0,242,255,0.15)] relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left border-b md:border-b-0 md:border-r border-white/10 pb-8 md:pb-0 md:pr-8">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                Your Finish
              </p>
              <h2 className="text-5xl sm:text-7xl font-black italic text-white uppercase tracking-tighter mb-4 flex items-center justify-center md:justify-start gap-4">
                3rd <span className="text-2xl text-slate-400">Place</span>
              </h2>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-500/50 rounded-xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-green-400">
                  Prize Won
                </span>
                <span className="text-xl font-mono text-green-400 font-bold">$600</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Hands Played
                </p>
                <p className="text-2xl font-mono text-white">127</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Biggest Pot
                </p>
                <p className="text-2xl font-mono text-cyan-400">$4,500</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Total Chips Won
                </p>
                <p className="text-2xl font-mono text-white">32,400</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {[
            { label: 'Total Hands', val: '412' },
            { label: 'Duration', val: '2h 15m' },
            { label: 'Prize Pool', val: '$5,000' },
            { label: 'Entries', val: '50' },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-[#0a0c1a]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 text-center"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                {stat.label}
              </p>
              <p className="text-xl font-mono text-cyan-400 font-bold">{stat.val}</p>
            </div>
          ))}
        </motion.div>

        {/* Results Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full bg-[#0a0c1a]/80 backdrop-blur-xl border border-white/5 rounded-[30px] overflow-hidden mb-12 shadow-2xl"
        >
          <div className="p-6 border-b border-white/5 bg-black/40">
            <h3 className="text-lg font-black italic uppercase text-white tracking-widest">
              Final Standings
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-black/20">
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Place
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Player
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">
                    Prize
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right hidden sm:table-cell">
                    Hands
                  </th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 hidden md:table-cell">
                    Eliminator
                  </th>
                </tr>
              </thead>
              <tbody className="font-mono text-sm">
                {MOCK_RESULTS.map((r) => (
                  <tr
                    key={r.place}
                    className={`border-b border-white/5 transition-colors ${r.isMe ? 'bg-cyan-900/20 hover:bg-cyan-900/30' : 'hover:bg-white/5'}`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {r.place === 1 ? (
                          <Trophy className="w-5 h-5 text-yellow-500" />
                        ) : r.place === 2 ? (
                          <Medal className="w-5 h-5 text-slate-300" />
                        ) : r.place === 3 ? (
                          <Award className="w-5 h-5 text-amber-700" />
                        ) : (
                          <span className="text-slate-500 font-bold w-5 text-center">
                            {r.place}
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      className={`py-4 px-6 font-bold ${r.isMe ? 'text-cyan-400' : 'text-white'}`}
                    >
                      {r.name}
                    </td>
                    <td
                      className={`py-4 px-6 text-right font-bold ${r.prize > 0 ? 'text-green-400' : 'text-slate-600'}`}
                    >
                      {r.prize > 0 ? `$${r.prize.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-4 px-6 text-right text-slate-400 hidden sm:table-cell">
                      {r.hands}
                    </td>
                    <td className="py-4 px-6 text-slate-500 hidden md:table-cell">
                      {r.eliminator}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-4 w-full"
        >
          <button
            onClick={onBack}
            className="px-8 py-4 bg-slate-900 rounded-2xl font-black italic uppercase tracking-widest text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Lobby
          </button>
          <button
            onClick={onHistory}
            className="px-8 py-4 bg-cyan-900/30 rounded-2xl font-black italic uppercase tracking-widest text-cyan-400 border border-cyan-500/50 hover:bg-cyan-600 hover:text-white transition-all flex items-center gap-2"
          >
            <History className="w-5 h-5" /> View Hand History
          </button>
          <button className="px-8 py-4 bg-purple-600 rounded-2xl font-black italic uppercase tracking-widest text-white border-b-4 border-purple-800 hover:brightness-125 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <Share2 className="w-5 h-5" /> Share Result
          </button>
        </motion.div>
      </div>
    </div>
  );
}
