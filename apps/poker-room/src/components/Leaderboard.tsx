import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, ChevronLeft, Crown, Medal, Minus, Trophy } from 'lucide-react';
import { useState } from 'react';

interface LeaderboardProps {
  onBack?: () => void;
  onViewProfile?: (username: string) => void;
  currentUser?: { username: string };
}

type TimeFilter = 'TODAY' | 'THIS WEEK' | 'THIS MONTH' | 'ALL TIME';
type CategoryFilter = 'CASH GAMES' | 'TOURNAMENTS' | 'OVERALL';

const MOCK_LEADERBOARD = [
  {
    rank: 1,
    username: 'AlphaZero',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlphaZero',
    hands: '1.2M',
    winRate: '58.4%',
    netProfit: 145000,
    tourneysWon: 42,
    rankChange: 0,
  },
  {
    rank: 2,
    username: 'DeepStack',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DeepStack',
    hands: '850k',
    winRate: '56.1%',
    netProfit: 112000,
    tourneysWon: 28,
    rankChange: 1,
  },
  {
    rank: 3,
    username: 'Pluribus',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pluribus',
    hands: '2.1M',
    winRate: '54.2%',
    netProfit: 98500,
    tourneysWon: 15,
    rankChange: -1,
  },
  {
    rank: 4,
    username: 'Libratus',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Libratus',
    hands: '420k',
    winRate: '59.8%',
    netProfit: 85000,
    tourneysWon: 31,
    rankChange: 2,
  },
  {
    rank: 5,
    username: 'Cepheus',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cepheus',
    hands: '3.5M',
    winRate: '51.5%',
    netProfit: 72000,
    tourneysWon: 8,
    rankChange: 0,
  },
  {
    rank: 6,
    username: 'Polaris',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Polaris',
    hands: '150k',
    winRate: '62.1%',
    netProfit: 68000,
    tourneysWon: 12,
    rankChange: -2,
  },
  {
    rank: 7,
    username: 'Claudico',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Claudico',
    hands: '980k',
    winRate: '53.7%',
    netProfit: 54000,
    tourneysWon: 5,
    rankChange: 4,
  },
  {
    rank: 8,
    username: 'Tartanian',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tartanian',
    hands: '640k',
    winRate: '55.2%',
    netProfit: 49000,
    tourneysWon: 19,
    rankChange: -1,
  },
  {
    rank: 9,
    username: 'NeoGrinder',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NeoGrinder',
    hands: '210k',
    winRate: '57.4%',
    netProfit: 42000,
    tourneysWon: 7,
    rankChange: 1,
  },
  {
    rank: 10,
    username: 'SynthWave99',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SynthWave99',
    hands: '1.1M',
    winRate: '52.9%',
    netProfit: 38000,
    tourneysWon: 11,
    rankChange: 0,
  },
  // User's rank
  {
    rank: 47,
    username: 'Guest',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
    hands: '12k',
    winRate: '51.2%',
    netProfit: 2300,
    tourneysWon: 1,
    rankChange: 5,
  },
];

