import React, { useState, useEffect } from 'react';

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

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const keys = path.split('.');
      const newSettings = { ...prev };
      let current: any = newSettings;
      
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">General Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Appearance */}
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Appearance</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => updateSetting('theme', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              title="Select theme preference"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Language</label>
            <select
              value={settings.language}
              onChange={(e) => updateSetting('language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              title="Select language preference"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => updateSetting('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              title="Select timezone"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Notifications</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="email-notifications" className="text-sm font-medium">Email Notifications</label>
              <p className="text-xs text-muted-foreground">Receive notifications via email</p>
            </div>
            <input
              id="email-notifications"
              type="checkbox"
              checked={settings.notifications.email}
              onChange={(e) => updateSetting('notifications.email', e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="push-notifications" className="text-sm font-medium">Push Notifications</label>
              <p className="text-xs text-muted-foreground">Receive push notifications on mobile</p>
            </div>
            <input
              id="push-notifications"
              type="checkbox"
              checked={settings.notifications.push}
              onChange={(e) => updateSetting('notifications.push', e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="desktop-notifications" className="text-sm font-medium">Desktop Notifications</label>
              <p className="text-xs text-muted-foreground">Show desktop notifications</p>
            </div>
            <input
              id="desktop-notifications"
              type="checkbox"
              checked={settings.notifications.desktop}
              onChange={(e) => updateSetting('notifications.desktop', e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Privacy</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="analytics-privacy" className="text-sm font-medium">Analytics</label>
              <p className="text-xs text-muted-foreground">Help improve the platform by sharing anonymous usage data</p>
            </div>
            <input
              id="analytics-privacy"
              type="checkbox"
              checked={settings.privacy.analytics}
              onChange={(e) => updateSetting('privacy.analytics', e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="crash-reports" className="text-sm font-medium">Crash Reports</label>
              <p className="text-xs text-muted-foreground">Automatically send crash reports to help fix issues</p>
            </div>
            <input
              id="crash-reports"
              type="checkbox"
              checked={settings.privacy.crashReports}
              onChange={(e) => updateSetting('privacy.crashReports', e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="usage-data" className="text-sm font-medium">Usage Data</label>
              <p className="text-xs text-muted-foreground">Share detailed usage patterns for product improvement</p>
            </div>
            <input
              id="usage-data"
              type="checkbox"
              checked={settings.privacy.usageData}
              onChange={(e) => updateSetting('privacy.usageData', e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Performance</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="auto-save" className="text-sm font-medium">Auto Save</label>
              <p className="text-xs text-muted-foreground">Automatically save changes</p>
            </div>
            <input
              id="auto-save"
              type="checkbox"
              checked={settings.performance.autoSave}
              onChange={(e) => updateSetting('performance.autoSave', e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
          </div>

          <div>
            <label htmlFor="auto-save-interval" className="block text-sm font-medium mb-2">Auto Save Interval (seconds)</label>
            <input
              id="auto-save-interval"
              type="number"
              min="10"
              max="300"
              value={settings.performance.autoSaveInterval}
              onChange={(e) => updateSetting('performance.autoSaveInterval', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={!settings.performance.autoSave}
            />
          </div>

          <div>
            <label htmlFor="max-concurrent-tasks" className="block text-sm font-medium mb-2">Max Concurrent Tasks</label>
            <input
              id="max-concurrent-tasks"
              type="number"
              min="1"
              max="20"
              value={settings.performance.maxConcurrentTasks}
              onChange={(e) => updateSetting('performance.maxConcurrentTasks', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}