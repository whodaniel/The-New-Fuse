import React from 'react';
import { Card } from '@/shared/ui/core/Card';
import { Switch } from '@/shared/ui/core/Switch';
import { Input } from '@/shared/ui/core/Input';
export function Settings({ onSettingChange }) {
    const [settings, setSettings] = React.useState({
        enableLogging: true,
        debugMode: false,
        maxAgents: 10,
        apiKey: '',
        webhookUrl: '',
    });
    const handleSettingChange = (setting, value) => {
        const newSettings = Object.assign(Object.assign({}, settings), { [setting]: value });
        setSettings(newSettings);
        onSettingChange === null || onSettingChange === void 0 ? void 0 : onSettingChange(setting, value);
    };
    return (<div className="space-y-6 p-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">System Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Enable Logging</h3>
              <p className="text-sm text-gray-500">Record detailed system logs</p>
            </div>
            <Switch checked={settings.enableLogging} onCheckedChange={(checked) => handleSettingChange('enableLogging', checked)}/>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Debug Mode</h3>
              <p className="text-sm text-gray-500">Enable detailed debugging information</p>
            </div>
            <Switch checked={settings.debugMode} onCheckedChange={(checked) => handleSettingChange('debugMode', checked)}/>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Max Concurrent Agents</h3>
            <p className="text-sm text-gray-500">Maximum number of agents that can run simultaneously</p>
            <Input type="number" value={settings.maxAgents.toString()} onChange={(e) => handleSettingChange('maxAgents', parseInt(e.target.value, 10))} className="w-32"/>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">API Key</h3>
            <p className="text-sm text-gray-500">Your API key for external services</p>
            <Input type="password" value={settings.apiKey} onChange={(e) => handleSettingChange('apiKey', e.target.value)} placeholder="Enter your API key"/>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Webhook URL</h3>
            <p className="text-sm text-gray-500">URL for webhook notifications</p>
            <Input type="url" value={settings.webhookUrl} onChange={(e) => handleSettingChange('webhookUrl', e.target.value)} placeholder="https://your-webhook-url.com"/>
          </div>
        </div>
      </Card>
    </div>);
}
//# sourceMappingURL=Settings.js.map