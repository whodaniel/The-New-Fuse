import { motion } from 'framer-motion';
import { Shield, Sparkles } from 'lucide-react';
import React, { useState } from 'react';

interface SessionLoginProps {
  onLogin: (username: string, avatarUrl: string, email?: string) => void;
}

const AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=cypher1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=cypher2',
  'https://api.dicebear.com/7.x/bottts/svg?seed=cypher3',
  'https://api.dicebear.com/7.x/bottts/svg?seed=cypher4',
  'https://api.dicebear.com/7.x/bottts/svg?seed=cypher5',
  'https://api.dicebear.com/7.x/bottts/svg?seed=cypher6',
];

export default function SessionLogin({ onLogin }: SessionLoginProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3 || username.length > 16) {
      setError('Callsign must be 3-16 characters.');
      return;
    }
    setError('');
    onLogin(username, selectedAvatar, email.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#020308]/80 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#0a0c1a]/90 backdrop-blur-xl border border-cyan-900/50 rounded-[40px] p-8 pr-6 shadow-[0_0_50px_rgba(0,242,255,0.1)] relative"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-cyan-900/30 rounded-2xl flex items-center justify-center border border-cyan-500/30 shadow-[0_0_20px_rgba(0,242,255,0.2)] mb-4">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter text-center">
            Initialize Protocol
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <button
            type="button"
            onClick={() => window.open('https://thenewfuse.com/auth/login', '_blank')}
            className="w-full py-4 bg-indigo-600/20 text-indigo-400 rounded-2xl font-black uppercase tracking-widest border border-indigo-500/50 hover:bg-indigo-600/30 transition-all flex items-center justify-center gap-3 group mb-2"
          >
            <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(99,102,241,0.6)]">
              <Shield className="w-4 h-4 text-white fill-current" />
            </div>
            Connect thenewfuse.com
          </button>

          <div className="flex items-center gap-4 my-2">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-[10px] font-black text-slate-600">OR ANONYMOUS ACCESS</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Agent Callsign
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your callsign..."
              className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors"
            />
            {error && <p className="text-red-400 text-xs mt-2 font-mono">{error}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Member Email (Optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="For membership and creator access checks"
              className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Neural Identity
            </label>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {AVATARS.map((avatar) => (
                <div
                  key={avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`cursor-pointer rounded-full overflow-hidden border-2 transition-all ${selectedAvatar === avatar ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,242,255,0.4)] scale-105' : 'border-slate-800 opacity-50 hover:opacity-100'}`}
                >
                  <img src={avatar} alt="Avatar" className="w-full h-auto" />
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled
              className="w-full py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
            >
              <Sparkles className="w-3 h-3" /> Generate AI Avatar
            </button>
          </div>

          <div className="text-center py-4 border-t border-slate-800">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
              Starting Balance
            </p>
            <p className="text-3xl font-mono text-cyan-400 font-bold drop-shadow-[0_0_10px_rgba(0,242,255,0.3)]">
              $100,000
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-cyan-600 rounded-2xl font-black italic uppercase tracking-widest text-white border-b-4 border-cyan-800 hover:brightness-125 active:border-b-0 active:translate-y-1 transition-all"
          >
            Jack In
          </button>
        </form>
      </motion.div>
    </div>
  );
}
