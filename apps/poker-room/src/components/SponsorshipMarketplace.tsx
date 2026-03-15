import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ChevronLeft, Clock, Plus, Users, X } from 'lucide-react';
import { useState } from 'react';

interface SponsorshipMarketplaceProps {
  onBack?: () => void;
}

const MOCK_AVAILABLE = [
  {
    id: '1',
    player: {
      name: 'CyberShark',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CyberShark',
      winRate: '54%',
      roi: '+12.4%',
      handsPlayed: '142k',
    },
    tournament: 'NEURAL SPRINT #42',
    buyIn: 500,
    askingAmount: 400,
    markup: 1.1,
    remainingShares: 200,
    history: [10, 15, 8, 22, 18, 30, 25, 40, 35, 50],
  },
  {
    id: '2',
    player: {
      name: 'NeonGrinder',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NeonGrinder',
      winRate: '49%',
      roi: '+4.2%',
      handsPlayed: '89k',
    },
    tournament: 'WEEKLY HIGH ROLLER',
    buyIn: 1000,
    askingAmount: 500,
    markup: 1.05,
    remainingShares: 100,
    history: [5, 10, 15, 12, 20, 18, 25, 22, 30, 28],
  },
  {
    id: '3',
    player: {
      name: 'QuantumBluff',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=QuantumBluff',
      winRate: '61%',
      roi: '+28.9%',
      handsPlayed: '310k',
    },
    tournament: 'MAIN EVENT SATELLITE',
    buyIn: 250,
    askingAmount: 100,
    markup: 1.25,
    remainingShares: 50,
    history: [20, 25, 22, 35, 30, 45, 40, 60, 55, 80],
  },
];

const MOCK_INVESTMENTS = [
  {
    id: 'i1',
    player: 'SynthWave99',
    tournament: 'DAILY TURBO #18',
    invested: 50,
    status: 'In Progress — 5th of 12',
    expectedReturn: 120,
    settlement: 'Pending',
  },
  {
    id: 'i2',
    player: 'DataMiner',
    tournament: 'SUNDAY MILLION',
    invested: 200,
    status: 'Busted — 142nd',
    expectedReturn: 0,
    settlement: 'Settled',
  },
];

const MOCK_BACKERS = [
  {
    id: 'b1',
    tournament: 'NIGHTLY DEEPSTACK',
    amountNeeded: 200,
    funded: 200,
    status: 'Funded',
    claims: 'Pending',
  },
  {
    id: 'b2',
    tournament: 'BOUNTY BUILDER',
    amountNeeded: 500,
    funded: 150,
    status: 'Partially Funded',
    claims: 'Pending',
  },
];

