import { GlassCard as Card } from '@/components/ui/premium/GlassCard';
import { PremiumButton as Button } from '@/components/ui/premium/PremiumButton';
import {
  PremiumInput as Input,
  ToggleSwitch as Switch,
} from '@/components/ui/premium/PremiumInput';
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

  const handleToggle =
    (key: 'enableLogging' | 'debugMode') =>
    (checked: boolean): void => {
      setSettings((prev) => ({
        ...prev,
        [key]: checked,
      }));
    };

  const handleTextChange =
    (key: 'apiKey' | 'webhookUrl' | 'maxAgents') =>
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const value = key === 'maxAgents' ? parseInt(event.target.value) || 0 : event.target.value;
      setSettings((prev) => ({
        ...prev,
        [key]: value,
      }));
    };

  const handleVerifyConfig = (): void => {
    console.log('Verifying configuration:', settings);
    // Add verification logic here
  };

  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* System Settings */}
        <Card title="System Settings" icon={SettingsIcon}>
          <div className="space-y-4">
            <Switch
              label="Enable Logging"
              description="Record detailed system logs"
              checked={settings.enableLogging}
              onChange={handleToggle('enableLogging')}
            />

            <Switch
              label="Debug Mode"
              description="Enable detailed debugging information"
              checked={settings.debugMode}
              onChange={handleToggle('debugMode')}
            />

            <Input
              label="Max Concurrent Agents"
              hint="Maximum number of agents that can run simultaneously"
              type="number"
              value={settings.maxAgents}
              onChange={handleTextChange('maxAgents')}
              min={1}
              max={100}
            />
          </div>
        </Card>

        {/* API Configuration */}
        <Card title="API Configuration" icon={Lock} gradient="purple">
          <div className="space-y-4">
            <Input
              id="apiKey"
              label="API Key"
              type="password"
              placeholder="Enter your API key"
              value={settings.apiKey}
              onChange={handleTextChange('apiKey')}
            />

            <Input
              id="webhookUrl"
              label="Webhook URL"
              type="url"
              placeholder="https://your-webhook-url.com"
              value={settings.webhookUrl}
              onChange={handleTextChange('webhookUrl')}
            />

            <Button onClick={handleVerifyConfig} fullWidth variant="gradient">
              Verify Configuration
            </Button>
          </div>
        </Card>

        {/* LLM Configuration placeholder */}
        <Card title="LLM Configuration">
          <p className="text-muted-foreground">LLM selector component will be rendered here</p>
        </Card>

        {/* GPU Management placeholder */}
        <Card title="GPU Management" gradient="cyan">
          <p className="text-muted-foreground">GPU manager component will be rendered here</p>
        </Card>

        {/* Webhook Management placeholder */}
        <Card title="Webhook Management" className="md:col-span-2" gradient="green">
          <p className="text-muted-foreground">Webhook manager component will be rendered here</p>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
