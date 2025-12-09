import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../providers/AuthProvider';

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 bg-card p-4 rounded-lg shadow-sm border">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full text-left px-3 py-2 rounded-md ${
                activeTab === 'general' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`w-full text-left px-3 py-2 rounded-md ${
                activeTab === 'account' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              Account
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full text-left px-3 py-2 rounded-md ${
                activeTab === 'appearance'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              Appearance
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full text-left px-3 py-2 rounded-md ${
                activeTab === 'notifications'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`w-full text-left px-3 py-2 rounded-md ${
                activeTab === 'api' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              API Keys
            </button>
          </nav>
        </div>

        <div className="flex-1 bg-card p-6 rounded-lg shadow-sm border">
          {activeTab === 'general' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">General Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" id="language-label">
                    Language
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-background border rounded-md"
                    aria-labelledby="language-label"
                  >
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" id="timezone-label">
                    Time Zone
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-background border rounded-md"
                    aria-labelledby="timezone-label"
                  >
                    <option>UTC (Coordinated Universal Time)</option>
                    <option>EST (Eastern Standard Time)</option>
                    <option>PST (Pacific Standard Time)</option>
                    <option>GMT (Greenwich Mean Time)</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input type="checkbox" id="autoSave" className="mr-2" />
                  <label htmlFor="autoSave">Enable auto-save</label>
                </div>

                <div className="pt-4">
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary text-xl">{user?.displayName?.[0] || 'U'}</span>
                  </div>
                  <div>
                    <p className="font-medium">{user?.displayName || 'User'}</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Display Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-background border rounded-md"
                    title="Display Name"
                    defaultValue={user?.displayName || ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 bg-background border rounded-md"
                    title="Email"
                    defaultValue={user?.email || ''}
                  />
                </div>

                <div className="pt-4">
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 mr-2">
                    Update Profile
                  </button>
                  <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Appearance Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Theme</label>
                  <div className="grid grid-cols-3 gap-4">
                    <div
                      className={`border rounded-md p-4 flex items-center justify-center cursor-pointer bg-background ${theme === 'light' ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setTheme('light')}
                    >
                      <span>Light</span>
                    </div>
                    <div
                      className={`border rounded-md p-4 flex items-center justify-center cursor-pointer bg-gray-900 text-white ${theme === 'default' ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setTheme('default')}
                    >
                      <span>Dark</span>
                    </div>
                    <div className="border rounded-md p-4 flex items-center justify-center cursor-pointer bg-gradient-to-r from-gray-100 to-gray-900 text-gray-700 opacity-50 cursor-not-allowed">
                      <span>System</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" id="fontsize-label">
                    Font Size
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-background border rounded-md"
                    aria-labelledby="fontsize-label"
                  >
                    <option>Small</option>
                    <option selected>Medium</option>
                    <option>Large</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for important updates
                    </p>
                  </div>
                  <div className="relative inline-block w-12 h-6 rounded-full bg-muted">
                    <input
                      type="checkbox"
                      id="emailNotif"
                      className="sr-only"
                      aria-label="Toggle email notifications"
                    />
                    <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform"></span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <div className="relative inline-block w-12 h-6 rounded-full bg-primary">
                    <input
                      type="checkbox"
                      id="pushNotif"
                      className="sr-only"
                      checked
                      aria-label="Toggle push notifications"
                    />
                    <span className="absolute left-7 top-1 w-4 h-4 rounded-full bg-white transition-transform"></span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Agent Activity Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when agents complete tasks
                    </p>
                  </div>
                  <div className="relative inline-block w-12 h-6 rounded-full bg-primary">
                    <input
                      type="checkbox"
                      id="agentNotif"
                      className="sr-only"
                      checked
                      aria-label="Toggle agent activity alerts"
                    />
                    <span className="absolute left-7 top-1 w-4 h-4 rounded-full bg-white transition-transform"></span>
                  </div>
                </div>

                <div className="pt-4">
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">API Keys</h2>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm text-muted-foreground mb-2">Your API Key</p>
                  <div className="flex items-center">
                    <input
                      type="password"
                      className="flex-1 px-3 py-2 bg-background border rounded-md mr-2"
                      value={import.meta.env.VITE_STRIPE_API_KEY || 'Not configured'}
                      title="API Key"
                      readOnly
                    />
                    <button className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    API keys are managed securely. Contact support to regenerate your key.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">API Access</p>
                    <p className="text-sm text-muted-foreground">
                      Enable API access for external applications
                    </p>
                  </div>
                  <div className="relative inline-block w-12 h-6 rounded-full bg-primary">
                    <input
                      type="checkbox"
                      id="apiAccess"
                      className="sr-only"
                      checked
                      aria-label="Toggle API access"
                    />
                    <span className="absolute left-7 top-1 w-4 h-4 rounded-full bg-white transition-transform"></span>
                  </div>
                </div>

                <div className="pt-4">
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 mr-2">
                    Generate New Key
                  </button>
                  <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90">
                    Revoke All Keys
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
