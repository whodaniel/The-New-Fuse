import { ArrowDownLeft, ArrowUpRight, CheckCircle, Clock, Send, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface CashierPageProps {
  balance: number;
  onBack: () => void;
}

const MOCK_TRANSACTIONS = [
  {
    id: 'tx1',
    date: '2026-03-06 10:15',
    type: 'Table Buy-In',
    amount: -500,
    balanceAfter: 99500,
    status: 'Completed',
  },
  {
    id: 'tx2',
    date: '2026-03-06 11:30',
    type: 'Table Cash-Out',
    amount: 1250,
    balanceAfter: 100750,
    status: 'Completed',
  },
  {
    id: 'tx3',
    date: '2026-03-05 14:00',
    type: 'Tournament Entry',
    amount: -110,
    balanceAfter: 99640,
    status: 'Completed',
  },
  {
    id: 'tx4',
    date: '2026-03-05 18:45',
    type: 'Prize Won',
    amount: 600,
    balanceAfter: 100240,
    status: 'Completed',
  },
  {
    id: 'tx5',
    date: '2026-03-04 09:00',
    type: 'Deposit',
    amount: 100000,
    balanceAfter: 100000,
    status: 'Completed',
  },
];

export default function CashierPage({ balance, onBack }: CashierPageProps) {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

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

      <main className="p-6 sm:p-12 max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-black italic text-white uppercase tracking-tighter mb-2">
            Asset Vault
          </h2>
          <p className="text-sm font-black text-cyan-400 uppercase tracking-widest">
            Manage Your Currency
          </p>
        </div>

        {/* Balance Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0a0c1a]/80 backdrop-blur-md border border-cyan-900/50 rounded-[40px] p-12 text-center mb-12 shadow-[0_0_50px_rgba(0,242,255,0.1)] relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />

          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
            <p className="text-sm sm:text-base font-black uppercase tracking-widest text-green-400">
              Available Balance
            </p>
          </div>
          <h3 className="text-7xl sm:text-9xl font-mono text-white font-black mb-8 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            ${balance.toLocaleString()}
          </h3>

          <div className="flex flex-wrap justify-center gap-6 sm:gap-12 text-sm sm:text-base font-mono bg-black/40 inline-flex px-8 py-4 rounded-full border border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Total:</span>
              <span className="text-cyan-400 font-bold">${balance.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">In Play:</span>
              <span className="text-amber-400 font-bold">$0</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Reserved:</span>
              <span className="text-slate-300 font-bold">$0</span>
            </div>
          </div>
        </motion.div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Deposit */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#0a0c1a]/80 backdrop-blur-md border border-white/5 rounded-3xl p-8 hover:border-cyan-900/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-900/30 rounded-xl flex items-center justify-center border border-green-500/30">
                <ArrowDownLeft className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-xl font-black italic uppercase text-white">Deposit</h3>
            </div>

            <input
              type="number"
              placeholder="Amount..."
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full bg-black/60 border border-slate-800 focus:border-green-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors mb-4"
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[1000, 5000, 10000, 50000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setDepositAmount(amt.toString())}
                  className="py-3 bg-green-900/20 border border-green-500/30 rounded-xl text-sm font-black font-mono text-green-400 hover:bg-green-500 hover:text-black hover:shadow-[0_0_15px_rgba(74,222,128,0.4)] transition-all"
                >
                  +${amt / 1000}K
                </button>
              ))}
            </div>

            <button className="w-full py-4 bg-green-600 rounded-xl font-black italic uppercase tracking-widest text-white border-b-4 border-green-800 hover:brightness-125 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_15px_rgba(74,222,128,0.2)]">
              Deposit Funds
            </button>
          </motion.div>

          {/* Withdraw */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0a0c1a]/80 backdrop-blur-md border border-white/5 rounded-3xl p-8 hover:border-cyan-900/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-cyan-900/30 rounded-xl flex items-center justify-center border border-cyan-500/30">
                <ArrowUpRight className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-xl font-black italic uppercase text-white">Withdraw</h3>
            </div>

            <input
              type="number"
              placeholder="Amount..."
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors mb-4"
            />

            <div className="flex justify-between items-center mb-6 text-xs font-mono text-slate-400">
              <span>
                Available: <span className="text-white">${balance.toLocaleString()}</span>
              </span>
              <span className="text-cyan-400">Max</span>
            </div>

            <button className="w-full py-4 bg-cyan-600 rounded-xl font-black italic uppercase tracking-widest text-white border-b-4 border-cyan-800 hover:brightness-125 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_15px_rgba(0,242,255,0.2)] mb-3">
              Request Withdrawal
            </button>
            <p className="text-[10px] text-center text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" /> Processing time: Instant for play credits
            </p>
          </motion.div>

          {/* Transfer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#0a0c1a]/80 backdrop-blur-md border border-white/5 rounded-3xl p-8 hover:border-cyan-900/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-900/30 rounded-xl flex items-center justify-center border border-purple-500/30">
                <Send className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-xl font-black italic uppercase text-white">Transfer</h3>
            </div>

            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="To Player (Callsign)..."
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                className="w-full bg-black/60 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors"
              />
              <input
                type="number"
                placeholder="Amount..."
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full bg-black/60 border border-slate-800 focus:border-purple-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors"
              />
            </div>

            <button className="w-full py-4 bg-purple-600 rounded-xl font-black italic uppercase tracking-widest text-white border-b-4 border-purple-800 hover:brightness-125 active:border-b-0 active:translate-y-1 transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              Send Funds
            </button>
          </motion.div>

          {/* Attestation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#0a0c1a]/80 backdrop-blur-md border border-white/5 rounded-3xl p-8 hover:border-cyan-900/50 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                  <Shield className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="text-xl font-black italic uppercase text-white">
                  Token Attestation
                </h3>
              </div>

              <div className="bg-black/40 rounded-xl p-4 border border-white/5 mb-6 space-y-2">
                <div className="flex justify-between items-center text-sm font-mono">
                  <span className="text-slate-500">Verified Reserve:</span>
                  <span className="text-cyan-400 font-bold">${balance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-500">Last Attestation:</span>
                  <span className="text-slate-300">2 hours ago</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-500">Status:</span>
                  <span className="text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Valid
                  </span>
                </div>
              </div>
            </div>

            <button className="w-full py-4 bg-slate-800 rounded-xl font-black italic uppercase tracking-widest text-white border-b-4 border-slate-900 hover:bg-slate-700 active:border-b-0 active:translate-y-1 transition-all">
              Verify Reserve
            </button>
          </motion.div>
        </div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#0a0c1a]/80 backdrop-blur-md border border-white/5 rounded-3xl p-8 overflow-hidden"
        >
          <h3 className="text-xl font-black italic uppercase text-white mb-6">
            Transaction History
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Date
                  </th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Type
                  </th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">
                    Amount
                  </th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">
                    Balance After
                  </th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="font-mono text-sm">
                {MOCK_TRANSACTIONS.map((tx, i) => (
                  <tr
                    key={tx.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 text-slate-400">{tx.date}</td>
                    <td className="py-4 text-white">{tx.type}</td>
                    <td
                      className={`py-4 text-right font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {tx.amount > 0 ? '+' : ''}
                      {tx.amount}
                    </td>
                    <td className="py-4 text-right text-slate-300">
                      ${tx.balanceAfter.toLocaleString()}
                    </td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-900/30 text-green-400 border border-green-500/30 rounded text-xs">
                        <CheckCircle className="w-3 h-3" /> {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-center">
            <button className="px-6 py-2 bg-slate-900 rounded-lg text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors border border-slate-800">
              Load More
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
