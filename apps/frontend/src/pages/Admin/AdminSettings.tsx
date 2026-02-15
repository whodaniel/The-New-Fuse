import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  PremiumButton as Button,
  GlassCard as Card,
  PremiumInput as Input,
  PremiumSelect as Select,
} from '@/components/ui/premium';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Database, RefreshCw, Save, Server, Shield } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface AdminSettings {
  system: {
    maintenanceMode: boolean;
    debugMode: boolean;
    logLevel: string;
    maxConcurrentUsers: number;
    sessionTimeout: number;
    backupFrequency: string;
  };
  security: {
    enforceSSL: boolean;
    requireMFA: boolean;
    passwordPolicy: {
      minLength: number;
      requireSpecialChars: boolean;
      requireNumbers: boolean;
      requireUppercase: boolean;
    };
    sessionSecurity: {
      maxSessions: number;
      ipWhitelist: string[];
    };
  };
  database: {
    connectionPoolSize: number;
    queryTimeout: number;
    enableQueryLogging: boolean;
    autoBackup: boolean;
    retentionDays: number;
  };
  notifications: {
    emailNotifications: boolean;
    slackIntegration: boolean;
    webhookUrl: string;
    alertThresholds: {
      cpuUsage: number;
      memoryUsage: number;
      diskUsage: number;
    };
  };
}

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettings>({
    system: {
      maintenanceMode: false,
      debugMode: false,
      logLevel: 'info',
      maxConcurrentUsers: 1000,
      sessionTimeout: 30,
      backupFrequency: 'daily',
    },
    security: {
      enforceSSL: true,
      requireMFA: false,
      passwordPolicy: {
        minLength: 8,
        requireSpecialChars: true,
        requireNumbers: true,
        requireUppercase: true,
      },
      sessionSecurity: {
        maxSessions: 5,
        ipWhitelist: [],
      },
    },
    database: {
      connectionPoolSize: 20,
      queryTimeout: 30,
      enableQueryLogging: false,
      autoBackup: true,
      retentionDays: 30,
    },
    notifications: {
      emailNotifications: true,
      slackIntegration: false,
      webhookUrl: '',
      alertThresholds: {
        cpuUsage: 80,
        memoryUsage: 85,
        diskUsage: 90,
      },
    },
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch admin settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save admin settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSystemSettings = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      system: {
        ...prev.system,
        [key]: value,
      },
    }));
  };

  const updateSecuritySettings = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: value,
      },
    }));
  };

  const updatePasswordPolicy = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      security: {
        ...prev.security,
        passwordPolicy: {
          ...prev.security.passwordPolicy,
          [key]: value,
        },
      },
    }));
  };

  const updateDatabaseSettings = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      database: {
        ...prev.database,
        [key]: value,
      },
    }));
  };

  const updateNotificationSettings = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));
  };

  const updateAlertThresholds = (key: string, value: number) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        alertThresholds: {
          ...prev.notifications.alertThresholds,
          [key]: value,
        },
      },
    }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Settings</h1>
          <p className="text-gray-400 mt-2">
            Manage system-wide configuration and security settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchSettings}
            disabled={loading}
            icon={RefreshCw}
            className={loading ? 'animate-spin' : ''}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={saveSettings}
            disabled={loading}
            icon={Save}
            className={saved ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-6">
          <Card title="System Configuration" gradient="blue">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maintenance-mode" className="text-gray-300">
                    Maintenance Mode
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="maintenance-mode"
                      checked={settings.system.maintenanceMode}
                      onCheckedChange={(checked) =>
                        updateSystemSettings('maintenanceMode', checked)
                      }
                    />
                    <span className="text-sm text-gray-400">
                      {settings.system.maintenanceMode ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="debug-mode" className="text-gray-300">
                    Debug Mode
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="debug-mode"
                      checked={settings.system.debugMode}
                      onCheckedChange={(checked) => updateSystemSettings('debugMode', checked)}
                    />
                    <span className="text-sm text-gray-400">
                      {settings.system.debugMode ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Select
                    label="Log Level"
                    value={settings.system.logLevel}
                    onChange={(e: any) => updateSystemSettings('logLevel', e.target.value)}
                    options={[
                      { value: 'error', label: 'Error' },
                      { value: 'warn', label: 'Warning' },
                      { value: 'info', label: 'Info' },
                      { value: 'debug', label: 'Debug' },
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <Select
                    label="Backup Frequency"
                    value={settings.system.backupFrequency}
                    onChange={(e: any) => updateSystemSettings('backupFrequency', e.target.value)}
                    options={[
                      { value: 'hourly', label: 'Hourly' },
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'monthly', label: 'Monthly' },
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    label="Max Concurrent Users"
                    id="max-users"
                    type="number"
                    value={settings.system.maxConcurrentUsers}
                    onChange={(e) =>
                      updateSystemSettings('maxConcurrentUsers', parseInt(e.target.value))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    label="Session Timeout (minutes)"
                    id="session-timeout"
                    type="number"
                    value={settings.system.sessionTimeout}
                    onChange={(e) =>
                      updateSystemSettings('sessionTimeout', parseInt(e.target.value))
                    }
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card title="Security Settings" gradient="purple">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="enforce-ssl" className="text-gray-300">
                    Enforce SSL
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enforce-ssl"
                      checked={settings.security.enforceSSL}
                      onCheckedChange={(checked) => updateSecuritySettings('enforceSSL', checked)}
                    />
                    <Badge variant={settings.security.enforceSSL ? 'default' : 'secondary'}>
                      {settings.security.enforceSSL ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="require-mfa" className="text-gray-300">
                    Require MFA
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="require-mfa"
                      checked={settings.security.requireMFA}
                      onCheckedChange={(checked) => updateSecuritySettings('requireMFA', checked)}
                    />
                    <Badge variant={settings.security.requireMFA ? 'default' : 'secondary'}>
                      {settings.security.requireMFA ? 'Required' : 'Optional'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5">
                <h3 className="text-lg font-semibold text-white">Password Policy</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Input
                      label="Minimum Length"
                      id="min-length"
                      type="number"
                      value={settings.security.passwordPolicy.minLength}
                      onChange={(e) => updatePasswordPolicy('minLength', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="require-special" className="text-gray-300">
                      Require Special Characters
                    </Label>
                    <Switch
                      id="require-special"
                      checked={settings.security.passwordPolicy.requireSpecialChars}
                      onCheckedChange={(checked) =>
                        updatePasswordPolicy('requireSpecialChars', checked)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="require-numbers" className="text-gray-300">
                      Require Numbers
                    </Label>
                    <Switch
                      id="require-numbers"
                      checked={settings.security.passwordPolicy.requireNumbers}
                      onCheckedChange={(checked) => updatePasswordPolicy('requireNumbers', checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="require-uppercase" className="text-gray-300">
                      Require Uppercase
                    </Label>
                    <Switch
                      id="require-uppercase"
                      checked={settings.security.passwordPolicy.requireUppercase}
                      onCheckedChange={(checked) =>
                        updatePasswordPolicy('requireUppercase', checked)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <Card title="Database Configuration" gradient="orange">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Input
                    label="Connection Pool Size"
                    id="pool-size"
                    type="number"
                    value={settings.database.connectionPoolSize}
                    onChange={(e) =>
                      updateDatabaseSettings('connectionPoolSize', parseInt(e.target.value))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    label="Query Timeout (seconds)"
                    id="query-timeout"
                    type="number"
                    value={settings.database.queryTimeout}
                    onChange={(e) =>
                      updateDatabaseSettings('queryTimeout', parseInt(e.target.value))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="query-logging" className="text-gray-300">
                    Enable Query Logging
                  </Label>
                  <Switch
                    id="query-logging"
                    checked={settings.database.enableQueryLogging}
                    onCheckedChange={(checked) =>
                      updateDatabaseSettings('enableQueryLogging', checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auto-backup" className="text-gray-300">
                    Auto Backup
                  </Label>
                  <Switch
                    id="auto-backup"
                    checked={settings.database.autoBackup}
                    onCheckedChange={(checked) => updateDatabaseSettings('autoBackup', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    label="Retention Days"
                    id="retention-days"
                    type="number"
                    value={settings.database.retentionDays}
                    onChange={(e) =>
                      updateDatabaseSettings('retentionDays', parseInt(e.target.value))
                    }
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card title="Notification Settings" gradient="green">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email-notifications" className="text-gray-300">
                    Email Notifications
                  </Label>
                  <Switch
                    id="email-notifications"
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      updateNotificationSettings('emailNotifications', checked)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slack-integration" className="text-gray-300">
                    Slack Integration
                  </Label>
                  <Switch
                    id="slack-integration"
                    checked={settings.notifications.slackIntegration}
                    onCheckedChange={(checked) =>
                      updateNotificationSettings('slackIntegration', checked)
                    }
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Input
                    label="Webhook URL"
                    id="webhook-url"
                    type="url"
                    placeholder="https://hooks.slack.com/..."
                    value={settings.notifications.webhookUrl}
                    onChange={(e) => updateNotificationSettings('webhookUrl', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5">
                <h3 className="text-lg font-semibold text-white">Alert Thresholds (%)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Input
                      label="CPU Usage"
                      id="cpu-threshold"
                      type="number"
                      min={0}
                      max={100}
                      value={settings.notifications.alertThresholds.cpuUsage}
                      onChange={(e) => updateAlertThresholds('cpuUsage', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Input
                      label="Memory Usage"
                      id="memory-threshold"
                      type="number"
                      min={0}
                      max={100}
                      value={settings.notifications.alertThresholds.memoryUsage}
                      onChange={(e) =>
                        updateAlertThresholds('memoryUsage', parseInt(e.target.value))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Input
                      label="Disk Usage"
                      id="disk-threshold"
                      type="number"
                      min={0}
                      max={100}
                      value={settings.notifications.alertThresholds.diskUsage}
                      onChange={(e) => updateAlertThresholds('diskUsage', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
