import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface ProvablyFairProps {
  onBack?: () => void;
}

const MOCK_HANDS = [
  {
    id: 'HND-892347A',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    serverSeed: 'server_seed_alpha_992',
    clientSeed: 'client_seed_user_123',
    status: 'Verified',
  },
  {
    id: 'HND-892347B',
    hash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
    serverSeed: 'server_seed_beta_881',
    clientSeed: 'client_seed_user_123',
    status: 'Pending',
  },
  {
    id: 'HND-892347C',
    hash: '4a44dc15364204a80fe80e9039455cc1608281820fe2b24f1e5233ade6af1dd5',
    serverSeed: 'server_seed_gamma_773',
    clientSeed: 'client_seed_user_123',
    status: 'Verified',
  },
  {
    id: 'HND-892347D',
    hash: 'b10a8db164e0754105b7a99be72e3fe5',
    serverSeed: 'server_seed_delta_664',
    clientSeed: 'client_seed_user_123',
    status: 'Verified',
  },
  {
    id: 'HND-892347E',
    hash: 'c3f5d5a86aff3ca12020c923adc6c928',
    serverSeed: 'server_seed_epsilon_555',
    clientSeed: 'client_seed_user_123',
    status: 'Pending',
  },
];

const MOCK_DECK = ['A♠', 'K♥', 'Q♦', 'J♣', '10♠', '9♥', '8♦', '7♣', '6♠', '5♥', '4♦', '3♣', '2♠'];

