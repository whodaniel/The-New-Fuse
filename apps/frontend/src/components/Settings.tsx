import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PremiumButton as Button } from '@/components/ui/premium/PremiumButton';
import { Switch } from '@/components/ui/switch';
import { Lock, Settings as SettingsIcon } from 'lucide-react';
import React, { useState } from 'react';

interface SettingsState {
  enableLogging: boolean;
  debugMode: boolean;
  maxAgents: number;
  apiKey: string;
  webhookUrl: string;
}

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    enableLogging: true,
    debugMode: false,
    maxAgents: 10,
    apiKey: '',
    webhookUrl: '',
  });

  const handleToggle = (key: 'enableLogging' | 'debugMode') => (): void => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleTextChange =
    (key: 'apiKey' | 'webhookUrl') =>
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setSettings((prev) => ({
        ...prev,
        [key]: event.target.value,
      }));
    };

  const handleMaxAgentsChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSettings((prev) => ({
      ...prev,
      maxAgents: parseInt(event.target.value) || 0,
    }));
  };

  const handleVerifyConfig = (): void => {
    console.log('Verifying configuration:', settings);
    // Add verification logic here
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              System Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Logging</Label>
                <p className="text-sm text-gray-500">Record detailed system logs</p>
              </div>
              <Switch
                checked={settings.enableLogging}
                onCheckedChange={handleToggle('enableLogging')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Debug Mode</Label>
                <p className="text-sm text-gray-500">Enable detailed debugging information</p>
              </div>
              <Switch checked={settings.debugMode} onCheckedChange={handleToggle('debugMode')} />
            </div>

            <div className="space-y-2">
              <Label>Max Concurrent Agents</Label>
              <p className="text-sm text-gray-500 mb-2">
                Maximum number of agents that can run simultaneously
              </p>
              <Input
                type="number"
                value={settings.maxAgents}
                onChange={handleMaxAgentsChange}
                className="w-32"
                min={1}
                max={100}
              />
            </div>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key"
                value={settings.apiKey}
                onChange={handleTextChange('apiKey')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                type="url"
                placeholder="https://your-webhook-url.com"
                value={settings.webhookUrl}
                onChange={handleTextChange('webhookUrl')}
              />
            </div>

            <Button onClick={handleVerifyConfig} fullWidth>
              Verify Configuration
            </Button>
          </CardContent>
        </Card>

        {/* LLM Configuration placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>LLM Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">LLM selector component will be rendered here</p>
          </CardContent>
        </Card>

        {/* GPU Management placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>GPU Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">GPU manager component will be rendered here</p>
          </CardContent>
        </Card>

        {/* Webhook Management placeholder */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Webhook Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Webhook manager component will be rendered here</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