const Sparkline = ({ data }: { data: number[] }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 30;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 -5 ${width} ${height + 10}`}
      preserveAspectRatio="none"
      className="overflow-visible"
    >
      <polyline
        fill="none"
        stroke="#22d3ee"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export default function SponsorshipMarketplace({ onBack }: SponsorshipMarketplaceProps) {
  const [activeTab, setActiveTab] = useState<'AVAILABLE' | 'MY INVESTMENTS' | 'MY BACKERS'>(
    'AVAILABLE'
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stakeAmounts, setStakeAmounts] = useState<Record<string, string>>({});

  const handleStakeAmountChange = (id: string, value: string) => {
    setStakeAmounts((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div className="min-h-screen bg-[#0a0f16] text-slate-300 font-sans selection:bg-cyan-500/30">
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
                <Users className="w-6 h-6 text-cyan-400" />
                Staking Marketplace
              </h1>
              <p className="text-xs font-mono text-cyan-400/70 uppercase tracking-wider">
                Back Players, Share Profits
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider text-sm transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            List for Backing
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 bg-black/40 p-1 rounded-xl border border-white/5 w-fit mb-8">
          {['AVAILABLE', 'MY INVESTMENTS', 'MY BACKERS'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'AVAILABLE' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_AVAILABLE.map((item) => (
                  <div
                    key={item.id}
                    className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-colors group"
                  >
                    {/* Player Info */}
                    <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full border-2 border-cyan-500/30 overflow-hidden bg-black">
                          <img
                            src={item.player.avatar}
                            alt={item.player.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-black italic text-white uppercase tracking-wider">
                            {item.player.name}
                          </h3>
                          <button className="text-xs text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1">
                            View Profile <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-black/50 rounded-lg p-2 text-center border border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                            Win Rate
                          </p>
                          <p className="text-sm font-mono text-white">{item.player.winRate}</p>
                        </div>
                        <div className="bg-black/50 rounded-lg p-2 text-center border border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                            Tourney ROI
                          </p>
                          <p className="text-sm font-mono text-emerald-400">{item.player.roi}</p>
                        </div>
                        <div className="bg-black/50 rounded-lg p-2 text-center border border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                            Hands
                          </p>
                          <p className="text-sm font-mono text-white">{item.player.handsPlayed}</p>
                        </div>
                      </div>
                    </div>

                    {/* Opportunity Details */}
                    <div className="p-6 space-y-4">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                          Tournament
                        </p>
                        <p className="text-sm font-bold text-white tracking-wide">
                          {item.tournament} — ${item.buyIn} Buy-in
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                            Asking
                          </p>
                          <p className="text-sm font-mono text-white">
                            ${item.askingAmount} of ${item.buyIn}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            ({Math.round((item.askingAmount / item.buyIn) * 100)}% backed)
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                            Markup
                          </p>
                          <p className="text-sm font-mono text-amber-400">{item.markup}x</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Pay ${(100 * item.markup).toFixed(0)} for $100 action
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-end mb-1">
                          <p className="text-[10px] text-slate-500 uppercase font-bold">
                            ROI History (Last 10)
                          </p>
                          <p className="text-[10px] text-cyan-400 font-mono">Trending Up</p>
                        </div>
                        <div className="h-10 bg-black/50 rounded-lg border border-white/5 p-2">
                          <Sparkline data={item.history} />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs text-slate-400">
                            Remaining:{' '}
                            <span className="font-mono text-white">${item.remainingShares}</span>
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono">
                              $
                            </span>
                            <input
                              type="number"
                              placeholder="100"
                              value={stakeAmounts[item.id] || ''}
                              onChange={(e) => handleStakeAmountChange(item.id, e.target.value)}
                              className="w-full bg-black/50 border border-white/10 rounded-xl pl-7 pr-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                            />
                          </div>
                          <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors whitespace-nowrap">
                            Stake
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'MY INVESTMENTS' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {MOCK_INVESTMENTS.map((inv) => (
                  <div
                    key={inv.id}
                    className="bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                  >
                    <div>
                      <h3 className="text-lg font-black italic text-white uppercase tracking-wider mb-1">
                        {inv.player}
                      </h3>
                      <p className="text-sm text-slate-400 mb-4">{inv.tournament}</p>

                      <div className="flex gap-6">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                            Invested
                          </p>
                          <p className="text-sm font-mono text-white">${inv.invested}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                            Expected Return
                          </p>
                          <p
                            className={`text-sm font-mono ${inv.expectedReturn > inv.invested ? 'text-emerald-400' : inv.expectedReturn === 0 ? 'text-slate-500' : 'text-amber-400'}`}
                          >
                            ${inv.expectedReturn}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto bg-black/30 p-4 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-bold text-white">{inv.status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          className={`w-4 h-4 ${inv.settlement === 'Settled' ? 'text-emerald-400' : 'text-amber-400'}`}
                        />
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${inv.settlement === 'Settled' ? 'text-emerald-400' : 'text-amber-400'}`}
                        >
                          {inv.settlement}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'MY BACKERS' && (
              <div className="grid grid-cols-1 gap-4">
                {MOCK_BACKERS.map((backer) => (
                  <div
                    key={backer.id}
                    className="bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-black italic text-white uppercase tracking-wider mb-2">
                        {backer.tournament}
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 max-w-xs">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                            <span className="text-slate-400">Funded</span>
                            <span className="text-cyan-400">
                              ${backer.funded} / ${backer.amountNeeded}
                            </span>
                          </div>
                          <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                            <div
                              className="h-full bg-cyan-500 rounded-full"
                              style={{ width: `${(backer.funded / backer.amountNeeded) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="bg-black/30 px-4 py-2 rounded-lg border border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                          Status
                        </p>
                        <p
                          className={`text-xs font-bold uppercase tracking-wider ${backer.status === 'Funded' ? 'text-emerald-400' : 'text-cyan-400'}`}
                        >
                          {backer.status}
                        </p>
                      </div>
                      <div className="bg-black/30 px-4 py-2 rounded-lg border border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                          Claims
                        </p>
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                          {backer.claims}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Create Listing Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0a0f16] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
                <h2 className="text-xl font-black italic uppercase tracking-wider text-white">
                  List for Backing
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Select Tournament
                  </label>
                  <select className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50 appearance-none">
                    <option>NEURAL SPRINT #42 — $500 Buy-in</option>
                    <option>WEEKLY HIGH ROLLER — $1000 Buy-in</option>
                    <option>MAIN EVENT SATELLITE — $250 Buy-in</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Amount Needed
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono">
                        $
                      </span>
                      <input
                        type="number"
                        placeholder="400"
                        className="w-full bg-black/50 border border-white/10 rounded-xl pl-7 pr-3 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Markup
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="1.1"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono">
                        x
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Description (Optional)
                  </label>
                  <textarea
                    placeholder="Why should investors back you?"
                    rows={3}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 resize-none"
                  />
                </div>

                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black italic uppercase tracking-widest transition-all mt-2"
                >
                  Create Listing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
