// @ts-nocheck
import {
  GlassCard,
  PremiumButton,
  PremiumInput,
  PremiumSelect,
  ToggleSwitch,
} from '@/components/ui/premium';
import { Bell, Clock, Globe, Palette, Save, Shield, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface GeneralSettingsData {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  privacy: {
    analytics: boolean;
    crashReports: boolean;
    usageData: boolean;
  };
  performance: {
    autoSave: boolean;
    autoSaveInterval: number;
    maxConcurrentTasks: number;
  };
}

export default function GeneralSettings() {
  const [settings, setSettings] = useState<GeneralSettingsData>({
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
    notifications: {
      email: true,
      push: true,
      desktop: false,
    },
    privacy: {
      analytics: true,
      crashReports: true,
      usageData: false,
    },
    performance: {
      autoSave: true,
      autoSaveInterval: 30,
      maxConcurrentTasks: 5,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch current settings from backend
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/general');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/general', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        // Show success message
        console.log('Settings saved successfully');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (path: string, value: string | number | boolean) => {
    setSettings((prev) => {
      const keys = path.split('.');
      const newSettings = { ...prev };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let current: Record<string, any> = newSettings;

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between animate-slide-in-down">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              System Configuration
            </h1>
            <p className="text-slate-300 mt-2">Configure your high-tech intelligence platform</p>
          </div>
          <PremiumButton onClick={handleSave} disabled={saving} variant="gradient" size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </PremiumButton>
        </div>

        {/* Appearance */}
        <GlassCard className="animate-slide-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-md bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Appearance</h2>
              <p className="text-slate-400 text-sm">Customize the visual interface</p>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Theme</label>
              <PremiumSelect
                value={settings.theme}
                onChange={(e) => updateSetting('theme', e.target.value)}
                icon={<Palette className="w-4 h-4" />}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </PremiumSelect>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Language</label>
              <PremiumSelect
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
                icon={<Globe className="w-4 h-4" />}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
              </PremiumSelect>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Timezone</label>
              <PremiumSelect
                value={settings.timezone}
                onChange={(e) => updateSetting('timezone', e.target.value)}
                icon={<Clock className="w-4 h-4" />}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </PremiumSelect>
            </div>
          </div>
        </GlassCard>

        {/* Notifications */}
        <GlassCard className="animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-md bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Notifications</h2>
              <p className="text-slate-400 text-sm">Manage notification preferences</p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-md bg-transparent/5 border border-white/10">
              <div>
                <label htmlFor="email-notifications" className="text-sm font-medium text-white">
                  Email Notifications
                </label>
                <p className="text-xs text-slate-400">Receive notifications via email</p>
              </div>
              <ToggleSwitch
                id="email-notifications"
                checked={settings.notifications.email}
                onChange={(checked) => updateSetting('notifications.email', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-md bg-transparent/5 border border-white/10">
              <div>
                <label htmlFor="push-notifications" className="text-sm font-medium text-white">
                  Push Notifications
                </label>
                <p className="text-xs text-slate-400">Receive push notifications on mobile</p>
              </div>
              <ToggleSwitch
                id="push-notifications"
                checked={settings.notifications.push}
                onChange={(checked) => updateSetting('notifications.push', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-md bg-transparent/5 border border-white/10">
              <div>
                <label htmlFor="desktop-notifications" className="text-sm font-medium text-white">
                  Desktop Notifications
                </label>
                <p className="text-xs text-slate-400">Show desktop notifications</p>
              </div>
              <ToggleSwitch
                id="desktop-notifications"
                checked={settings.notifications.desktop}
                onChange={(checked) => updateSetting('notifications.desktop', checked)}
              />
            </div>
          </div>
        </GlassCard>

        {/* Privacy */}
        <GlassCard className="animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-md bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Privacy</h2>
              <p className="text-slate-400 text-sm">Control your data and privacy</p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-md bg-transparent/5 border border-white/10">
              <div>
                <label htmlFor="analytics-privacy" className="text-sm font-medium text-white">
                  Analytics
                </label>
                <p className="text-xs text-slate-400">
                  Help improve the platform by sharing anonymous usage data
                </p>
              </div>
              <ToggleSwitch
                id="analytics-privacy"
                checked={settings.privacy.analytics}
                onChange={(checked) => updateSetting('privacy.analytics', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-md bg-transparent/5 border border-white/10">
              <div>
                <label htmlFor="crash-reports" className="text-sm font-medium text-white">
                  Crash Reports
                </label>
                <p className="text-xs text-slate-400">
                  Automatically send crash reports to help fix issues
                </p>
              </div>
              <ToggleSwitch
                id="crash-reports"
                checked={settings.privacy.crashReports}
                onChange={(checked) => updateSetting('privacy.crashReports', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-md bg-transparent/5 border border-white/10">
              <div>
                <label htmlFor="usage-data" className="text-sm font-medium text-white">
                  Usage Data
                </label>
                <p className="text-xs text-slate-400">
                  Share detailed usage patterns for product improvement
                </p>
              </div>
              <ToggleSwitch
                id="usage-data"
                checked={settings.privacy.usageData}
                onChange={(checked) => updateSetting('privacy.usageData', checked)}
              />
            </div>
          </div>
        </GlassCard>

        {/* Performance */}
        <GlassCard className="animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-md bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Performance</h2>
              <p className="text-slate-400 text-sm">Optimize system performance</p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-md bg-transparent/5 border border-white/10">
              <div>
                <label htmlFor="auto-save" className="text-sm font-medium text-white">
                  Auto Save
                </label>
                <p className="text-xs text-slate-400">Automatically save changes</p>
              </div>
              <ToggleSwitch
                id="auto-save"
                checked={settings.performance.autoSave}
                onChange={(checked) => updateSetting('performance.autoSave', checked)}
              />
            </div>

            <div>
              <label
                htmlFor="auto-save-interval"
                className="block text-sm font-medium mb-2 text-slate-300"
              >
                Auto Save Interval (seconds)
              </label>
              <PremiumInput
                id="auto-save-interval"
                type="number"
                min="10"
                max="300"
                value={settings.performance.autoSaveInterval.toString()}
                onChange={(e) =>
                  updateSetting('performance.autoSaveInterval', parseInt(e.target.value))
                }
                disabled={!settings.performance.autoSave}
              />
            </div>

            <div>
              <label
                htmlFor="max-concurrent-tasks"
                className="block text-sm font-medium mb-2 text-slate-300"
              >
                Max Concurrent Tasks
              </label>
              <PremiumInput
                id="max-concurrent-tasks"
                type="number"
                min="1"
                max="20"
                value={settings.performance.maxConcurrentTasks.toString()}
                onChange={(e) =>
                  updateSetting('performance.maxConcurrentTasks', parseInt(e.target.value))
                }
              />
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