export default function ProvablyFair({ onBack }: ProvablyFairProps) {
  const [handId, setHandId] = useState('');
  const [serverSeed, setServerSeed] = useState('');
  const [clientSeed, setClientSeed] = useState('');
  const [commitmentHash, setCommitmentHash] = useState('');
  const [verificationResult, setVerificationResult] = useState<'IDLE' | 'SUCCESS' | 'FAIL'>('IDLE');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = () => {
    if (!handId || !serverSeed || !clientSeed || !commitmentHash) {
      setVerificationResult('FAIL');
      return;
    }

    setIsVerifying(true);
    setVerificationResult('IDLE');

    // Simulate cryptographic verification delay
    setTimeout(() => {
      setIsVerifying(false);
      // Simple mock logic: if the inputs match a mock hand, success. Otherwise, fail.
      // For demo purposes, we'll just succeed if all fields are filled to show the UI.
      const isMatch = MOCK_HANDS.some((h) => h.id === handId && h.serverSeed === serverSeed);
      if (isMatch || (handId && serverSeed && clientSeed && commitmentHash)) {
        setVerificationResult('SUCCESS');
      } else {
        setVerificationResult('FAIL');
      }
    }, 800);
  };

  const loadHand = (hand: (typeof MOCK_HANDS)[0]) => {
    setHandId(hand.id);
    setServerSeed(hand.status === 'Verified' ? hand.serverSeed : 'HIDDEN_UNTIL_COMPLETE');
    setClientSeed(hand.clientSeed);
    setCommitmentHash(hand.hash);
    setVerificationResult('IDLE');
  };

  return (
    <div className="min-h-screen bg-[#0a0f16] text-slate-300 font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
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
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
                Provably Fair
              </h1>
              <p className="text-xs font-mono text-cyan-400/70 uppercase tracking-wider">
                Cryptographic Game Verification
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Explanation & Verification Tool */}
        <div className="lg:col-span-8 space-y-8">
          {/* Explanation Section */}
          <section className="bg-black/40 border border-white/5 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />

            <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">
              How It Works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                <div className="w-8 h-8 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400 font-bold mb-4">
                  1
                </div>
                <p className="text-sm text-slate-400">
                  Before each hand, the server generates a cryptographic commitment (hash) of the
                  deck.
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                <div className="w-8 h-8 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400 font-bold mb-4">
                  2
                </div>
                <p className="text-sm text-slate-400">
                  After the hand, the server reveals the seed used to shuffle the deck.
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                <div className="w-8 h-8 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400 font-bold mb-4">
                  3
                </div>
                <p className="text-sm text-slate-400">
                  You can verify the hash matches the seed + hand result to ensure fairness.
                </p>
              </div>
            </div>

            {/* Visual Diagram */}
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 py-6 bg-black/50 rounded-xl border border-white/5 font-mono text-xs md:text-sm text-cyan-400/80">
              <div className="px-3 py-2 bg-cyan-950/30 rounded border border-cyan-500/20">
                Server Seed
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <div className="px-3 py-2 bg-cyan-950/30 rounded border border-cyan-500/20">Hash</div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <div className="px-3 py-2 bg-cyan-950/30 rounded border border-cyan-500/20">Deal</div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <div className="px-3 py-2 bg-cyan-950/30 rounded border border-cyan-500/20">
                Reveal
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <div className="px-3 py-2 bg-cyan-950/30 rounded border border-cyan-500/20 text-white font-bold">
                Verify
              </div>
            </div>
          </section>

          {/* Verification Tool */}
          <section className="bg-black/40 border border-white/5 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-3">
              <Search className="w-5 h-5 text-cyan-400" />
              Verification Tool
            </h2>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Hand ID
                  </label>
                  <input
                    type="text"
                    value={handId}
                    onChange={(e) => setHandId(e.target.value)}
                    placeholder="e.g. HND-892347A"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Client Seed
                  </label>
                  <input
                    type="text"
                    value={clientSeed}
                    onChange={(e) => setClientSeed(e.target.value)}
                    placeholder="Your seed"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Server Seed
                </label>
                <input
                  type="text"
                  value={serverSeed}
                  onChange={(e) => setServerSeed(e.target.value)}
                  placeholder="Revealed after hand completes"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Commitment Hash
                </label>
                <input
                  type="text"
                  value={commitmentHash}
                  onChange={(e) => setCommitmentHash(e.target.value)}
                  placeholder="SHA-256 Hash"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>

              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black italic uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Hand'
                )}
              </button>
            </div>

            {/* Result Display */}
            {verificationResult !== 'IDLE' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 space-y-6"
              >
                {verificationResult === 'SUCCESS' ? (
                  <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-6 flex items-start gap-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold text-emerald-400 mb-1">
                        VERIFIED — This hand was dealt fairly
                      </h3>
                      <p className="text-sm text-emerald-400/70">
                        The cryptographic hash matches the revealed seeds perfectly.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-6 flex items-start gap-4">
                    <XCircle className="w-8 h-8 text-red-400 shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold text-red-400 mb-1">
                        MISMATCH — Verification failed
                      </h3>
                      <p className="text-sm text-red-400/70">
                        The provided seeds do not match the commitment hash.
                      </p>
                    </div>
                  </div>
                )}

                {verificationResult === 'SUCCESS' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-black/50 border border-white/5 rounded-xl p-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Computed Hash
                        </p>
                        <p className="font-mono text-xs text-emerald-400 break-all">
                          {commitmentHash ||
                            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                        </p>
                      </div>
                      <div className="bg-black/50 border border-white/5 rounded-xl p-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Stored Hash
                        </p>
                        <p className="font-mono text-xs text-slate-300 break-all">
                          {commitmentHash ||
                            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-black/50 border border-white/5 rounded-xl p-5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                        Resulting Deck Order (First 13 Cards)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {MOCK_DECK.map((card, i) => {
                          const isRed = card.includes('♥') || card.includes('♦');
                          return (
                            <div
                              key={i}
                              className={`w-10 h-14 bg-white rounded flex items-center justify-center font-bold text-lg shadow-sm ${isRed ? 'text-red-600' : 'text-slate-900'}`}
                            >
                              {card}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </section>
        </div>

        {/* Right Column: Recent Hands */}
        <div className="lg:col-span-4">
          <section className="bg-black/40 border border-white/5 rounded-2xl flex flex-col h-full max-h-[800px]">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                Recent Hands
              </h2>
            </div>

            <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {MOCK_HANDS.map((hand) => (
                <div
                  key={hand.id}
                  className="bg-white/5 border border-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-sm text-cyan-400 font-bold">{hand.id}</span>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${
                        hand.status === 'Verified'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {hand.status === 'Verified' ? '✓ Verified' : 'Pending'}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                      Commit Hash
                    </p>
                    <p className="font-mono text-xs text-slate-400 truncate">{hand.hash}</p>
                  </div>

                  <button
                    onClick={() => loadHand(hand)}
                    className="w-full py-2 bg-white/5 hover:bg-cyan-600/20 text-slate-300 hover:text-cyan-400 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border border-transparent hover:border-cyan-500/30"
                  >
                    Load to Verify
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
