import { AnimatePresence, motion } from 'framer-motion';
import {
  BrainCircuit,
  Loader2,
  LogOut,
  Music,
  Plus,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import {
  agentApi,
  api,
  communityApi,
  CommunityMembership,
  mttApi,
  pokerApi,
  sngApi,
  userBotsApi,
} from './api';

// Import Contexts & Components
import { BotOrchestration } from './components/BotOrchestration';
import CashTableBrowser from './components/CashTableBrowser';
import CashierPage from './components/CashierPage';
import CommunityAppsPage from './components/CommunityAppsPage';
import HandHistory from './components/HandHistory';
import HandReplayer from './components/HandReplayer';
import LandingPage from './components/LandingPage';
import Leaderboard from './components/Leaderboard';
import LobbyPage from './components/LobbyPage';
import MttCreatorModal from './components/MttCreatorModal';
import PlayerProfile from './components/PlayerProfile';
import ProvablyFair from './components/ProvablyFair';
import SessionLogin from './components/SessionLogin';
import SettingsPage from './components/SettingsPage';
import SngCreatorModal from './components/SngCreatorModal';
import SponsorshipMarketplace from './components/SponsorshipMarketplace';
import TournamentLobby from './components/TournamentLobby';
import TournamentResults from './components/TournamentResults';
import TournamentTableView from './components/TournamentTableView';
import { GameAudioProvider, useGameAudio } from './contexts/GameAudioContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import {
  canAccessPokerSurface,
  derivePokerAccess,
  type PokerSurfaceGroup,
} from './security/accessPolicy';
import {
  getAllowedLobbyViews,
  getControlCenterSections,
  ROUTE_SURFACE_POLICY,
  type PokerRouteView,
} from './security/controlRegistry';

// --- BOT PROFILES ---
const BOT_PROFILES = [
  {
    id: 'agent-1',
    name: 'CYBER-9',
    temperament: 'tight_aggressive',
    style: 'TAG Shark',
    riskBps: 600,
    avatar: '/avatars/bot_1.png',
  },
  {
    id: 'agent-2',
    name: 'GHOST',
    temperament: 'loose_aggressive',
    style: 'LAG Maniac',
    riskBps: 1200,
    avatar: '/avatars/bot_2.png',
  },
  {
    id: 'agent-3',
    name: 'V-SYNC',
    temperament: 'tight_passive',
    style: 'Nit Rock',
    riskBps: 400,
    avatar: '/avatars/bot_3.png',
  },
  {
    id: 'agent-4',
    name: 'NULLSEC',
    temperament: 'balanced',
    style: 'GTO Solver',
    riskBps: 800,
    avatar: '/avatars/bot_4.png',
  },
  {
    id: 'agent-5',
    name: 'PROXY',
    temperament: 'loose_aggressive',
    style: 'Bluff Engine',
    riskBps: 1000,
    avatar: '/avatars/bot_5.png',
  },
];

const BOT_PROFILE_BY_ID = new Map(BOT_PROFILES.map((bot) => [bot.id, bot]));

const THEME = {
  felt: 'bg-[radial-gradient(circle_at_center,_#1a472a_0%,_#0d2b1a_100%)]',
  metal: 'bg-gradient-to-b from-slate-800 to-slate-900',
  wood: 'bg-[#3d1f1f]',
};

const BOT_TOURNAMENT_STARTING_STACK = 3000;
const BOT_TOURNAMENT_TABLE_ID_PREFIX = 'bot-table';
const ACTION_TAPE_INTERVAL_MS = 650;
const USER_BOT_STORAGE_KEY = 'aiArcadeUserBots';
const SYSTEM_BOT_STORAGE_KEY = 'aiArcadeSystemBots';

type UserBotProfile = {
  name: string;
  temperament: string;
  riskBps: number;
  aiAssist?: boolean;
};

const loadUserBots = (): UserBotProfile[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(USER_BOT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((bot) => bot && typeof bot.name === 'string')
      .map((bot) => ({
        name:
          String(bot.name || '')
            .trim()
            .slice(0, 18) || 'CUSTOM',
        temperament: String(bot.temperament || 'balanced'),
        riskBps: Math.max(100, Math.min(2000, Number(bot.riskBps || 800))),
        aiAssist: Boolean(bot.aiAssist),
      }));
  } catch {
    return [];
  }
};

const loadSystemBots = (): any[] => {
  if (typeof window === 'undefined') return BOT_PROFILES;
  try {
    const raw = window.localStorage.getItem(SYSTEM_BOT_STORAGE_KEY);
    if (!raw) return BOT_PROFILES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : BOT_PROFILES;
  } catch {
    return BOT_PROFILES;
  }
};

const formatBotId = (name: string, index: number) => {
  const base = name.trim() || `CUSTOM_${index + 1}`;
  const slug = base
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .slice(0, 16);
  return slug || `CUSTOM_${index + 1}`;
};

type PokerView = PokerRouteView;

const VIEW_SURFACE_POLICY: Record<PokerView, PokerSurfaceGroup> = ROUTE_SURFACE_POLICY;

// --- MINI COMPONENTS ---
const Card: React.FC<{ val?: string; hidden?: boolean; index?: number }> = ({
  val,
  hidden,
  index = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: -20, rotateY: 180 }}
    animate={{ opacity: 1, y: 0, rotateY: 0 }}
    transition={{ duration: 0.4, delay: index * 0.1, type: 'spring' }}
    className={`w-14 h-20 sm:w-20 sm:h-28 rounded-lg border-2 ${hidden ? 'bg-[url("https://www.transparenttextures.com/patterns/carbon-fibre.png")] bg-[#0a0c1a] border-cyan-500/50 shadow-[0_0_20px_rgba(0,242,255,0.2)]' : 'bg-white border-slate-200 shadow-xl'} flex items-center justify-center font-black relative overflow-hidden z-10`}
  >
    {hidden && (
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent" />
    )}
    {!hidden && val ? (
      <span
        className={`text-xl sm:text-3xl ${val.endsWith('h') || val.endsWith('d') ? 'text-[#FF0055]' : 'text-slate-900'}`}
      >
        {val.slice(0, -1)}
        <span className="text-sm sm:text-lg">
          {val.endsWith('h') ? '♥' : val.endsWith('d') ? '♦' : val.endsWith('c') ? '♣' : '♠'}
        </span>
      </span>
    ) : null}
  </motion.div>
);