export default function Leaderboard({
  onBack,
  onViewProfile,
  currentUser = { username: 'Guest' },
}: LeaderboardProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('THIS WEEK');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('OVERALL');

  const top3 = MOCK_LEADERBOARD.slice(0, 3);
  const rest = MOCK_LEADERBOARD.slice(3);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRankChangeIcon = (change: number) => {
    if (change > 0)
      return (
        <span className="flex items-center text-emerald-400 text-xs">
          <ArrowUp className="w-3 h-3 mr-0.5" />
          {change}
        </span>
      );
    if (change < 0)
      return (
        <span className="flex items-center text-rose-400 text-xs">
          <ArrowDown className="w-3 h-3 mr-0.5" />
          {Math.abs(change)}
        </span>
      );
    return (
      <span className="flex items-center text-slate-500 text-xs">
        <Minus className="w-3 h-3 mr-0.5" />
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0f16] text-slate-300 font-sans selection:bg-cyan-500/30 flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-cyan-400" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-black italic uppercase tracking-widest text-white flex items-center gap-3">
                <Trophy className="w-6 h-6 text-amber-400" />
                Leaderboard
              </h1>
              <p className="text-xs font-mono text-cyan-400/70 uppercase tracking-wider">
                Top Neural Agents
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 pb-32">
        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12">
          <div className="flex space-x-1 bg-black/40 p-1 rounded-xl border border-white/5 w-full md:w-auto overflow-x-auto no-scrollbar">
            {(['TODAY', 'THIS WEEK', 'THIS MONTH', 'ALL TIME'] as TimeFilter[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setTimeFilter(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  timeFilter === tab
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex space-x-1 bg-black/40 p-1 rounded-xl border border-white/5 w-full md:w-auto overflow-x-auto no-scrollbar">
            {(['CASH GAMES', 'TOURNAMENTS', 'OVERALL'] as CategoryFilter[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setCategoryFilter(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  categoryFilter === tab
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-4 md:gap-8 mb-16 mt-8">
          {/* 2nd Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center relative z-10"
          >
            <div
              className="relative mb-4 cursor-pointer group"
              onClick={() => onViewProfile?.(top3[1].username)}
            >
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-slate-300/50 overflow-hidden bg-black group-hover:border-slate-300 transition-colors">
                <img
                  src={top3[1].avatar}
                  alt={top3[1].username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-900 w-8 h-8 rounded-full flex items-center justify-center font-black border-2 border-[#0a0f16]">
                2
              </div>
            </div>
            <h3 className="text-sm md:text-base font-black italic text-white uppercase tracking-wider mb-1">
              {top3[1].username}
            </h3>
            <p className="text-xs md:text-sm font-mono text-emerald-400">
              {formatCurrency(top3[1].netProfit)}
            </p>
            <div className="w-24 md:w-32 h-32 md:h-40 bg-gradient-to-t from-slate-300/20 to-slate-300/5 border-t-2 border-slate-300/30 rounded-t-xl mt-4 flex items-end justify-center pb-4">
              <Medal className="w-8 h-8 text-slate-300/50" />
            </div>
          </motion.div>

          {/* 1st Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center relative z-20"
          >
            <div className="absolute -top-12 text-amber-400 animate-pulse">
              <Crown className="w-10 h-10" />
            </div>
            <div
              className="relative mb-4 cursor-pointer group"
              onClick={() => onViewProfile?.(top3[0].username)}
            >
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-amber-400 overflow-hidden bg-black shadow-[0_0_30px_rgba(251,191,36,0.3)] group-hover:scale-105 transition-transform">
                <img
                  src={top3[0].avatar}
                  alt={top3[0].username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 w-10 h-10 rounded-full flex items-center justify-center font-black text-lg border-4 border-[#0a0f16]">
                1
              </div>
            </div>
            <h3 className="text-base md:text-xl font-black italic text-amber-400 uppercase tracking-wider mb-1">
              {top3[0].username}
            </h3>
            <p className="text-sm md:text-base font-mono text-emerald-400 font-bold">
              {formatCurrency(top3[0].netProfit)}
            </p>
            <div className="w-28 md:w-40 h-40 md:h-48 bg-gradient-to-t from-amber-400/20 to-amber-400/5 border-t-2 border-amber-400/50 rounded-t-xl mt-4 flex items-end justify-center pb-6 shadow-[0_-10px_30px_rgba(251,191,36,0.1)]">
              <Trophy className="w-12 h-12 text-amber-400/50" />
            </div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center relative z-10"
          >
            <div
              className="relative mb-4 cursor-pointer group"
              onClick={() => onViewProfile?.(top3[2].username)}
            >
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-amber-700/50 overflow-hidden bg-black group-hover:border-amber-700 transition-colors">
                <img
                  src={top3[2].avatar}
                  alt={top3[2].username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-700 text-amber-100 w-8 h-8 rounded-full flex items-center justify-center font-black border-2 border-[#0a0f16]">
                3
              </div>
            </div>
            <h3 className="text-sm md:text-base font-black italic text-white uppercase tracking-wider mb-1">
              {top3[2].username}
            </h3>
            <p className="text-xs md:text-sm font-mono text-emerald-400">
              {formatCurrency(top3[2].netProfit)}
            </p>
            <div className="w-24 md:w-32 h-24 md:h-32 bg-gradient-to-t from-amber-700/20 to-amber-700/5 border-t-2 border-amber-700/30 rounded-t-xl mt-4 flex items-end justify-center pb-4">
              <Medal className="w-8 h-8 text-amber-700/50" />
            </div>
          </motion.div>
        </div>

        {/* Table */}
        <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-[10px] md:text-xs uppercase tracking-wider text-slate-400 font-bold">
                  <th className="p-4 w-16 text-center">Rank</th>
                  <th className="p-4">Player</th>
                  <th className="p-4 text-right hidden sm:table-cell">Hands</th>
                  <th className="p-4 text-right hidden md:table-cell">Win Rate</th>
                  <th className="p-4 text-right">Net Profit</th>
                  <th className="p-4 text-right hidden lg:table-cell">Tournaments</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((player, idx) => {
                  const isCurrentUser = player.username === currentUser.username;
                  return (
                    <tr
                      key={player.rank}
                      onClick={() => onViewProfile?.(player.username)}
                      className={`
                        border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors
                        ${idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}
                        ${isCurrentUser ? 'bg-cyan-900/20 border-l-4 border-l-cyan-400' : 'border-l-4 border-l-transparent'}
                      `}
                    >
                      <td className="p-4">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span
                            className={`font-mono font-bold ${isCurrentUser ? 'text-cyan-400' : 'text-slate-500'}`}
                          >
                            #{player.rank}
                          </span>
                          {getRankChangeIcon(player.rankChange)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full overflow-hidden bg-black border ${isCurrentUser ? 'border-cyan-400' : 'border-white/10'}`}
                          >
                            <img
                              src={player.avatar}
                              alt={player.username}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span
                            className={`font-bold italic uppercase tracking-wide ${isCurrentUser ? 'text-cyan-400' : 'text-white'}`}
                          >
                            {player.username}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono text-sm text-slate-400 hidden sm:table-cell">
                        {player.hands}
                      </td>
                      <td className="p-4 text-right font-mono text-sm text-slate-400 hidden md:table-cell">
                        {player.winRate}
                      </td>
                      <td className="p-4 text-right font-mono text-sm text-emerald-400 font-bold">
                        {formatCurrency(player.netProfit)}
                      </td>
                      <td className="p-4 text-right font-mono text-sm text-slate-400 hidden lg:table-cell">
                        {player.tourneysWon}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Sticky Footer for Personal Ranking */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0c1a]/95 backdrop-blur-xl border-t border-cyan-900/50 p-4 z-50">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-cyan-400 overflow-hidden bg-black">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Guest"
                alt="Guest"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs text-cyan-400/70 uppercase tracking-wider font-bold mb-0.5">
                Your Rank
              </p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black italic text-white">#47</span>
                {getRankChangeIcon(5)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 sm:gap-12">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Net Profit</p>
              <p className="text-lg font-mono text-emerald-400 font-bold">+$2,300</p>
            </div>
            <div className="w-px h-10 bg-white/10 hidden sm:block"></div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Next Rank In</p>
              <p className="text-sm font-mono text-amber-400">$450</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
