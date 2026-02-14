import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/premium';
import { PremiumButton } from '@/components/ui/premium';
import { PremiumInput } from '@/components/ui/premium';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Bell, 
  Shield, 
  Palette, 
  Database, 
  Clock, 
  Users,
  BarChart3,
  Save,
  RefreshCw
} from 'lucide-react';

interface DashboardSettingsProps {}

const DashboardSettings: React.FC<DashboardSettingsProps> = () => {
  const [settings, setSettings] = useState({
    refreshInterval: '30',
    autoRefresh: true,
    showNotifications: true,
    darkMode: false,
    compactView: false,
    showMetrics: true,
    maxDataPoints: '100',
    retentionDays: '30',
    enableAlerts: true,
    alertThreshold: '80'
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Dashboard settings saved:', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSettings({
      refreshInterval: '30',
      autoRefresh: true,
      showNotifications: true,
      darkMode: false,
      compactView: false,
      showMetrics: true,
      maxDataPoints: '100',
      retentionDays: '30',
      enableAlerts: true,
      alertThreshold: '80'
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Dashboard Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure your dashboard preferences and display options
          </p>
        </div>
        <div className="flex gap-2">
          <PremiumButton variant="outline" onClick={handleReset} icon={RefreshCw}>
            Reset
          </PremiumButton>
          <PremiumButton onClick={handleSave} disabled={isLoading} icon={Save}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </PremiumButton>
        </div>
      </div>

      <Tabs defaultValue="display" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="display" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Display
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="display" className="space-y-6">
          <GlassCard title="Display Preferences" subtitle="Customize how your dashboard looks and feels">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Dark Mode</Label>
                  <div className="text-sm text-muted-foreground">
                    Enable dark theme for the dashboard
                  </div>
                </div>
                <Switch
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, darkMode: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Compact View</Label>
                  <div className="text-sm text-muted-foreground">
                    Use a more compact layout to show more information
                  </div>
                </div>
                <Switch
                  checked={settings.compactView}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, compactView: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Show Metrics</Label>
                  <div className="text-sm text-muted-foreground">
                    Display performance metrics and statistics
                  </div>
                </div>
                <Switch
                  checked={settings.showMetrics}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, showMetrics: checked }))
                  }
                />
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <GlassCard title="Data Management" subtitle="Configure data retention and display limits">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxDataPoints">Max Data Points</Label>
                  <Select
                    value={settings.maxDataPoints}
                    onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, maxDataPoints: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50 points</SelectItem>
                      <SelectItem value="100">100 points</SelectItem>
                      <SelectItem value="200">200 points</SelectItem>
                      <SelectItem value="500">500 points</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retentionDays">Data Retention (Days)</Label>
                  <Select
                    value={settings.retentionDays}
                    onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, retentionDays: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <GlassCard title="Notification Settings" subtitle="Manage alerts and notification preferences">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Show Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    Display system notifications and alerts
                  </div>
                </div>
                <Switch
                  checked={settings.showNotifications}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, showNotifications: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Alerts</Label>
                  <div className="text-sm text-muted-foreground">
                    Receive alerts when thresholds are exceeded
                  </div>
                </div>
                <Switch
                  checked={settings.enableAlerts}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, enableAlerts: checked }))
                  }
                />
              </div>

              {settings.enableAlerts && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="alertThreshold">Alert Threshold (%)</Label>
                    <PremiumInput
                      id="alertThreshold"
                      type="number"
                      min="0"
                      max="100"
                      value={settings.alertThreshold}
                      onChange={(e) =>
                        setSettings(prev => ({ ...prev, alertThreshold: e.target.value }))
                      }
                      className="max-w-xs"
                    />
                    <div className="text-sm text-muted-foreground">
                      Trigger alerts when metrics exceed this percentage
                    </div>
                  </div>
                </>
              )}
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <GlassCard title="Performance Settings" subtitle="Configure refresh rates and performance options">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto Refresh</Label>
                  <div className="text-sm text-muted-foreground">
                    Automatically refresh dashboard data
                  </div>
                </div>
                <Switch
                  checked={settings.autoRefresh}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, autoRefresh: checked }))
                  }
                />
              </div>

              {settings.autoRefresh && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="refreshInterval">Refresh Interval (seconds)</Label>
                    <Select
                      value={settings.refreshInterval}
                      onValueChange={(value) => 
                        setSettings(prev => ({ ...prev, refreshInterval: value }))
                      }
                    >
                      <SelectTrigger className="max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                        <SelectItem value="600">10 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Performance Status</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Load Time</span>
                    </div>
                    <Badge variant="secondary">1.2s</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Active Users</span>
                    </div>
                    <Badge variant="secondary">24</Badge>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardSettings;