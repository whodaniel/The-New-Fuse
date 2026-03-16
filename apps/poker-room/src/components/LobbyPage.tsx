import { motion } from 'framer-motion';
import {
  Activity,
  BrainCircuit,
  CheckCircle,
  Coins,
  Handshake,
  History,
  Medal,
  Rocket,
  Settings,
  Shield,
  Trophy,
  Users,
} from 'lucide-react';

interface LobbyPageProps {
  user: { username: string; balance: number; avatar: string };
  onNavigate: (view: string) => void;
  canAccessLab?: boolean;
  availableNavViews?: string[];
  availableCardViews?: string[];
  availableOperatorViews?: string[];
}

export default function LobbyPage({
  user,
  onNavigate,
  canAccessLab = false,
  availableNavViews = [],
  availableCardViews = [],
  availableOperatorViews = [],
}: LobbyPageProps) {
  const gameModes = [
    {
      id: 'CASH TABLES',
      title: 'Cash Games',
      sub: "No-Limit Hold'em Ring Games",
      stats: '3 Active Tables • 18 Players Online',
      btn: 'Browse Tables',
      icon: <Coins className="w-6 h-6" />,
    },
    {
      id: 'TOURNAMENTS',
      title: 'Sit & Go',
      sub: 'Single Table Tournaments',
      stats: '5 Available • Starting at $100 Buy-in',
      btn: 'View Tournaments',
      icon: <Users className="w-6 h-6" />,
    },
    {
      id: 'TOURNAMENTS',
      title: 'Multi-Table Tournaments',
      sub: 'Scheduled MTT Events',
      stats: 'Next Event: 2 hours • 50 Guaranteed',
      btn: 'Tournament Lobby',
      icon: <Trophy className="w-6 h-6" />,
    },
    {
      id: 'HISTORY',
      title: 'Hand History',
      sub: 'Review Past Sessions',
      stats: '0 Hands Recorded',
      btn: 'View History',
      icon: <History className="w-6 h-6" />,
    },
    {
      id: 'LEADERBOARD',
      title: 'Leaderboard',
      sub: 'Top Neural Agents',
      stats: 'Rank: #47 • Net: +$2,300',
      btn: 'View Rankings',
      icon: <Medal className="w-6 h-6" />,
    },
    {
      id: 'MARKETPLACE',
      title: 'Staking Market',
      sub: 'Back Players, Share Profits',
      stats: '12 Active Listings',
      btn: 'View Market',
      icon: <Handshake className="w-6 h-6" />,
    },
    {
      id: 'COMMUNITY APPS',
      title: 'Community Apps',
      sub: 'Member-generated Cloudflare builds',
      stats: 'Submit, vote, and launch',
      btn: 'Open Community',
      icon: <Rocket className="w-6 h-6" />,
    },
    {
      id: 'PROVABLY_FAIR',
      title: 'Provably Fair',
      sub: 'Verify Game Integrity',
      stats: 'Cryptographic Verification',
      btn: 'Verify',
      icon: <CheckCircle className="w-6 h-6" />,
    },
  ];
  if (canAccessLab) {
    gameModes.push({
      id: 'LAB',
      title: 'Strategy Lab',
      sub: 'AI-Powered Analysis',
      stats: 'Equity Calculator • Range Analysis',
      btn: 'Open Lab',
      icon: <BrainCircuit className="w-6 h-6" />,
    });
  }
  const filteredGameModes = gameModes.filter((mode) => availableCardViews.includes(mode.id));
  const navOrder = [
    'LOBBY',
    'CASH TABLES',
    'TOURNAMENTS',
    'COMMUNITY APPS',
    'LEADERBOARD',
    'WALLET',
  ];
  const navViews = navOrder.filter((view) => availableNavViews.includes(view));

  return (
    <div className="min-h-screen bg-[#020308] text-slate-300 font-sans selection:bg-cyan-400/30 selection:text-cyan-400">
      {/* Header */}
      <header className="h-20 bg-[#0a0c1a]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 sm:px-10 sticky top-0 z-[100]">
        <div className="flex items-center gap-12">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onNavigate('LOBBY')}
          >
            <div className="w-10 h-10 bg-cyan-400 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.4)] group-hover:shadow-[0_0_25px_rgba(0,242,255,0.6)] transition-all">
              <Shield className="w-6 h-6 text-black fill-current" />
            </div>
            <h1 className="text-2xl font-black italic text-white tracking-tighter uppercase">
              AI<span className="text-cyan-400">ARCADE</span>
            </h1>
          </div>
          <nav className="hidden lg:flex gap-8">
            {navViews.map((v) => (
              <button
                key={v}
                onClick={() => onNavigate(v)}
                className={`text-[10px] font-black uppercase tracking-widest transition-all ${v === 'LOBBY' ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(0,242,255,0.8)]' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {v}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div
            onClick={() => onNavigate('WALLET')}
            className="bg-black/50 border border-white/10 px-4 py-2 rounded-lg flex items-center gap-3 cursor-pointer hover:border-cyan-400/50 transition-all"
          >
            <Coins className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-sm font-bold text-white">
              ${user.balance.toLocaleString()}
            </span>
          </div>
          <div
            className="w-10 h-10 rounded-xl border-2 border-cyan-400/30 overflow-hidden cursor-pointer hover:border-cyan-400 transition-colors"
            onClick={() => onNavigate('PROFILE')}
          >
            <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
          </div>
          <button
            onClick={() => onNavigate('SETTINGS')}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-cyan-400/50 transition-all"
          >
            <Settings className="w-5 h-5 text-slate-400 hover:text-cyan-400 transition-colors" />
          </button>
        </div>
      </header>

      <main className="p-6 sm:p-12 max-w-7xl mx-auto">
        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-gradient-to-r from-cyan-950/40 to-transparent border border-white/5 rounded-3xl p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2">
              Welcome Back, Agent
            </p>
            <h2 className="text-4xl sm:text-5xl font-black italic text-white uppercase tracking-tighter">
              {user.username}
            </h2>
          </div>

          <div className="relative z-10 flex flex-col items-end gap-6">
            <div className="flex items-center gap-6 bg-black/40 px-6 py-3 rounded-2xl border border-white/5">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Hands Played
                </p>
                <p className="text-xl font-mono text-white">0</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Win Rate
                </p>
                <p className="text-xl font-mono text-white">—%</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Net
                </p>
                <p className="text-xl font-mono text-cyan-400">$0</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('CASH TABLES')}
              className="px-8 py-3 bg-cyan-600 rounded-2xl font-black italic uppercase tracking-widest text-white border-b-4 border-cyan-800 hover:brightness-125 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_20px_rgba(0,242,255,0.2)]"
            >
              Quick Play
            </button>
          </div>
        </motion.div>

        {/* Game Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredGameModes.map((mode, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#0a0c1a]/80 backdrop-blur-md border-4 border-cyan-900/50 rounded-[40px] p-8 flex flex-col justify-between hover:border-cyan-400/80 hover:-translate-y-2 transition-all duration-300 group shadow-xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />

              <div className="relative z-10">
                <div className="w-12 h-12 bg-cyan-900/30 rounded-xl flex items-center justify-center text-cyan-400 mb-6 border border-cyan-500/30 group-hover:scale-110 transition-transform">
                  {mode.icon}
                </div>
                <h3 className="text-2xl font-black italic uppercase text-white mb-2">
                  {mode.title}
                </h3>
                <p className="text-sm text-slate-400 mb-6">{mode.sub}</p>

                <div className="bg-black/40 rounded-xl p-4 border border-white/5 mb-8">
                  <p className="text-xs font-mono text-cyan-400/80">{mode.stats}</p>
                </div>
              </div>

              <button
                onClick={() => onNavigate(mode.id)}
                className="w-full py-4 bg-cyan-600 rounded-[25px] font-black italic uppercase tracking-widest text-white hover:brightness-125 transition-all relative z-10"
              >
                {mode.btn}
              </button>
            </motion.div>
          ))}
          {availableOperatorViews.includes('CONTROL CENTER') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#120b24]/80 backdrop-blur-md border-4 border-indigo-900/60 rounded-[40px] p-8 flex flex-col justify-between hover:border-indigo-400/80 hover:-translate-y-2 transition-all duration-300 group shadow-xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-300 mb-6 border border-indigo-500/30 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black italic uppercase text-white mb-2">
                  Control Center
                </h3>
                <p className="text-sm text-slate-300 mb-6">
                  Operator-only surfaces for diagnostics, orchestration, and policy checks.
                </p>
                <div className="bg-black/40 rounded-xl p-4 border border-white/5 mb-8">
                  <p className="text-xs font-mono text-indigo-300/80">
                    Admin Context • Secure Controls
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('CONTROL CENTER')}
                className="w-full py-4 bg-indigo-600 rounded-[25px] font-black italic uppercase tracking-widest text-white hover:brightness-125 transition-all relative z-10"
              >
                Open Control Center
              </button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