const ChipStack = ({ amount }: { amount: number }) => {
  if (!amount || amount <= 0) return null;
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex flex-col items-center gap-1"
    >
      <div className="flex -space-y-2 flex-col-reverse">
        {[...Array(Math.min(5, Math.ceil(amount / 1000)))].map((_, i) => (
          <div
            key={i}
            className="w-8 h-3 rounded-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 border border-yellow-800 shadow-md transform rotate-x-60"
          />
        ))}
      </div>
      <div className="bg-black/80 px-3 py-1 rounded-full border border-cyan-400/30 shadow-[0_0_10px_rgba(0,242,255,0.2)]">
        <span className="text-[10px] font-mono text-cyan-400 font-bold">
          ${amount.toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
};

// --- SUB-COMPONENTS ---

interface PokerTableProps {
  gameState: any;
  actionTape: any;
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  toggleBgm: () => void;
  toggleSfx: () => void;
  playHover: () => void;
  handleAction: (action: string, amount?: number) => void;
  getAIInsight: () => void;
  aiInsight: string;
  setAiInsight: (v: string) => void;
  isAnalyzing: boolean;
}

const PokerTable: React.FC<PokerTableProps> = ({
  gameState,
  actionTape,
  bgmEnabled,
  sfxEnabled,
  toggleBgm,
  toggleSfx,
  playHover,
  handleAction,
  getAIInsight,
  aiInsight,
  setAiInsight,
  isAnalyzing,
}) => {
  if (!gameState)
    return (
      <div className="flex items-center justify-center h-full text-cyan-400">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );

  const mySeatIdx = gameState.seats.findIndex((s: any) => s.isHero);
  const mySeat = gameState.seats[mySeatIdx] || { cards: [], bet: 0, stack: 0 };
  const isMyTurn =
    gameState.turnIndex === mySeatIdx &&
    gameState.round !== 'WAITING' &&
    gameState.round !== 'SHOWDOWN';

  const getSeatPos = (i: number) => {
    const offset = mySeatIdx !== -1 ? (i - mySeatIdx + 9) % 9 : i;
    const a = (offset / 9) * 2 * Math.PI + Math.PI / 2;
    return { left: `${50 + 40 * Math.cos(a)}%`, top: `${50 + 38 * Math.sin(a)}%` };
  };

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-[#020308]">
      {/* Top Overlay: Audio & Tape */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={toggleBgm}
          className={`p-2 rounded-lg transition-colors ${bgmEnabled ? 'text-cyan-400 bg-cyan-900/30' : 'text-slate-500 hover:text-slate-300 bg-black/40'}`}
        >
          <Music className="w-4 h-4" />
        </button>
        <button
          onClick={toggleSfx}
          className={`p-2 rounded-lg transition-colors ${sfxEnabled ? 'text-cyan-400 bg-cyan-900/30' : 'text-slate-500 hover:text-slate-300 bg-black/40'}`}
        >
          {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      <div className="absolute top-4 left-4 z-40 w-[240px] max-h-[30%] rounded-xl border border-cyan-500/30 bg-black/70 backdrop-blur-sm p-3 overflow-hidden shadow-2xl hidden lg:block">
        <p className="text-[10px] text-cyan-300 uppercase tracking-[0.2em] font-black mb-2">
          Action Tape
        </p>
        <div className="space-y-1 overflow-y-auto max-h-[calc(100%-24px)] pr-1 custom-scrollbar">
          {actionTape.feed.length === 0 && (
            <p className="text-[10px] text-slate-500 italic">Awaiting tactical data...</p>
          )}
          {actionTape.feed.map((entry: any) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[10px] font-mono text-slate-300 rounded bg-white/5 px-2 py-1 border border-white/5"
            >
              {entry.text}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 relative flex items-center justify-center p-4 sm:p-10 z-10">
        <div
          className={`relative w-full max-w-6xl aspect-[2.2/1] sm:aspect-[2.4/1] ${THEME.metal} rounded-[200px] border-4 border-[#1a1c23] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center justify-center`}
        >
          <div className="absolute inset-0 rounded-[200px] shadow-[inset_0_0_30px_rgba(0,242,255,0.1)] pointer-events-none" />

          <div className="w-full h-full m-3 sm:m-4 bg-[#0d0f14] rounded-[190px] relative flex items-center justify-center overflow-hidden">
            <div
              className={`w-full h-full rounded-[180px] ${THEME.felt} border-[6px] border-[#0a0c1a] shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center relative`}
            >
              <div className="z-20 text-center mb-2 sm:mb-6 flex flex-col items-center">
                <ChipStack amount={gameState.pot} />
                <motion.p
                  key={gameState.pot}
                  initial={{ scale: 1.5, color: '#FFFFFF' }}
                  animate={{ scale: 1, color: '#00f2ff' }}
                  className="text-xl sm:text-4xl font-mono font-black mt-2 drop-shadow-[0_0_10px_rgba(0,242,255,0.5)]"
                >
                  ${(gameState.pot || 0).toLocaleString()}
                </motion.p>
                <p className="text-[8px] sm:text-[10px] text-slate-500 uppercase tracking-[0.3em] mt-1">
                  Main Pot
                </p>
              </div>

              <div className="flex gap-2 sm:gap-4 z-[30] bg-black/40 p-2 sm:p-4 rounded-xl border border-white/10 backdrop-blur-xl shadow-2xl shadow-black/80">
                <AnimatePresence>
                  {(gameState.communityCards || []).map((c: string, i: number) => (
                    <Card key={`comm-${i}-${c}`} val={c} index={i} />
                  ))}
                </AnimatePresence>
                {[...Array(5 - (gameState.communityCards?.length || 0))].map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="w-14 h-20 sm:w-20 sm:h-28 border-2 border-white/5 rounded-lg bg-black/40 shadow-inner"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Seats Positioned on the Table Ring */}
          {gameState.seats.map((seat: any, i: number) => {
            const isSeatTurn =
              gameState.turnIndex === i &&
              gameState.round !== 'WAITING' &&
              gameState.round !== 'SHOWDOWN';
            const isDealer = gameState.dealerIndex === i;
            const pos = getSeatPos(i);
            const zIndex = 40 + Math.floor(parseFloat(String(pos.top)));

            return (
              <div
                key={seat.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
                style={{ ...pos, zIndex }}
              >
                {seat.active ? (
                  <div className="flex flex-col items-center gap-2 relative group">
                    {isDealer && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full border-2 border-slate-300 flex items-center justify-center shadow-lg z-50">
                        <span className="text-[10px] font-black text-black">D</span>
                      </div>
                    )}

                    {/* Opponent Cards: Elevated but subject to clipping if not careful. Giving them high z-index. */}
                    {seat.cards.length > 0 && !seat.folded && !seat.isHero && (
                      <div className="absolute -top-24 sm:-top-32 flex gap-1.5 transform scale-100 bg-[#0a0c1a]/80 p-1.5 rounded-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md z-[100]">
                        <Card
                          val={seat.cards[0] !== 'hidden' ? seat.cards[0] : undefined}
                          hidden={seat.cards[0] === 'hidden'}
                        />
                        <Card
                          val={seat.cards[1] !== 'hidden' ? seat.cards[1] : undefined}
                          hidden={seat.cards[1] === 'hidden'}
                        />
                      </div>
                    )}

                    <div
                      className={`relative w-14 h-14 sm:w-20 sm:h-20 rounded-full border-4 ${isSeatTurn ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,242,255,0.6)] scale-110' : seat.folded ? 'border-slate-800 opacity-50' : 'border-slate-700'} transition-all duration-300 overflow-hidden bg-[#0a0c1a]`}
                    >
                      <img
                        src={seat.avatar}
                        className="w-full h-full object-cover"
                        alt={seat.name}
                      />
                      {seat.folded && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-xs font-black text-red-500 rotate-[-15deg]">
                            FOLD
                          </span>
                        </div>
                      )}
                    </div>

                    <div
                      className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-md border-2 text-center min-w-[90px] sm:min-w-[120px] ${isSeatTurn ? 'bg-cyan-900/30 border-cyan-400' : 'bg-[#0a0c1a]/90 border-slate-800'} backdrop-blur-sm shadow-xl`}
                    >
                      <p
                        className={`text-[9px] sm:text-[11px] font-black uppercase truncate ${isSeatTurn ? 'text-cyan-400' : 'text-slate-400'}`}
                      >
                        {seat.name}
                      </p>
                      <p className="text-xs sm:text-sm font-mono text-white font-bold">
                        ${(seat.stack || 0).toLocaleString()}
                      </p>
                    </div>

                    {seat.bet > 0 && (
                      <div className="absolute -bottom-8 sm:-bottom-10">
                        <ChipStack amount={seat.bet} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center text-slate-800 bg-black/20 backdrop-blur-sm">
                    <Plus className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Insight Overlay */}
      <AnimatePresence>
        {aiInsight && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-36 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl"
          >
            <div className="bg-[#0a0c1a]/95 backdrop-blur-xl border-2 border-cyan-400/50 rounded-xl p-4 shadow-[0_0_30px_rgba(0,242,255,0.15)] flex gap-4">
              <BrainCircuit className="w-6 h-6 text-cyan-400 mt-1 animate-pulse" />
              <div className="flex-1">
                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">
                  ✨ Tactical Advice
                </p>
                <p className="text-sm text-slate-200 leading-relaxed font-mono">{aiInsight}</p>
              </div>
              <button onClick={() => setAiInsight('')} className="hover:bg-white/10 p-1 rounded">
                <LogOut className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Bar */}
      <div className="h-auto sm:h-32 bg-[#0a0c1a] border-t-2 border-slate-800 p-4 sm:px-10 flex flex-col sm:flex-row items-center justify-between z-[200] gap-4 sm:gap-0">
        <div className="flex items-center gap-4 sm:gap-8 w-full sm:w-auto justify-between sm:justify-start">
          {/* HERO HUD: Guaranteed visibility for user's own cards */}
          <div className="flex gap-2 bg-black/40 p-2 rounded-xl border border-cyan-500/20">
            {mySeat.cards.map((c: string, i: number) => (
              <Card key={`my-${i}`} val={c} />
            ))}
          </div>
          <div className="text-right sm:text-left">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Table Round</p>
            <p className="text-lg sm:text-2xl font-black text-cyan-400 uppercase tracking-tighter">
              {gameState.round?.replace('_', ' ') || 'WAITING'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <div className="flex gap-2 w-full">
              <button
                disabled={!isMyTurn}
                onClick={() => handleAction('FOLD')}
                onMouseEnter={playHover}
                className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-slate-900 border-2 border-slate-800 text-xs font-black uppercase text-slate-400 hover:border-red-500 hover:text-red-500 disabled:opacity-50 transition-all"
              >
                Fold
              </button>
              <button
                disabled={!isMyTurn}
                onClick={() => handleAction('CALL')}
                onMouseEnter={playHover}
                className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-cyan-900/30 border-2 border-cyan-500/50 text-xs font-black uppercase text-cyan-400 hover:bg-cyan-600 hover:text-white disabled:opacity-50 transition-all"
              >
                {gameState.currentBet === mySeat.bet
                  ? 'Check'
                  : `Call $${gameState.currentBet - mySeat.bet}`}
              </button>
            </div>
            <button
              onClick={getAIInsight}
              onMouseEnter={playHover}
              disabled={!isMyTurn || isAnalyzing}
              className="w-full py-2 rounded-lg bg-indigo-900/30 border border-indigo-500/50 text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-900/50 transition-all disabled:opacity-50"
            >
              {isAnalyzing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}{' '}
              AI Strategy
            </button>
          </div>

          <div className="hidden sm:flex h-full py-2">
            <input
              type="number"
              id="raiseAmount"
              defaultValue={gameState.currentBet + (gameState.blinds?.[1] || 0)}
              className="w-24 bg-black border-2 border-slate-800 rounded-l-lg px-3 font-mono text-cyan-400 text-sm outline-none focus:border-cyan-500 transition-colors"
            />
            <button
              disabled={!isMyTurn}
              onClick={() => {
                const val = parseInt(
                  (document.getElementById('raiseAmount') as HTMLInputElement).value
                );
                handleAction('RAISE', val);
              }}
              onMouseEnter={playHover}
              className="px-6 bg-slate-100 rounded-r-lg font-black text-xs uppercase text-black border-b-4 border-slate-400 hover:bg-white active:border-b-0 active:translate-y-1 disabled:opacity-50 transition-all"
            >
              Raise
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ControlCenterProps {
  setView: (v: PokerView) => void;
  notify: any;
}

const ControlCenter: React.FC<ControlCenterProps> = ({ setView, notify }) => {
  const sections = getControlCenterSections();

  return (
    <div className="min-h-screen bg-[#020308] text-slate-300 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-[#0a0c1a]/90 border border-cyan-500/30 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2">
            Operator Admin
          </p>
          <h2 className="text-3xl font-black italic text-white uppercase">Control Center</h2>
          <p className="text-sm text-slate-400 mt-3">
            Control surfaces are preserved, but segmented by user context so player routes stay
            clean while admin/operator tooling remains available.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => setView('LOBBY')}
              className="px-4 py-2 rounded-lg bg-cyan-900/40 border border-cyan-500/40 text-cyan-300 text-xs font-black uppercase tracking-widest"
            >
              Back To Lobby
            </button>
            <a
              href="https://poker.ai-arcade.xyz/"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-lg bg-indigo-900/40 border border-indigo-500/40 text-indigo-300 text-xs font-black uppercase tracking-widest"
            >
              Open Legacy Ops Shell
            </a>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <div
              key={section.title}
              className="bg-[#0a0c1a]/80 border border-white/10 rounded-2xl p-5"
            >
              <h3 className="text-lg font-black text-white uppercase">{section.title}</h3>
              <p className="text-xs text-slate-400 mt-2">{section.blurb}</p>
              <div className="mt-4 space-y-2">
                {section.controls.map((line) => (
                  <p
                    key={line}
                    className="text-xs text-slate-200 bg-white/5 border border-white/10 rounded p-2"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <BotOrchestration onNotify={(type, title, msg) => notify(type as any, title, msg)} />
      </div>
    </div>
  );
};

// --- MAIN APP ---
function AppContent() {
  type SessionUser = { username: string; balance: number; avatar: string; email?: string };
  const { notify } = useNotification();
  const {
    playClick,
    playHover,
    playDeal,
    playChip,
    playWin,
    bgmEnabled,
    toggleBgm,
    sfxEnabled,
    toggleSfx,
  } = useGameAudio();

  const [view, setView] = useState<PokerView>('LANDING');
  const [gameState, setGameState] = useState<any>(null);
  const [aiInsight, setAiInsight] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTableId, setActiveTableId] = useState('lobby-1');
  const [postLoginView, setPostLoginView] = useState<PokerView | null>(null);

  const [showSngCreator, setShowSngCreator] = useState(false);
  const [showMttCreator, setShowMttCreator] = useState(false);
  const [replayHandId, setReplayHandId] = useState<string | null>(null);

  const [user, setUser] = useState<SessionUser | null>(null);
  const [membership, setMembership] = useState<CommunityMembership | null>(null);
  const [botTournament, setBotTournament] = useState<{
    enabled: boolean;
    running: boolean;
    tableId: string;
    handNumber: number;
    stacks: Record<string, number>;
    eliminated: string[];
    championId: string | null;
    lastProcessedHandId: string | null;
  } | null>(null);
  const [actionTape, setActionTape] = useState<{
    handId: string;
    events: any[];
    played: number;
    feed: Array<{ id: string; text: string }>;
  }>({
    handId: '',
    events: [],
    played: 0,
    feed: [],
  });
  const [lastObservedState, setLastObservedState] = useState<any>(null);
  const lastInitAttemptRef = useRef(0);

  const viewPathMap: Partial<Record<PokerView, string>> = {
    LOBBY: '/',
    TABLE: '/table',
    'CONTROL CENTER': '/console',
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname || '/';
    if (path === '/console' || path === '/control-center') {
      setView('CONTROL CENTER');
      setPostLoginView('CONTROL CENTER');
      return;
    }
    if (path === '/table') {
      setView('TABLE');
      setPostLoginView('TABLE');
      return;
    }
    if (path === '/' || path === '/lobby') {
      setView('LOBBY');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const targetPath = viewPathMap[view];
    if (!targetPath) return;
    if (window.location.pathname !== targetPath) {
      window.history.replaceState({}, '', targetPath);
    }
  }, [view]);

  const applySnapshot = (snapshot: any, prevState?: any) => {
    if (!snapshot) return prevState || null;
    if (
      prevState &&
      snapshot.communityCards &&
      prevState.communityCards &&
      snapshot.communityCards.length > prevState.communityCards.length
    ) {
      playDeal();
    }
    if (snapshot.terminal && (!prevState || !prevState.terminal)) playWin();

    return {
      ...snapshot,
      seats: (snapshot.seats || []).map((s: any, i: number) => ({
        id: s.playerId || `seat-${i}`,
        name:
          s.playerId === user?.username
            ? user.username
            : BOT_PROFILES.find((b) => b.id === s.playerId)?.name || s.playerId || 'EMPTY',
        avatar:
          s.playerId === user?.username
            ? user.avatar
            : BOT_PROFILES.find((b) => b.id === s.playerId)?.avatar ||
              BOT_PROFILES[i % BOT_PROFILES.length]?.avatar ||
              '',
        style: BOT_PROFILES.find((b) => b.id === s.playerId)?.style || '',
        stack: s.stack || 0,
        bet: snapshot.streetBets?.[String(i)] || 0,
        cards:
          snapshot.holeCards?.[String(i)] ||
          (s.playerId && s.playerId !== user?.username && snapshot.street
            ? ['hidden', 'hidden']
            : []),
        active: !!s.playerId,
        folded: (snapshot.actedSeats || [])[i] === 'fold' || s.folded || false,
        isAllIn: s.stack === 0 && (snapshot.streetBets?.[String(i)] || 0) > 0,
        isHero: s.playerId === user?.username,
      })),
      round: snapshot.street
        ? snapshot.street.toUpperCase()
        : snapshot.terminal
          ? 'SHOWDOWN'
          : 'WAITING',
      communityCards: snapshot.boardCards || snapshot.communityCards || [],
      turnIndex: snapshot.actingSeat || 0,
      currentBet: snapshot.currentBet || 0,
      blinds: [snapshot.blinds?.smallBlind || 100, snapshot.blinds?.bigBlind || 200],
      timeline: Array.isArray(snapshot.timeline)
        ? snapshot.timeline
        : Array.isArray(snapshot.actionTimeline)
          ? snapshot.actionTimeline
          : [],
      streetBets: snapshot.streetBets || {},
      handId: snapshot.handId,
      dealerIndex: snapshot.buttonSeat ?? 0,
      pot: snapshot.pot ?? 0,
      terminal: snapshot.terminal ?? false,
      lastAction: snapshot.lastAction || null,
    };
  };

  // --- Poll table state from Railway backend ---
  useEffect(() => {
    if (view !== 'TABLE' || !user) return;
    let active = true;
    const poll = async () => {
      try {
        const res = await pokerApi.getState(activeTableId);
        if (active && res.ok && res.snapshot) {
          setGameState((prev: any) => applySnapshot(res.snapshot, prev));
          // Auto-trigger bot actions
          const snap = res.snapshot;
          const activeSeat = snap.seats?.[snap.actingSeat];
          if (
            !snap.terminal &&
            snap.street &&
            (!activeSeat || activeSeat.playerId !== user.username)
          ) {
            await pokerApi.autoRound(activeTableId, snap.handId, snap.seats, 12).catch(() => {});
          }
        }
      } catch (e) {
        console.warn('Table poll failed', e);
        const message = (e as Error)?.message || '';
        if (
          message.toLowerCase().includes('no table snapshot') &&
          botTournament?.running &&
          Date.now() - lastInitAttemptRef.current > 2500
        ) {
          lastInitAttemptRef.current = Date.now();
          launchBotTournamentHand(botTournament).catch(() => {});
        }
      }
    };
    poll();
    const t = setInterval(poll, 1500);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [view, activeTableId, user, playDeal, playWin]);

  const toActionLine = (evt: any, idx: number, handId: string) => {
    const actor = evt?.agentId || evt?.playerId || `Seat ${evt?.seat ?? '?'}`;
    const decision = (evt?.action || evt?.decision || evt?.type || 'act').toString().toUpperCase();
    const amount = Number(evt?.amount ?? evt?.bet ?? 0);
    const street = evt?.street ? ` [${String(evt.street).toUpperCase()}]` : '';
    const amountChunk = amount > 0 ? ` $${amount}` : '';
    return {
      id: `${handId}-${idx}-${actor}-${decision}`,
      text: `${actor} ${decision}${amountChunk}${street}`,
    };
  };

  useEffect(() => {
    if (view !== 'TABLE' || !gameState) return;
    const events = Array.isArray(gameState.timeline) ? gameState.timeline : [];
    setActionTape((prev) => {
      const handId = String(gameState.handId || '');
      if (!handId) return prev;
      if (prev.handId !== handId) {
        return { handId, events, played: 0, feed: [] };
      }
      if (events.length !== prev.events.length) {
        return { ...prev, events };
      }
      return prev;
    });
  }, [view, gameState]);

  useEffect(() => {
    if (view !== 'TABLE') return;
    if (!actionTape.events.length || actionTape.played >= actionTape.events.length) return;
    const timer = setTimeout(() => {
      setActionTape((prev) => {
        if (prev.played >= prev.events.length) return prev;
        const line = toActionLine(prev.events[prev.played], prev.played, prev.handId);
        return {
          ...prev,
          played: prev.played + 1,
          feed: [...prev.feed.slice(-59), line],
        };
      });
      playChip();
    }, ACTION_TAPE_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [view, actionTape.played, actionTape.events.length, playChip]);

  useEffect(() => {
    if (view !== 'TABLE' || !gameState) return;
    if (Array.isArray(gameState.timeline) && gameState.timeline.length > 0) {
      setLastObservedState(gameState);
      return;
    }
    if (!lastObservedState || lastObservedState.handId !== gameState.handId) {
      setLastObservedState(gameState);
      return;
    }

    const deltaLines: Array<{ id: string; text: string }> = [];
    const prevById = new Map((lastObservedState.seats || []).map((s: any) => [s.id, s]));
    for (const seat of gameState.seats || []) {
      const prev = prevById.get(seat.id);
      if (!prev) continue;
      if (!!seat.folded && !prev.folded) {
        deltaLines.push({
          id: `${gameState.handId}-${seat.id}-fold-${Date.now()}`,
          text: `${seat.name || seat.id} FOLD`,
        });
      }
      if (Number(seat.bet || 0) > Number(prev.bet || 0)) {
        const delta = Number(seat.bet || 0) - Number(prev.bet || 0);
        deltaLines.push({
          id: `${gameState.handId}-${seat.id}-bet-${Date.now()}`,
          text: `${seat.name || seat.id} BET $${delta}`,
        });
      }
      if (Number(seat.stack || 0) === 0 && Number(prev.stack || 0) > 0) {
        deltaLines.push({
          id: `${gameState.handId}-${seat.id}-allin-${Date.now()}`,
          text: `${seat.name || seat.id} ALL-IN`,
        });
      }
    }
    if (gameState.round && gameState.round !== lastObservedState.round) {
      deltaLines.push({
        id: `${gameState.handId}-street-${Date.now()}`,
        text: `STREET ${String(gameState.round).toUpperCase()}`,
      });
    }

    if (deltaLines.length > 0) {
      setActionTape((prev) => ({
        ...prev,
        feed: [...prev.feed.slice(-59), ...deltaLines].slice(-60),
      }));
    }
    setLastObservedState(gameState);
  }, [view, gameState, lastObservedState]);

  useEffect(() => {
    if (
      !botTournament?.enabled ||
      !botTournament.running ||
      !gameState?.terminal ||
      !gameState?.handId
    ) {
      return;
    }
    if (gameState.handId === botTournament.lastProcessedHandId) return;

    const observedStacks = { ...botTournament.stacks };
    for (const seat of gameState.seats || []) {
      if (seat?.id) {
        observedStacks[seat.id] = Number(seat.stack || 0);
      }
    }

    const newlyEliminated = BOT_PROFILES.filter(
      (b) => observedStacks[b.id] === 0 && !botTournament.eliminated.includes(b.id)
    ).map((b) => b.id);

    const nextState = {
      ...botTournament,
      stacks: observedStacks,
      eliminated: [...botTournament.eliminated, ...newlyEliminated],
      lastProcessedHandId: gameState.handId,
    };

    setBotTournament(nextState);

    const remaining = BOT_PROFILES.filter((b) => (observedStacks[b.id] || 0) > 0);
    if (remaining.length <= 1) {
      const champion = remaining[0]?.id || null;
      setBotTournament((prev) =>
        prev
          ? {
              ...prev,
              running: false,
              championId: champion,
            }
          : prev
      );
      if (champion) {
        const champName = BOT_PROFILES.find((b) => b.id === champion)?.name || champion;
        notify('SUCCESS', 'Tournament Complete', `${champName} won the all-bot tournament.`);
      } else {
        notify('SYSTEM', 'Tournament Complete', 'No remaining players in bot tournament.');
      }
      return;
    }

    const timer = setTimeout(() => {
      launchBotTournamentHand(nextState).catch(() => {});
    }, 1700);
    return () => clearTimeout(timer);
  }, [botTournament, gameState, notify]);

  const handleLogin = async (username: string, avatar: string, email?: string) => {
    setUser({ username, avatar, balance: 100000, ...(email ? { email } : {}) });

    let resolvedMembership: CommunityMembership | null = null;
    try {
      const byUsername = await communityApi.membership(username);
      if (byUsername?.exists && byUsername.membership) {
        resolvedMembership = byUsername.membership as CommunityMembership;
      } else if (email) {
        const byEmail = await communityApi.membership(email);
        if (byEmail?.exists && byEmail.membership) {
          resolvedMembership = byEmail.membership as CommunityMembership;
        }
      }
    } catch {
      resolvedMembership = null;
    }

    setMembership(resolvedMembership);
    playWin();
    notify('SUCCESS', 'Authentication Successful', `Welcome to the Neural Network, ${username}.`);
    if (postLoginView) {
      setView(postLoginView);
      setPostLoginView(null);
    } else {
      setView('LOBBY');
    }
  };

  const handleJoinTable = async (tableId?: string) => {
    if (!user) return;
    playClick();
    const tid = tableId || 'lobby-1';
    setActiveTableId(tid);
    notify('SYSTEM', 'Connecting to Node', 'Establishing secure connection to table...');
    const userBotsRes = await userBotsApi.list();
    const userBots = userBotsRes.ok ? userBotsRes.data : [];
    const sysBots = loadSystemBots();
    const maxBots = 5;
    const customBots = userBots.slice(0, maxBots).map((bot, idx) => ({
      playerId: formatBotId(bot.name, idx),
      agentId: formatBotId(bot.name, idx),
      stack: 100000,
      temperament: bot.temperament,
      maxRiskBps: bot.riskBps,
      aiAssist: bot.aiAssist,
    }));
    const fallbackBots = sysBots
      .filter((b) => !customBots.find((c) => c.playerId === b.id))
      .slice(0, Math.max(0, maxBots - customBots.length))
      .map((b) => ({
        playerId: b.id,
        agentId: b.id,
        stack: 100000,
        temperament: b.temperament,
        maxRiskBps: b.riskBps,
      }));
    const botSeats = [...customBots, ...fallbackBots];

    // Register bots with distinct personalities
    for (const bot of botSeats) {
      await agentApi.register(bot.playerId, bot.temperament, bot.maxRiskBps);
    }

    // Init a new hand
    const seats = [
      { playerId: user.username, stack: 100000, temperament: 'balanced', maxRiskBps: 700 },
      ...botSeats,
    ];
    const handId = 'hand-' + Date.now();
    try {
      const initRes = await pokerApi.initTableState(tid, handId, seats, 0, 0);
      if (initRes?.ok && initRes.snapshot) {
        setGameState((prev: any) => applySnapshot(initRes.snapshot, prev));
      }
      await pokerApi.autoRound(tid, handId, seats).catch(() => {});
    } catch {
      notify('ERROR', 'Table Init Failed', 'Poker engine did not accept the table payload.');
      return;
    }
    setView('TABLE');
  };

  const handleLeaveTable = () => {
    playClick();
    setGameState(null);
    setView('LOBBY');
  };

  const launchBotTournamentHand = async (state: {
    enabled: boolean;
    running: boolean;
    tableId: string;
    handNumber: number;
    stacks: Record<string, number>;
    eliminated: string[];
    championId: string | null;
    lastProcessedHandId: string | null;
  }) => {
    const activeBots = BOT_PROFILES.filter((b) => (state.stacks[b.id] || 0) > 0);
    if (activeBots.length <= 1) {
      const champion = activeBots[0]?.id || null;
      setBotTournament((prev) =>
        prev
          ? {
              ...prev,
              running: false,
              championId: champion,
            }
          : prev
      );
      if (champion) {
        const champName = BOT_PROFILES.find((b) => b.id === champion)?.name || champion;
        notify('SUCCESS', 'Tournament Complete', `${champName} won the all-bot tournament.`);
      } else {
        notify('SYSTEM', 'Tournament Complete', 'No remaining players in bot tournament.');
      }
      return;
    }

    const nextHandNumber = state.handNumber + 1;
    const handId = `bot-hand-${Date.now()}-${nextHandNumber}`;
    const seats = activeBots.map((b) => ({
      playerId: b.id,
      agentId: b.id,
      stack: state.stacks[b.id],
      temperament: b.temperament,
      maxRiskBps: b.riskBps,
    }));
    try {
      const initRes = await pokerApi.initTableState(state.tableId, handId, seats, 0, 0);
      if (initRes?.ok && initRes.snapshot) {
        setGameState((prev: any) => applySnapshot(initRes.snapshot, prev));
      }
    } catch (err) {
      notify('ERROR', 'Tournament Error', 'Poker engine rejected the tournament hand.');
      setBotTournament((prev) => (prev ? { ...prev, running: false } : prev));
      return;
    }
    setBotTournament((prev) =>
      prev
        ? {
            ...prev,
            running: true,
            handNumber: nextHandNumber,
          }
        : prev
    );
    await pokerApi.autoRound(state.tableId, handId, seats, 12).catch(() => {});
    // Further action progression is driven by table polling to avoid rate-limit bursts.
  };

  const startBotTournament = async () => {
    const tableId = `${BOT_TOURNAMENT_TABLE_ID_PREFIX}-${Date.now()}`;
    const initialStacks = Object.fromEntries(
      BOT_PROFILES.map((b) => [b.id, BOT_TOURNAMENT_STARTING_STACK])
    ) as Record<string, number>;

    const initialState = {
      enabled: true,
      running: true,
      tableId,
      handNumber: 0,
      stacks: initialStacks,
      eliminated: [],
      championId: null,
      lastProcessedHandId: null,
    };

    setActionTape({ handId: '', events: [], played: 0, feed: [] });
    setGameState(null);
    setActiveTableId(tableId);
    setBotTournament(initialState);
    notify('SYSTEM', 'Tournament Boot', 'Launching full all-bot tournament.');
    setView('TABLE');
    try {
      await launchBotTournamentHand(initialState);
    } catch (err) {
      setBotTournament((prev) => (prev ? { ...prev, running: false, enabled: false } : prev));
      setView('LOBBY');
      notify('ERROR', 'Tournament Error', String((err as Error)?.message || 'Failed to boot'));
    }
  };

  const stopBotTournament = () => {
    setBotTournament((prev) => (prev ? { ...prev, running: false, enabled: false } : prev));
    notify('SYSTEM', 'Tournament Halted', 'Bot tournament stopped.');
  };

  const handleAction = async (type: string, amount: number = 0) => {
    if (!gameState || !user) return;
    const mySeatIdx = gameState.seats.findIndex((s: any) => s.isHero);
    if (mySeatIdx === -1) return;
    const actionMap: Record<string, string> = {
      FOLD: 'fold',
      CALL: 'call',
      RAISE: 'raise',
      CHECK: 'check',
    };
    const action = actionMap[type] || type.toLowerCase();
    if (action === 'fold') playClick();
    else playChip();
    await pokerApi.playerAction(activeTableId, mySeatIdx, action, amount).catch(console.error);
    setTimeout(() => {
      pokerApi.autoRound(activeTableId, gameState.handId || '', gameState.seats).catch(() => {});
    }, 500);
  };

  const handleCreateSng = async (config: any) => {
    playClick();
    setShowSngCreator(false);
    try {
      await sngApi.create(config);
      notify(
        'SUCCESS',
        'Tournament Created',
        `${config.name || 'SNG'} is now open for registration.`
      );
    } catch {
      notify('ERROR', 'Creation Failed', 'Could not create tournament.');
    }
  };

  const handleCreateMtt = async (config: any) => {
    playClick();
    setShowMttCreator(false);
    try {
      await mttApi.create(config);
      notify(
        'SUCCESS',
        'Tournament Created',
        `${config.name || 'MTT'} is now open for registration.`
      );
    } catch {
      notify('ERROR', 'Creation Failed', 'Could not create tournament.');
    }
  };

  const callGemini = async (prompt: string) => {
    try {
      const json = await api('/api/gemini/content', {
        method: 'POST',
        body: {
          contents: prompt,
          config: { systemInstruction: 'You are a professional poker strategy engine.' },
          model: 'gemini-2.0-flash',
        },
      });
      return json.candidates?.[0]?.content?.parts?.[0]?.text || 'No tactical advice available.';
    } catch {
      return 'Error connecting to tactical engine.';
    }
  };

  const getAIInsight = async () => {
    if (!gameState) return;
    const mySeat = gameState.seats.find((s: any) => s.isHero);
    if (!mySeat || mySeat.cards.length === 0) return;
    playClick();
    setIsAnalyzing(true);
    const prompt = `Cards: ${mySeat.cards.join(', ')}. Board: ${(gameState.communityCards || []).join(', ')}. Pot: $${gameState.pot}. Action: ${gameState.round}. Current Bet to call: $${(gameState.currentBet || 0) - (mySeat.bet || 0)}. Recommendation? Keep it under 20 words, brutalist cyberpunk tone.`;
    const insight = await callGemini(prompt);
    setAiInsight(insight);
    setIsAnalyzing(false);
  };

  const access = derivePokerAccess({
    username: user?.username,
    email: user?.email,
    membership,
  });
  const canAccessView = (target: PokerView) =>
    canAccessPokerSurface(access, VIEW_SURFACE_POLICY[target]);
  const lobbyNavViews = getAllowedLobbyViews(access, 'nav');
  const lobbyCardViews = getAllowedLobbyViews(access, 'card');
  const lobbyOperatorViews = getAllowedLobbyViews(access, 'operator');

  useEffect(() => {
    if (canAccessView(view)) return;
    if (!user) {
      setView('LOGIN');
      return;
    }
    notify('SYSTEM', 'Route Restricted', 'That surface is not enabled for this session.');
    setView('LOBBY');
  }, [view, access.isAdmin, access.isMember, access.isCreator, access.isProgrammaticAgent, user]);

  return (
    <>
      {/* Global Audio Controls for non-table views */}
      {view !== 'TABLE' && (
        <div className="fixed bottom-4 right-4 z-999 flex items-center gap-2">
          <button
            onClick={toggleBgm}
            className={`p-3 rounded-full transition-colors shadow-lg ${bgmEnabled ? 'text-cyan-400 bg-cyan-900/50 border border-cyan-500/50' : 'text-slate-500 bg-black/60 border border-slate-800 hover:text-white'}`}
          >
            <Music className="w-5 h-5" />
          </button>
          <button
            onClick={toggleSfx}
            className={`p-3 rounded-full transition-colors shadow-lg ${sfxEnabled ? 'text-cyan-400 bg-cyan-900/50 border border-cyan-500/50' : 'text-slate-500 bg-black/60 border border-slate-800 hover:text-white'}`}
          >
            {sfxEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      )}

      {view === 'LANDING' && (
        <LandingPage
          onEnter={() => {
            playClick();
            setView('LOGIN');
          }}
        />
      )}
      {view === 'LOGIN' && <SessionLogin onLogin={handleLogin} />}
      {view === 'LOBBY' && user && (
        <LobbyPage
          user={user}
          canAccessLab={false}
          availableNavViews={lobbyNavViews}
          availableCardViews={lobbyCardViews}
          availableOperatorViews={lobbyOperatorViews}
          onNavigate={(v) => {
            playClick();
            const normalized = v as PokerView;
            if (!(normalized in VIEW_SURFACE_POLICY)) {
              notify('SYSTEM', 'Route Restricted', 'This control surface is not exposed here.');
              return;
            }
            if (!canAccessView(normalized)) {
              notify(
                'SYSTEM',
                'Route Restricted',
                'This control surface is not enabled for this role.'
              );
              return;
            }
            setView(normalized);
          }}
        />
      )}
      {view === 'LOBBY' && user && access.canAccessOperatorConsole && (
        <button
          onClick={() => {
            playClick();
            setView('CONTROL CENTER');
          }}
          onMouseEnter={playHover}
          className="fixed bottom-20 left-4 z-[998] px-4 py-3 rounded-xl bg-indigo-900/70 border border-indigo-400/40 text-indigo-300 text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.25)]"
        >
          Open Control Center
        </button>
      )}
      {view === 'LOBBY' && user && (
        <button
          onClick={startBotTournament}
          onMouseEnter={playHover}
          className="fixed bottom-20 right-4 z-[998] px-4 py-3 rounded-xl bg-emerald-900/70 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.25)]"
        >
          Run Live Bot Tournament
        </button>
      )}
      {view === 'CONTROL CENTER' && <ControlCenter setView={setView} notify={notify} />}
      {view === 'CASH TABLES' && (
        <CashTableBrowser
          onJoinTable={handleJoinTable}
          canCreateTable={access.canCreateTables}
          onBack={() => {
            playClick();
            setView('LOBBY');
          }}
        />
      )}
      {view === 'TOURNAMENTS' && (
        <TournamentLobby
          onJoin={handleJoinTable}
          canCreateTournaments={access.canCreateTournaments}
          onCreateSng={() => {
            playClick();
            setShowSngCreator(true);
          }}
          onCreateMtt={() => {
            playClick();
            setShowMttCreator(true);
          }}
          onBack={() => {
            playClick();
            setView('LOBBY');
          }}
        />
      )}
      {view === 'WALLET' && user && (
        <CashierPage
          balance={user.balance}
          onBack={() => {
            playClick();
            setView('LOBBY');
          }}
        />
      )}
      {view === 'HISTORY' && (
        <HandHistory
          onBack={() => {
            playClick();
            setView('LOBBY');
          }}
          onReplay={(id) => {
            playClick();
            setReplayHandId(id);
          }}
        />
      )}
      {view === 'RESULTS' && (
        <TournamentResults
          onBack={() => {
            playClick();
            setView('LOBBY');
          }}
          onHistory={() => {
            playClick();
            setView('HISTORY');
          }}
        />
      )}
      {view === 'PROFILE' && user && (
        <PlayerProfile
          user={user}
          onBack={() => {
            playClick();
            setView('LOBBY');
          }}
        />
      )}
      {view === 'PROVABLY_FAIR' && (
        <ProvablyFair
          onBack={() => {
            playClick();
            setView('LOBBY');
          }}
        />
      )}
      {view === 'MARKETPLACE' && (
        <SponsorshipMarketplace
          onBack={() => {
            playClick();
            setView('LOBBY');
          }}
        />
      )}
      {view === 'COMMUNITY APPS' && user && (
        <CommunityAppsPage
          username={user.username}
          onBack={() => {
            playClick();
            setView('LOBBY');
          }}
        />
      )}
      {view === 'LEADERBOARD' && (
        <Leaderboard
          onBack={() => {
            playClick();
            setView('LOBBY');
          }}
          onViewProfile={(username) => {
            playClick();
            setView('PROFILE');
          }}
          currentUser={user || { username: 'Guest' }}
        />
      )}
      {view === 'SETTINGS' && (
        <SettingsPage
          onBack={() => {
            playClick();
            setView('LOBBY');
          }}
        />
      )}

      {view === 'TABLE' && (
        <TournamentTableView onLeave={handleLeaveTable}>
          <PokerTable
            gameState={gameState}
            actionTape={actionTape}
            bgmEnabled={bgmEnabled}
            sfxEnabled={sfxEnabled}
            toggleBgm={toggleBgm}
            toggleSfx={toggleSfx}
            playHover={playHover}
            handleAction={handleAction}
            getAIInsight={getAIInsight}
            aiInsight={aiInsight}
            setAiInsight={setAiInsight}
            isAnalyzing={isAnalyzing}
          />
        </TournamentTableView>
      )}

      {showSngCreator && access.canCreateTournaments && (
        <SngCreatorModal onClose={() => setShowSngCreator(false)} onCreate={handleCreateSng} />
      )}

      {showMttCreator && access.canCreateTournaments && (
        <MttCreatorModal onClose={() => setShowMttCreator(false)} onCreate={handleCreateMtt} />
      )}

      {replayHandId && <HandReplayer handId={replayHandId} onClose={() => setReplayHandId(null)} />}
    </>
  );
}

export default function App() {
  return (
    <GameAudioProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </GameAudioProvider>
  );
}
