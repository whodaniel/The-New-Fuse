import {
  Activity,
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  DollarSign,
  Lock,
  Shield,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { useState } from 'react';

interface PlayerProfileProps {
  user: {
    username: string;
    avatar: string;
    balance: number;
  };
  onBack: () => void;
}

export default function PlayerProfile({ user, onBack }: PlayerProfileProps) {
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'STATISTICS' | 'ACHIEVEMENTS' | 'SESSIONS'
  >('OVERVIEW');

  const recentSessions = [
    {
      id: 1,
      type: 'Cash Game',
      stakes: '$1/$2 NLHE',
      duration: '2h 15m',
      result: '+$450',
      date: '2 hours ago',
      isWin: true,
    },
    {
      id: 2,
      type: 'Tournament',
      stakes: '$50 Buy-in',
      duration: '4h 30m',
      result: '+$1,200',
      date: 'Yesterday',
      isWin: true,
    },
    {
      id: 3,
      type: 'Cash Game',
      stakes: '$2/$5 NLHE',
      duration: '1h 45m',
      result: '-$300',
      date: '2 days ago',
      isWin: false,
    },
    {
      id: 4,
      type: 'SNG',
      stakes: '$20 Buy-in',
      duration: '45m',
      result: '+$80',
      date: '3 days ago',
      isWin: true,
    },
    {
      id: 5,
      type: 'Cash Game',
      stakes: '$1/$2 NLHE',
      duration: '3h 10m',
      result: '-$150',
      date: '4 days ago',
      isWin: false,
    },
  ];

  const winLossData = [
    { value: 120, isWin: true },
    { value: 80, isWin: true },
    { value: -50, isWin: false },
    { value: 200, isWin: true },
    { value: -100, isWin: false },
    { value: 150, isWin: true },
    { value: 300, isWin: true },
    { value: -80, isWin: false },
    { value: 450, isWin: true },
    { value: 1200, isWin: true },
  ];

  const maxChartValue = Math.max(...winLossData.map((d) => Math.abs(d.value)));

  const achievements = [
    {
      id: 1,
      title: 'First Hand',
      description: 'Play your first hand of poker',
      status: 'unlocked',
      icon: <Target className="w-6 h-6" />,
    },
    {
      id: 2,
      title: 'Win 100 Hands',
      description: 'Win 100 hands in cash games',
      status: 'progress',
      progress: 47,
      total: 100,
      icon: <Trophy className="w-6 h-6" />,
    },
    {
      id: 3,
      title: 'High Roller',
      description: 'Enter a $1000+ buy-in event',
      status: 'locked',
      icon: <DollarSign className="w-6 h-6" />,
    },
    {
      id: 4,
      title: 'Tournament Champion',
      description: 'Win a multi-table tournament',
      status: 'locked',
      icon: <Award className="w-6 h-6" />,
    },
    {
      id: 5,
      title: 'Royal Flush',
      description: 'Hit a Royal Flush in any game',
      status: 'locked',
      icon: <Shield className="w-6 h-6" />,
    },
    {
      id: 6,
      title: 'Shark',
      description: 'Profit over $10,000',
      status: 'unlocked',
      icon: <TrendingUp className="w-6 h-6" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#020308] text-slate-300 font-sans pb-20">
      {/* Header */}
      <header className="h-20 bg-[#0a0c1a]/80 backdrop-blur-md border-b border-white/5 flex items-center px-6 sm:px-10 sticky top-0 z-[100]">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onBack}>
          <div className="w-10 h-10 bg-cyan-400 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.4)] group-hover:shadow-[0_0_25px_rgba(0,242,255,0.6)] transition-all">
            <ArrowLeft className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-2xl font-black italic text-white tracking-tighter uppercase">
            AI<span className="text-cyan-400">ARCADE</span>
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 sm:p-10">
        {/* Hero Section */}
        <div className="relative bg-[#0a0c1a] border border-white/10 rounded-3xl p-8 mb-8 overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-600 shadow-[0_0_30px_rgba(0,242,255,0.3)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-black border-4 border-black">
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#020308] border border-cyan-500/50 text-cyan-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap shadow-[0_0_10px_rgba(0,242,255,0.2)]">
                Level 42
              </div>
            </div>

            {/* Center Info */}
            <div className="flex-1 text-center md:text-left flex flex-col justify-center h-32">
              <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
                <h2 className="text-4xl font-black italic text-white tracking-tighter uppercase">
                  {user.username}
                </h2>
                <span className="px-3 py-1 bg-gradient-to-r from-slate-300 to-slate-500 text-black text-xs font-black rounded-sm uppercase tracking-widest shadow-[0_0_15px_rgba(203,213,225,0.3)]">
                  Platinum
                </span>
              </div>
              <p className="text-slate-400 font-medium flex items-center justify-center md:justify-start gap-2">
                <Clock className="w-4 h-4" /> Member since March 2026
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto shrink-0">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center md:text-left min-w-[140px]">
                <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">
                  Total Hands
                </div>
                <div className="text-2xl font-black text-white">1,247</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center md:text-left min-w-[140px]">
                <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">
                  Win Rate
                </div>
                <div className="text-2xl font-black text-cyan-400">54.2%</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center md:text-left min-w-[140px]">
                <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">
                  Net Profit
                </div>
                <div className="text-2xl font-black text-green-400">+$12,450</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center md:text-left min-w-[140px]">
                <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">
                  Tournaments
                </div>
                <div className="text-2xl font-black text-indigo-400">3 Won</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 border-b border-white/10 pb-px">
          {(['OVERVIEW', 'STATISTICS', 'ACHIEVEMENTS', 'SESSIONS'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab
                  ? 'text-cyan-400 border-cyan-400 bg-cyan-400/5'
                  : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'OVERVIEW' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Win/Loss Chart */}
                <div className="bg-[#0a0c1a] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" /> Performance (Last 10)
                  </h3>
                  <div className="h-48 flex items-end gap-2 sm:gap-4">
                    {winLossData.map((data, i) => {
                      const height = `${(Math.abs(data.value) / maxChartValue) * 100}%`;
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col justify-end items-center group relative h-full"
                        >
                          {/* Tooltip */}
                          <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/20 text-xs font-bold px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                            {data.value > 0 ? '+' : ''}${data.value}
                          </div>
                          {/* Bar */}
                          <div
                            className={`w-full rounded-t-sm transition-all duration-500 ${data.isWin ? 'bg-green-500/80 hover:bg-green-400' : 'bg-red-500/80 hover:bg-red-400'}`}
                            style={{ height: height, minHeight: '4px' }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-t border-white/10 pt-4">
                    <span>Older</span>
                    <span>Newer</span>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-[#0a0c1a] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-400" /> Recent Activity
                  </h3>
                  <div className="space-y-4">
                    {recentSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${session.isWin ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                          >
                            {session.isWin ? (
                              <TrendingUp className="w-5 h-5" />
                            ) : (
                              <TrendingUp className="w-5 h-5 rotate-180" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white">
                              {session.type}{' '}
                              <span className="text-slate-400 font-normal ml-2">
                                {session.stakes}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {session.date} • {session.duration}
                            </div>
                          </div>
                        </div>
                        <div
                          className={`font-black text-lg ${session.isWin ? 'text-green-400' : 'text-red-400'}`}
                        >
                          {session.result}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Current Streak */}
                <div className="bg-gradient-to-br from-cyan-900/40 to-indigo-900/40 border border-cyan-500/30 rounded-2xl p-6 text-center relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-cyan-500/20">
                    <Trophy className="w-24 h-24" />
                  </div>
                  <h3 className="text-sm font-black text-cyan-400 uppercase tracking-widest mb-2 relative z-10">
                    Current Streak
                  </h3>
                  <div className="text-3xl font-black text-white italic relative z-10">
                    3 Winning Sessions
                  </div>
                </div>

                {/* Favorites */}
                <div className="bg-[#0a0c1a] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
                    Favorites
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Game Type</div>
                      <div className="font-bold text-white">No Limit Hold'em</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Cash Stakes</div>
                      <div className="font-bold text-white">$1/$2 NLHE</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Tournament Buy-in</div>
                      <div className="font-bold text-white">$20 - $50</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'STATISTICS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <StatCard
                title="VPIP"
                value="24%"
                subtitle="Voluntarily Put $ In Pot"
                highlight="text-cyan-400"
              />
              <StatCard
                title="PFR"
                value="18%"
                subtitle="Pre-Flop Raise"
                highlight="text-indigo-400"
              />
              <StatCard
                title="Aggression Factor"
                value="2.1"
                subtitle="(Bet + Raise) / Call"
                highlight="text-purple-400"
              />
              <StatCard
                title="3-Bet %"
                value="7%"
                subtitle="Re-raise pre-flop"
                highlight="text-pink-400"
              />

              <StatCard title="C-Bet %" value="65%" subtitle="Continuation Bet" />
              <StatCard title="Showdown Win %" value="52%" subtitle="Won at showdown" />
              <StatCard title="Average Pot Won" value="$340" subtitle="Across all cash games" />
              <StatCard
                title="Biggest Pot Won"
                value="$12,400"
                subtitle="NLHE $5/$10"
                highlight="text-green-400"
              />

              <StatCard title="Tournaments Entered" value="15" subtitle="MTTs and SNGs" />
              <StatCard
                title="Tournament ROI"
                value="+34%"
                subtitle="Return on Investment"
                highlight="text-green-400"
              />
              <StatCard title="Avg Finish" value="Top 28%" subtitle="Across all tournaments" />
              <StatCard title="ITM %" value="22%" subtitle="In The Money" />
            </div>
          )}

          {activeTab === 'ACHIEVEMENTS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`relative p-6 rounded-2xl border transition-all ${
                    achievement.status === 'unlocked'
                      ? 'bg-gradient-to-br from-cyan-900/20 to-[#0a0c1a] border-cyan-500/30 shadow-[0_0_15px_rgba(0,242,255,0.05)]'
                      : achievement.status === 'progress'
                        ? 'bg-[#0a0c1a] border-indigo-500/30'
                        : 'bg-[#05060a] border-white/5 opacity-60 grayscale'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        achievement.status === 'unlocked'
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : achievement.status === 'progress'
                            ? 'bg-indigo-500/20 text-indigo-400'
                            : 'bg-white/5 text-slate-500'
                      }`}
                    >
                      {achievement.icon}
                    </div>
                    {achievement.status === 'unlocked' && (
                      <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                    )}
                    {achievement.status === 'locked' && <Lock className="w-5 h-5 text-slate-500" />}
                  </div>

                  <h3
                    className={`text-lg font-black uppercase tracking-widest mb-1 ${achievement.status === 'unlocked' ? 'text-white' : 'text-slate-300'}`}
                  >
                    {achievement.title}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">{achievement.description}</p>

                  {achievement.status === 'progress' && achievement.total && (
                    <div className="mt-auto">
                      <div className="flex justify-between text-xs font-bold text-indigo-400 mb-2">
                        <span>Progress</span>
                        <span>
                          {achievement.progress} / {achievement.total}
                        </span>
                      </div>
                      <div className="h-2 bg-black rounded-full overflow-hidden border border-white/10">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'SESSIONS' && (
            <div className="bg-[#0a0c1a] border border-white/10 rounded-2xl p-8 text-center">
              <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">
                Detailed Session History
              </h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Full session logs and hand histories are available in the dedicated History tab from
                the main lobby.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  highlight = 'text-white',
}: {
  title: string;
  value: string;
  subtitle: string;
  highlight?: string;
}) {
  return (
    <div className="bg-[#0a0c1a] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors">
      <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">
        {title}
      </div>
      <div className={`text-3xl font-black italic tracking-tighter mb-2 ${highlight}`}>{value}</div>
      <div className="text-xs text-slate-400">{subtitle}</div>
    </div>
  );
}
