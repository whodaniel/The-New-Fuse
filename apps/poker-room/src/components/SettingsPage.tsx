import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  Bot,
  ChevronLeft,
  Download,
  Gamepad2,
  Loader2,
  Monitor,
  RefreshCw,
  Save,
  Trash2,
  User,
  Volume2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { userBotsApi } from '../api';
import { PLAYER_AVATARS } from '../data/avatars';
import {
  createProfileId,
  loadProfiles,
  removeProfile,
  saveProfiles,
  type PlayerControlMode,
  type PlayerProfile,
} from '../utils/playerProfiles';

interface SettingsPageProps {
  onBack?: () => void;
  onSave?: (settings: any) => void;
}

const USER_BOT_STORAGE_KEY = 'aiArcadeUserBots';

type UserBotProfile = {
  id?: string;
  name: string;
  temperament: string;
  riskBps: number;
  aiAssist?: boolean;
};

export default function SettingsPage({ onBack, onSave }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<
    'DISPLAY' | 'AUDIO' | 'GAMEPLAY' | 'NOTIFICATIONS' | 'ACCOUNT' | 'BOTS'
  >('DISPLAY');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [botRoster, setBotRoster] = useState<UserBotProfile[]>([]);
  const [loadingBots, setLoadingBots] = useState(false);
  const [botForm, setBotForm] = useState<UserBotProfile>({
    name: '',
    temperament: 'balanced',
    riskBps: 800,
    aiAssist: false,
  });
  const [playerProfiles, setPlayerProfiles] = useState<PlayerProfile[]>([]);
  const [profileForm, setProfileForm] = useState<{
    name: string;
    avatar: string;
    controlMode: PlayerControlMode;
  }>({ name: '', avatar: PLAYER_AVATARS[0], controlMode: 'human' });

  // Settings State
  const [settings, setSettings] = useState({
    display: {
      tableTheme: 'Neon',
      cardStyle: 'Standard',
      animationSpeed: 50, // 0: Slow, 50: Normal, 100: Fast
      showAnimations: true,
    },
    audio: {
      masterVolume: 80,
      soundEffects: true,
      notificationSounds: true,
      backgroundMusic: true,
      bgmVolume: 40,
    },
    gameplay: {
      autoPostBlinds: true,
      showHandStrength: true,
      autoMuck: true,
      defaultBuyIn: 100, // percentage
      actionTimeBank: '30s',
      fourColorDeck: false,
    },
    notifications: {
      tournamentStarting: true,
      tableClosing: true,
      newTournament: false,
      levelChange: true,
    },
    account: {
      clientSeed: '0x7f8a9b2c1d3e4f5a6b7c8d9e0f1a2b3c',
    },
  });

  const updateSection = (section: keyof typeof settings, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  useEffect(() => {
    if (activeTab === 'BOTS') {
      loadBots();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'ACCOUNT') {
      setPlayerProfiles(loadProfiles());
    }
  }, [activeTab]);

  const loadBots = async () => {
    setLoadingBots(true);
    try {
      const res = await userBotsApi.list();
      if (res.ok) setBotRoster(res.data);
    } catch (err) {
      console.error('Failed to load bots', err);
    } finally {
      setLoadingBots(false);
    }
  };

  const handleSave = () => {
    if (onSave) onSave(settings);
    if (onBack) onBack();
  };

  const addBot = async () => {
    if (!botForm.name.trim() || botRoster.length >= 5) return;
    try {
      const res = await userBotsApi.create(botForm);
      if (res.ok) {
        await loadBots();
        setBotForm({ ...botForm, name: '' });
      }
    } catch (err) {
      console.error('Failed to create bot', err);
    }
  };

  const savePlayerProfiles = (next: PlayerProfile[]) => {
    setPlayerProfiles(next);
    saveProfiles(next);
  };

  const addPlayerProfile = () => {
    const name = profileForm.name.trim();
    if (name.length < 3 || name.length > 16) return;
    const exists = playerProfiles.some((p) => p.name.trim().toLowerCase() === name.toLowerCase());
    if (exists) return;
    const next = [
      ...playerProfiles,
      {
        id: createProfileId(name),
        name,
        avatar: profileForm.avatar,
        controlMode: profileForm.controlMode,
        createdAt: new Date().toISOString(),
      },
    ];
    savePlayerProfiles(next);
    setProfileForm({ name: '', avatar: PLAYER_AVATARS[0], controlMode: 'human' });
  };

  const updatePlayerProfile = (index: number, patch: Partial<PlayerProfile>) => {
    const next = playerProfiles.map((profile, i) =>
      i === index ? { ...profile, ...patch } : profile
    );
    savePlayerProfiles(next);
  };

  const deletePlayerProfile = (name: string) => {
    savePlayerProfiles(removeProfile(playerProfiles, name));
  };

  const updateBotOnServer = async (index: number) => {
    const bot = botRoster[index];
    if (!bot.id) return;
    try {
      await userBotsApi.update(bot.id, bot);
    } catch (err) {
      console.error('Failed to update bot', err);
    }
  };

  const removeBot = async (index: number) => {
    const bot = botRoster[index];
    if (!bot.id) return;
    try {
      const res = await userBotsApi.delete(bot.id);
      if (res.ok) await loadBots();
    } catch (err) {
      console.error('Failed to remove bot', err);
    }
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <div
      className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${checked ? 'bg-cyan-500' : 'bg-slate-700'}`}
      onClick={() => onChange(!checked)}
    >
      <motion.div
        className="w-4 h-4 bg-white rounded-full shadow-md"
        animate={{ x: checked ? 24 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </div>
  );

  const tabs = [
    { id: 'DISPLAY', icon: <Monitor className="w-4 h-4" />, label: 'Display' },
    { id: 'AUDIO', icon: <Volume2 className="w-4 h-4" />, label: 'Audio' },
    { id: 'GAMEPLAY', icon: <Gamepad2 className="w-4 h-4" />, label: 'Gameplay' },
    { id: 'NOTIFICATIONS', icon: <Bell className="w-4 h-4" />, label: 'Notifications' },
    { id: 'ACCOUNT', icon: <User className="w-4 h-4" />, label: 'Account' },
    { id: 'BOTS', icon: <Bot className="w-4 h-4" />, label: 'Bots' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0a0f16] text-slate-300 font-sans selection:bg-cyan-500/30 flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-cyan-400" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-widest text-white">
              Settings
            </h1>
            <p className="text-xs font-mono text-cyan-400/70 uppercase tracking-wider">
              Configure your experience
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 pb-32 flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar pb-4 md:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-6 md:p-8">
          {/* DISPLAY SETTINGS */}
          {activeTab === 'DISPLAY' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wider">
                  Table Theme
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {['Classic Green', 'Dark Felt', 'Neon', 'Minimal'].map((theme) => (
                    <div
                      key={theme}
                      onClick={() => updateSection('display', 'tableTheme', theme)}
                      className={`cursor-pointer rounded-xl border-2 p-3 flex flex-col items-center gap-3 transition-all ${
                        settings.display.tableTheme === theme
                          ? 'border-cyan-400 bg-cyan-900/20'
                          : 'border-white/10 hover:border-white/30 bg-black/50'
                      }`}
                    >
                      <div
                        className={`w-full h-16 rounded-lg ${
                          theme === 'Classic Green'
                            ? 'bg-emerald-800'
                            : theme === 'Dark Felt'
                              ? 'bg-slate-800'
                              : theme === 'Neon'
                                ? 'bg-cyan-950 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                                : 'bg-zinc-900'
                        }`}
                      />
                      <span className="text-xs font-bold uppercase tracking-wider text-center">
                        {theme}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                    Card Style
                  </h3>
                  <p className="text-xs text-slate-500">
                    Choose between standard or four-color decks
                  </p>
                </div>
                <div className="flex bg-black/50 border border-white/10 rounded-lg p-1">
                  {['Standard', 'Four-Color Deck'].map((style) => (
                    <button
                      key={style}
                      onClick={() => updateSection('display', 'cardStyle', style)}
                      className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
                        settings.display.cardStyle === style
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                      Animation Speed
                    </h3>
                    <p className="text-xs text-slate-500">
                      Adjust the speed of card dealing and chip movements
                    </p>
                  </div>
                  <span className="text-xs font-mono text-cyan-400">
                    {settings.display.animationSpeed === 0
                      ? 'Slow'
                      : settings.display.animationSpeed === 50
                        ? 'Normal'
                        : 'Fast'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="50"
                  value={settings.display.animationSpeed}
                  onChange={(e) =>
                    updateSection('display', 'animationSpeed', parseInt(e.target.value))
                  }
                  className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold mt-2">
                  <span>Slow</span>
                  <span>Normal</span>
                  <span>Fast</span>
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                    Show Card Animations
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enable or disable dealing and folding animations
                  </p>
                </div>
                <Toggle
                  checked={settings.display.showAnimations}
                  onChange={(v) => updateSection('display', 'showAnimations', v)}
                />
              </div>
            </motion.div>
          )}

          {/* AUDIO SETTINGS */}
          {activeTab === 'AUDIO' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Master Volume
                  </h3>
                  <span className="text-xs font-mono text-cyan-400">
                    {settings.audio.masterVolume}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.audio.masterVolume}
                  onChange={(e) => updateSection('audio', 'masterVolume', parseInt(e.target.value))}
                  className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="h-px bg-white/10" />

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                    Sound Effects
                  </h3>
                  <p className="text-xs text-slate-500">Chips, cards dealing, and action sounds</p>
                </div>
                <Toggle
                  checked={settings.audio.soundEffects}
                  onChange={(v) => updateSection('audio', 'soundEffects', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                    Notification Sounds
                  </h3>
                  <p className="text-xs text-slate-500">
                    Alerts for your turn, tournament starts, etc.
                  </p>
                </div>
                <Toggle
                  checked={settings.audio.notificationSounds}
                  onChange={(v) => updateSection('audio', 'notificationSounds', v)}
                />
              </div>

              <div className="h-px bg-white/10" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                      Background Music
                    </h3>
                    <p className="text-xs text-slate-500">Ambient music during gameplay</p>
                  </div>
                  <Toggle
                    checked={settings.audio.backgroundMusic}
                    onChange={(v) => updateSection('audio', 'backgroundMusic', v)}
                  />
                </div>

                {settings.audio.backgroundMusic && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pl-4 border-l-2 border-white/10 pt-2"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400 uppercase font-bold">
                        Music Volume
                      </span>
                      <span className="text-xs font-mono text-cyan-400">
                        {settings.audio.bgmVolume}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.audio.bgmVolume}
                      onChange={(e) =>
                        updateSection('audio', 'bgmVolume', parseInt(e.target.value))
                      }
                      className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* GAMEPLAY SETTINGS */}
          {activeTab === 'GAMEPLAY' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                    Auto-Post Blinds
                  </h3>
                  <p className="text-xs text-slate-500">Automatically post big and small blinds</p>
                </div>
                <Toggle
                  checked={settings.gameplay.autoPostBlinds}
                  onChange={(v) => updateSection('gameplay', 'autoPostBlinds', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                    Show Hand Strength
                  </h3>
                  <p className="text-xs text-slate-500">
                    Display current hand ranking (e.g., "Two Pair")
                  </p>
                </div>
                <Toggle
                  checked={settings.gameplay.showHandStrength}
                  onChange={(v) => updateSection('gameplay', 'showHandStrength', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                    Auto-Muck Losing Hands
                  </h3>
                  <p className="text-xs text-slate-500">
                    Automatically fold losing hands without showing
                  </p>
                </div>
                <Toggle
                  checked={settings.gameplay.autoMuck}
                  onChange={(v) => updateSection('gameplay', 'autoMuck', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                    Four-Color Deck
                  </h3>
                  <p className="text-xs text-slate-500">
                    Use 4 colors for suits to prevent misreading
                  </p>
                </div>
                <Toggle
                  checked={settings.gameplay.fourColorDeck}
                  onChange={(v) => updateSection('gameplay', 'fourColorDeck', v)}
                />
              </div>

              <div className="h-px bg-white/10" />

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                    Default Buy-in
                  </h3>
                  <p className="text-xs text-slate-500">
                    Percentage of max buy-in when joining a table
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={settings.gameplay.defaultBuyIn}
                    onChange={(e) =>
                      updateSection('gameplay', 'defaultBuyIn', parseInt(e.target.value) || 100)
                    }
                    className="w-20 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                  />
                  <span className="text-slate-400 font-mono">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                    Action Time Bank
                  </h3>
                  <p className="text-xs text-slate-500">Default time given to make a decision</p>
                </div>
                <div className="flex bg-black/50 border border-white/10 rounded-lg p-1">
                  {['15s', '30s', '60s'].map((time) => (
                    <button
                      key={time}
                      onClick={() => updateSection('gameplay', 'actionTimeBank', time)}
                      className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
                        settings.gameplay.actionTimeBank === time
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* NOTIFICATIONS SETTINGS */}
          {activeTab === 'NOTIFICATIONS' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                    Tournament Starting
                  </h3>
                  <p className="text-xs text-slate-500">
                    Alert when a registered tournament is about to start
                  </p>
                </div>
                <Toggle
                  checked={settings.notifications.tournamentStarting}
                  onChange={(v) => updateSection('notifications', 'tournamentStarting', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                    Table Closing
                  </h3>
                  <p className="text-xs text-slate-500">
                    Alert when a cash table is about to close
                  </p>
                </div>
                <Toggle
                  checked={settings.notifications.tableClosing}
                  onChange={(v) => updateSection('notifications', 'tableClosing', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                    New Tournament Available
                  </h3>
                  <p className="text-xs text-slate-500">
                    Alert when a new high-stakes tournament is announced
                  </p>
                </div>
                <Toggle
                  checked={settings.notifications.newTournament}
                  onChange={(v) => updateSection('notifications', 'newTournament', v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                    Level Change
                  </h3>
                  <p className="text-xs text-slate-500">
                    Alert when blinds increase in a tournament
                  </p>
                </div>
                <Toggle
                  checked={settings.notifications.levelChange}
                  onChange={(v) => updateSection('notifications', 'levelChange', v)}
                />
              </div>
            </motion.div>
          )}

          {/* ACCOUNT SETTINGS */}
          {activeTab === 'ACCOUNT' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-4 transition-colors">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-bold uppercase tracking-wider text-white">
                    Change Username
                  </span>
                </button>
                <button className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-4 transition-colors">
                  <Monitor className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-bold uppercase tracking-wider text-white">
                    Change Avatar
                  </span>
                </button>
              </div>

              <div className="h-px bg-white/10" />

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                    Player Primitives
                  </h3>
                  <p className="text-xs text-slate-500">
                    Create and persist unique player identities. Each player can be human, hybrid,
                    or fully agentic.
                  </p>
                </div>

                <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="New callsign"
                      className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                    />
                    <div className="flex items-center gap-2">
                      {PLAYER_AVATARS.map((avatar) => (
                        <button
                          key={avatar}
                          type="button"
                          onClick={() => setProfileForm((prev) => ({ ...prev, avatar }))}
                          className={`w-10 h-10 rounded-full border-2 overflow-hidden transition-all ${
                            profileForm.avatar === avatar
                              ? 'border-cyan-400 shadow-[0_0_10px_rgba(0,242,255,0.4)]'
                              : 'border-slate-800 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={avatar} alt="avatar" className="w-full h-full" />
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      {(['human', 'hybrid', 'agent'] as PlayerControlMode[]).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setProfileForm((prev) => ({ ...prev, controlMode: mode }))}
                          className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                            profileForm.controlMode === mode
                              ? 'bg-cyan-600 text-white border-cyan-400'
                              : 'bg-black/40 text-slate-400 border-slate-800 hover:border-slate-600'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addPlayerProfile}
                    className="w-full md:w-auto px-6 py-3 bg-cyan-600 text-white rounded-xl font-black uppercase tracking-widest border-b-4 border-cyan-800 hover:brightness-125 active:border-b-0 active:translate-y-1 transition-all"
                  >
                    Create Player
                  </button>
                </div>

                <div className="space-y-3">
                  {playerProfiles.length === 0 && (
                    <div className="text-xs text-slate-500 bg-black/30 border border-white/10 rounded-xl p-4">
                      No saved player primitives yet.
                    </div>
                  )}
                  {playerProfiles.map((profile, idx) => (
                    <div
                      key={profile.id}
                      className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider">
                            Callsign
                          </p>
                          <p className="text-sm font-mono text-white">{profile.name}</p>
                        </div>
                        <button
                          onClick={() => deletePlayerProfile(profile.name)}
                          className="text-xs text-rose-400 uppercase tracking-wider hover:text-rose-300"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {PLAYER_AVATARS.map((avatar) => (
                          <button
                            key={`${profile.id}-${avatar}`}
                            type="button"
                            onClick={() => updatePlayerProfile(idx, { avatar })}
                            className={`w-9 h-9 rounded-full border-2 overflow-hidden transition-all ${
                              profile.avatar === avatar
                                ? 'border-cyan-400 shadow-[0_0_10px_rgba(0,242,255,0.4)]'
                                : 'border-slate-800 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={avatar} alt="avatar" className="w-full h-full" />
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        {(['human', 'hybrid', 'agent'] as PlayerControlMode[]).map((mode) => (
                          <button
                            key={`${profile.id}-${mode}`}
                            type="button"
                            onClick={() => updatePlayerProfile(idx, { controlMode: mode })}
                            className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                              profile.controlMode === mode
                                ? 'bg-cyan-600 text-white border-cyan-400'
                                : 'bg-black/40 text-slate-400 border-slate-800 hover:border-slate-600'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                  Client Seed
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Used for Provably Fair cryptographic verification. Change this to ensure
                  randomness.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.account.clientSeed}
                    onChange={(e) => updateSection('account', 'clientSeed', e.target.value)}
                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-emerald-400 font-mono text-sm focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={() => {
                      // Use crypto.getRandomValues for provably-fair client seed.
                      // Math.random() is NOT cryptographically secure — its output
                      // is predictable and undermines the fairness guarantee.
                      const arr = new Uint8Array(24);
                      crypto.getRandomValues(arr);
                      const seed = Array.from(arr, (b) => b.toString(36).padStart(2, '0')).join('');
                      updateSection('account', 'clientSeed', seed);
                    }}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 flex items-center justify-center transition-colors"
                    title="Generate New Seed"
                  >
                    <RefreshCw className="w-4 h-4 text-cyan-400" />
                  </button>
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div className="space-y-4">
                <button className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-6 py-4 transition-colors">
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-slate-400" />
                    <div className="text-left">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        Export Data
                      </h4>
                      <p className="text-xs text-slate-500">
                        Download your hand history and account data
                      </p>
                    </div>
                  </div>
                </button>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center justify-between bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl px-6 py-4 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Trash2 className="w-5 h-5 text-rose-400 group-hover:text-rose-300" />
                      <div className="text-left">
                        <h4 className="text-sm font-bold text-rose-400 uppercase tracking-wider group-hover:text-rose-300">
                          Delete Account
                        </h4>
                        <p className="text-xs text-rose-400/70">
                          Permanently remove your account and data
                        </p>
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="bg-rose-950/50 border border-rose-500/50 rounded-xl p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-1">
                          Are you absolutely sure?
                        </h4>
                        <p className="text-xs text-rose-300/80">
                          This action cannot be undone. All your funds, hand history, and rankings
                          will be permanently deleted.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white text-sm font-bold uppercase tracking-wider py-3 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold uppercase tracking-wider py-3 rounded-lg transition-colors">
                        Yes, Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* BOT SETTINGS */}
          {activeTab === 'BOTS' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wider">
                  Player Bot Studio
                </h3>
                <p className="text-xs text-slate-500">
                  These bots fill empty seats when you start a table. The same game logic and RNG
                  applies to bots, AI agents, and humans.
                </p>
              </div>

              <div className="bg-black/50 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                    Create Bot
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">
                    {botRoster.length}/5 Slots
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Bot Name
                    </label>
                    <input
                      type="text"
                      value={botForm.name}
                      onChange={(e) => setBotForm({ ...botForm, name: e.target.value })}
                      placeholder="NEURAL_ECHO"
                      className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Temperament
                    </label>
                    <select
                      value={botForm.temperament}
                      onChange={(e) => setBotForm({ ...botForm, temperament: e.target.value })}
                      className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors appearance-none"
                    >
                      <option value="tight_aggressive">Tight Aggressive (TAG)</option>
                      <option value="loose_aggressive">Loose Aggressive (LAG)</option>
                      <option value="tight_passive">Tight Passive</option>
                      <option value="balanced">Balanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Risk Basis Points
                    </label>
                    <input
                      type="number"
                      min="100"
                      max="2000"
                      value={botForm.riskBps}
                      onChange={(e) => setBotForm({ ...botForm, riskBps: Number(e.target.value) })}
                      className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white font-mono outline-none transition-colors"
                    />
                  </div>
                  <div className="flex items-end justify-between bg-black/60 border border-slate-800 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        AI Assist
                      </p>
                      <p className="text-xs text-slate-500">Allow AI prompts mid-hand</p>
                    </div>
                    <Toggle
                      checked={!!botForm.aiAssist}
                      onChange={(v) => setBotForm({ ...botForm, aiAssist: v })}
                    />
                  </div>
                </div>
                <button
                  onClick={addBot}
                  disabled={botRoster.length >= 5 || !botForm.name.trim()}
                  className="w-full py-3 bg-cyan-600 rounded-xl font-black uppercase tracking-widest text-white border-b-4 border-cyan-800 hover:brightness-125 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
                >
                  Add Bot
                </button>
              </div>

              <div className="space-y-4">
                {loadingBots ? (
                  <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                  </div>
                ) : botRoster.length === 0 ? (
                  <div className="bg-[#0a0c1a]/80 border border-white/10 rounded-2xl p-10 text-center text-slate-500 text-xs font-mono">
                    No custom bots yet. Add one to personalize your tables.
                  </div>
                ) : null}
                {!loadingBots &&
                  botRoster.map((bot, idx) => (
                    <div
                      key={bot.id || idx}
                      className="bg-black/50 border border-white/10 rounded-2xl p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <input
                          type="text"
                          value={bot.name}
                          onChange={(e) => {
                            const newName = e.target.value;
                            setBotRoster((prev) =>
                              prev.map((b, i) => (i === idx ? { ...b, name: newName } : b))
                            );
                          }}
                          onBlur={() => updateBotOnServer(idx)}
                          className="flex-1 bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2 text-white font-mono outline-none transition-colors"
                        />
                        <button
                          onClick={() => removeBot(idx)}
                          className="px-4 py-2 rounded-xl border border-rose-500/40 text-rose-300 text-xs font-black uppercase tracking-widest hover:bg-rose-500/10"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                            Temperament
                          </label>
                          <select
                            value={bot.temperament}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBotRoster((prev) => {
                                const next = prev.map((b, i) =>
                                  i === idx ? { ...b, temperament: val } : b
                                );
                                return next;
                              });
                              // Wait for state to update or use callback
                              setTimeout(() => updateBotOnServer(idx), 50);
                            }}
                            className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2 text-white font-mono outline-none transition-colors appearance-none"
                          >
                            <option value="tight_aggressive">Tight Aggressive (TAG)</option>
                            <option value="loose_aggressive">Loose Aggressive (LAG)</option>
                            <option value="tight_passive">Tight Passive</option>
                            <option value="balanced">Balanced</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                            Risk Basis Points
                          </label>
                          <input
                            type="number"
                            min="100"
                            max="2000"
                            value={bot.riskBps}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setBotRoster((prev) =>
                                prev.map((b, i) => (i === idx ? { ...b, riskBps: val } : b))
                              );
                            }}
                            onBlur={() => updateBotOnServer(idx)}
                            className="w-full bg-black/60 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2 text-white font-mono outline-none transition-colors"
                          />
                        </div>
                        <div className="flex items-center justify-between bg-black/60 border border-slate-800 rounded-xl px-4 py-2 sm:col-span-2">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                              AI Assist
                            </p>
                            <p className="text-xs text-slate-500">Allow AI prompts mid-hand</p>
                          </div>
                          <Toggle
                            checked={!!bot.aiAssist}
                            onChange={(v) => {
                              setBotRoster((prev) =>
                                prev.map((b, i) => (i === idx ? { ...b, aiAssist: v } : b))
                              );
                              setTimeout(() => updateBotOnServer(idx), 50);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0c1a]/95 backdrop-blur-xl border-t border-white/10 p-4 z-50">
        <div className="max-w-4xl mx-auto flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          >
            <Save className="w-5 h-5" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
