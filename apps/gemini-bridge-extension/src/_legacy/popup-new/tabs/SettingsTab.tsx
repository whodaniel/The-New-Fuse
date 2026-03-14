/**
 * Settings Tab - Extension Configuration
 */

import { useEffect, useState } from 'react';

interface Props {
  status: any;
}

interface Settings {
  relayUrl: string;
  autoReconnect: boolean;
  debugMode: boolean;
}

export default function SettingsTab({ status }: Props) {
  const [settings, setSettings] = useState<Settings>({
    relayUrl: 'ws://localhost:3001/ws',
    autoReconnect: true,
    debugMode: false,
  });

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
      if (response?.success && response.settings) {
        setSettings(response.settings);
      }
    });
  }, []);

  const handleSave = () => {
    chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      payload: settings,
    });
  };

  return (
    <div className="settings-tab">
      <div className="section">
        <div className="section-header">
          <span className="section-icon">🌐</span>
          <h2 className="section-title">Connection</h2>
        </div>

        <div className="form-group">
          <label className="form-label">Relay URL</label>
          <input
            type="text"
            className="form-input"
            value={settings.relayUrl}
            onChange={(e) => setSettings({ ...settings, relayUrl: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={settings.autoReconnect}
              onChange={(e) => setSettings({ ...settings, autoReconnect: e.target.checked })}
            />
            <span>Auto-reconnect on disconnect</span>
          </label>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <span className="section-icon">🔧</span>
          <h2 className="section-title">Advanced</h2>
        </div>

        <div className="form-group">
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={settings.debugMode}
              onChange={(e) => setSettings({ ...settings, debugMode: e.target.checked })}
            />
            <span>Enable debug mode</span>
          </label>
        </div>
      </div>

      <button className="btn btn-primary glow-cyan" onClick={handleSave}>
        💾 Save Settings
      </button>
    </div>
  );
}
