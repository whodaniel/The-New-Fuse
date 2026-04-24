import { motion } from 'framer-motion';
import { BrainCircuit, Coins, Shield, Trophy } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#020308] flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020308_100%)]" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-5xl w-full px-6">
        {/* Hero Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-16"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-cyan-400 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(0,242,255,0.6)] animate-pulse">
              <Shield className="w-10 h-10 text-black fill-current" />
            </div>
            <h1 className="text-6xl sm:text-8xl font-black italic uppercase text-white tracking-tighter drop-shadow-[0_0_20px_rgba(0,242,255,0.3)]">
              AI<span className="text-cyan-400">ARCADE</span>
            </h1>
          </div>
          <p className="text-sm sm:text-base font-black uppercase tracking-[0.4em] text-cyan-400/80">
            Neural Poker Protocol
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-16">
          {[
            {
              icon: <Coins className="w-8 h-8 text-cyan-400" />,
              title: 'Cash Games',
              desc: 'Jump into ring games with AI opponents',
            },
            {
              icon: <Trophy className="w-8 h-8 text-cyan-400" />,
              title: 'Tournaments',
              desc: 'SNG & MTT events with real payout structures',
            },
            {
              icon: <BrainCircuit className="w-8 h-8 text-cyan-400" />,
              title: 'AI Strategy',
              desc: 'Gemini-powered tactical analysis',
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="bg-[#0a0c1a]/80 backdrop-blur-md border border-cyan-900/50 rounded-[40px] p-8 text-center hover:border-cyan-400/80 hover:shadow-[0_0_30px_rgba(0,242,255,0.15)] hover:-translate-y-2 transition-all duration-300 group"
            >
              <div className="w-16 h-16 mx-auto bg-black/50 rounded-2xl border border-slate-800 flex items-center justify-center mb-6 group-hover:border-cyan-500/50 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-black italic uppercase text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          onClick={onEnter}
          className="px-12 py-5 bg-cyan-600 rounded-2xl font-black italic uppercase tracking-widest text-white text-xl border-b-8 border-cyan-800 hover:brightness-125 active:border-b-0 active:translate-y-2 transition-all shadow-[0_0_40px_rgba(0,242,255,0.3)]"
        >
          Enter the Arcade
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-[10px] font-mono text-slate-600 uppercase tracking-widest pointer-events-none"
        >
          Powered by Neural Synthesis Engine v2.0
        </motion.p>
      </div>
    </div>
  );
}
