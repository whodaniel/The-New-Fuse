import { AgentGrantList } from '@/components/ApiKeyManagement/AgentGrantList';
import { ProviderApiKeyList } from '@/components/ApiKeyManagement/ProviderApiKeyList';
import {
  GlassCard,
  PremiumButton,
  PremiumInput,
  PremiumSelect,
  ToggleSwitch,
} from '@/components/ui/premium';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/providers/AuthProvider';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Globe,
  Key,
  Loader2,
  Moon,
  Palette,
  Save,
  Settings2,
  Shield,
  Sun,
  Trash2,
  User,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type TabType = 'general' | 'account' | 'appearance' | 'notifications' | 'api';

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ElementType;
  description: string;
}

const navItems: NavItem[] = [
  { id: 'general', label: 'General', icon: Settings2, description: 'Language and region settings' },
  { id: 'account', label: 'Account', icon: User, description: 'Profile and security' },
  { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Theme and display' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alerts and updates' },
  { id: 'api', label: 'API Keys', icon: Key, description: 'Developer access' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 },
  },
};

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Toggle states for notifications
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [agentNotif, setAgentNotif] = useState(true);
  const [apiAccess, setApiAccess] = useState(true);
  const [autoSave, setAutoSave] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('tnf_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setEmailNotif(parsed.emailNotif ?? true);
        setPushNotif(parsed.pushNotif ?? true);
        setAgentNotif(parsed.agentNotif ?? true);
        setApiAccess(parsed.apiAccess ?? true);
        setAutoSave(parsed.autoSave ?? false);
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
  }, []);

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);
    setSaving(true);
    try {
      localStorage.setItem(
        'tnf_settings',
        JSON.stringify({
          emailNotif,
          pushNotif,
          agentNotif,
          apiAccess,
          autoSave,
          language: 'english',
          timezone: 'utc',
        })
      );
      setSaveSuccess(true);
    } catch (error) {
      console.error('Failed to save settings', error);
      setSaveError('Failed to persist settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 p-8 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 flex items-center gap-3">
            <Settings2 className="w-10 h-10 text-purple-400" />
            Settings
          </h1>
          <p className="text-gray-400 mt-2">
            Configure your workspace preferences and account settings
          </p>
        </motion.div>

        <div className="flex flex-col gap-6">
          {/* Top Navigation Tabs */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full"
          >
            <GlassCard>
              <nav className="flex flex-row overflow-x-auto p-2 gap-2 no-scrollbar">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.id}
                      variants={itemVariants}
                      onClick={() => setActiveTab(item.id)}
                      className={`min-w-[200px] text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 flex-shrink-0 ${
                        activeTab === item.id
                          ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 border border-purple-500/30 text-white'
                          : 'hover:bg-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          activeTab === item.id
                            ? 'bg-gradient-to-br from-purple-500 to-blue-500'
                            : 'bg-white/5'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.description}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </nav>
            </GlassCard>
          </motion.div>

          {/* Content Area */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === 'general' && (
                <motion.div
                  key="general"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <GlassCard
                    icon={Globe}
                    title="General Settings"
                    subtitle="Language, timezone, and preferences"
                    gradient="blue"
                  >
                    <div className="space-y-6 mt-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <Globe className="w-4 h-4 inline mr-2" />
                          Language
                        </label>
                        <PremiumSelect
                          defaultValue="english"
                          options={[
                            { value: 'english', label: 'English' },
                            { value: 'spanish', label: 'Spanish' },
                            { value: 'french', label: 'French' },
                            { value: 'german', label: 'German' },
                          ]}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <Zap className="w-4 h-4 inline mr-2" />
                          Time Zone
                        </label>
                        <PremiumSelect
                          defaultValue="utc"
                          options={[
                            { value: 'utc', label: 'UTC (Coordinated Universal Time)' },
                            { value: 'est', label: 'EST (Eastern Standard Time)' },
                            { value: 'pst', label: 'PST (Pacific Standard Time)' },
                            { value: 'gmt', label: 'GMT (Greenwich Mean Time)' },
                          ]}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                        <div>
                          <p className="font-medium text-white">Enable Auto-save</p>
                          <p className="text-sm text-gray-400">
                            Automatically save changes as you make them
                          </p>
                        </div>
                        <ToggleSwitch checked={autoSave} onChange={setAutoSave} />
                      </div>

                      <div className="pt-4">
                        <PremiumButton
                          onClick={handleSave}
                          disabled={saving}
                          icon={saving ? Loader2 : Save}
                          className={saving ? 'animate-pulse' : ''}
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </PremiumButton>
                        {saveError && <p className="text-sm text-red-400 mt-2">{saveError}</p>}
                        {saveSuccess && (
                          <p className="text-sm text-emerald-400 mt-2">Settings saved.</p>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {activeTab === 'account' && (
                <motion.div
                  key="account"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <GlassCard
                    icon={User}
                    title="Account Settings"
                    subtitle="Manage your profile and security"
                    gradient="purple"
                  >
                    <div className="space-y-6 mt-6">
                      {/* Profile Section */}
                      <div className="flex items-center gap-4 p-4 bg-black/20 rounded-xl border border-white/5">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center border border-white/10">
                          <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                            {user?.displayName?.[0] || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-xl font-semibold text-white">
                            {user?.displayName || 'Account'}
                          </p>
                          <p className="text-gray-400">{user?.email || ''}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                              <Shield className="w-3 h-3 inline mr-1" />
                              Verified
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Display Name
                        </label>
                        <PremiumInput
                          type="text"
                          defaultValue={user?.displayName || ''}
                          placeholder="Enter your display name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Email Address
                        </label>
                        <PremiumInput
                          type="email"
                          defaultValue={user?.email || ''}
                          placeholder="Enter your email"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <PremiumButton onClick={handleSave} disabled={saving} icon={Save}>
                          {saving ? 'Updating...' : 'Update Profile'}
                        </PremiumButton>
                        <PremiumButton variant="ghost" icon={Trash2}>
                          Delete Account
                        </PremiumButton>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {activeTab === 'appearance' && (
                <motion.div
                  key="appearance"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <GlassCard
                    icon={Palette}
                    title="Appearance Settings"
                    subtitle="Customize how the platform looks"
                    gradient="orange"
                  >
                    <div className="space-y-6 mt-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-4">
                          Theme Mode
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setTheme('light')}
                            className={`p-6 rounded-xl cursor-pointer transition-all border-2 ${
                              theme === 'light'
                                ? 'border-purple-500 bg-white/10'
                                : 'border-white/10 bg-black/20 hover:bg-white/5'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                <Sun className="w-6 h-6 text-white" />
                              </div>
                              <span className="text-white font-medium">Light</span>
                            </div>
                          </motion.div>

                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setTheme('default')}
                            className={`p-6 rounded-xl cursor-pointer transition-all border-2 ${
                              theme === 'default'
                                ? 'border-purple-500 bg-white/10'
                                : 'border-white/10 bg-black/20 hover:bg-white/5'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-700 flex items-center justify-center">
                                <Moon className="w-6 h-6 text-white" />
                              </div>
                              <span className="text-white font-medium">Dark</span>
                            </div>
                          </motion.div>

                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="p-6 rounded-xl border-2 border-white/10 bg-black/20 opacity-50 cursor-not-allowed"
                          >
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                                <Settings2 className="w-6 h-6 text-white" />
                              </div>
                              <span className="text-gray-400 font-medium">System</span>
                            </div>
                          </motion.div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Font Size
                        </label>
                        <PremiumSelect
                          defaultValue="medium"
                          options={[
                            { value: 'small', label: 'Small' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'large', label: 'Large' },
                          ]}
                        />
                      </div>

                      <div className="pt-4">
                        <PremiumButton onClick={handleSave} disabled={saving} icon={Save}>
                          Save Changes
                        </PremiumButton>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <GlassCard
                    icon={Bell}
                    title="Notification Settings"
                    subtitle="Control how you receive alerts"
                    gradient="green"
                  >
                    <div className="space-y-4 mt-6">
                      <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                        <div>
                          <p className="font-medium text-white">Email Notifications</p>
                          <p className="text-sm text-gray-400">
                            Receive email notifications for important updates
                          </p>
                        </div>
                        <ToggleSwitch checked={emailNotif} onChange={setEmailNotif} />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                        <div>
                          <p className="font-medium text-white">Push Notifications</p>
                          <p className="text-sm text-gray-400">
                            Receive push notifications in your browser
                          </p>
                        </div>
                        <ToggleSwitch checked={pushNotif} onChange={setPushNotif} />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                        <div>
                          <p className="font-medium text-white">Agent Activity Alerts</p>
                          <p className="text-sm text-gray-400">
                            Get notified when agents complete tasks
                          </p>
                        </div>
                        <ToggleSwitch checked={agentNotif} onChange={setAgentNotif} />
                      </div>

                      <div className="pt-4">
                        <PremiumButton onClick={handleSave} disabled={saving} icon={Save}>
                          Save Changes
                        </PremiumButton>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {activeTab === 'api' && (
                <motion.div
                  key="api"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <GlassCard
                    icon={Key}
                    title="API Keys"
                    subtitle="Manage your API access and AI configurations"
                    gradient="cyan"
                  >
                    <div className="mt-6">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6 flex items-start gap-3">
                        <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-400 mb-1">Secure Storage</h4>
                          <p className="text-sm text-gray-400">
                            Your keys are encrypted at rest. We never share them with third parties
                            except the respective providers.
                          </p>
                        </div>
                      </div>

                      <ProviderApiKeyList />
                      <div className="mt-6">
                        <AgentGrantList />
                      </div>

                      <div className="mt-8 pt-6 border-t border-white/10">
                        <h3 className="text-lg font-medium text-white mb-4">Legacy Settings</h3>
                        <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                          <div>
                            <p className="font-medium text-white">API Access</p>
                            <p className="text-sm text-gray-400">
                              Enable API access for external applications (Global)
                            </p>
                          </div>
                          <ToggleSwitch checked={apiAccess} onChange={setApiAccess} />
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
