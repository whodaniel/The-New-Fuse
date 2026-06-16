import React, { useState } from 'react';
import PageShell from '../components/layout/PageShell';
import SynergyStatusBar from '../components/layout/SynergyStatusBar';
import { useTheme } from '../providers/ThemeProvider';

import { resolveWebAppBaseUrl } from '../config/webSurfaces';
import { openExternal } from '../lib/openExternal';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * Settings Page - The New Fuse Desktop
 */
const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { environment, setEnvironment, customApiUrl, setCustomApiUrl, apiUrl } = useSettingsStore();
  const webAppUrl = resolveWebAppBaseUrl(environment);
  const [apiKey, setApiKey] = useState('');

  const settingsSections = [
    { id: 'connection', title: 'Connection', icon: '🌐' },
    { id: 'appearance', title: 'Appearance', icon: '🎨' },
    { id: 'ai', title: 'AI Configuration', icon: '🤖' },
    { id: 'notifications', title: 'Notifications', icon: '🔔' },
    { id: 'about', title: 'About', icon: 'ℹ️' },
  ];

  const [activeSection, setActiveSection] = useState('connection');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <PageShell title="Settings" subtitle="Configure your workspace and connection preferences">
      <SynergyStatusBar />
      <div className="settings-layout">
        <nav className="settings-nav">
          {settingsSections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`nav-link ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => scrollToSection(section.id)}
            >
              <span>{section.icon}</span>
              <span>{section.title}</span>
            </button>
          ))}
        </nav>

        <div className="settings-content">
          {/* Connection Section */}
          <section id="connection" className="settings-section">
            <h2 className="section-title">🌐 Connection & Environment</h2>

            <div className="setting-item">
              <div className="setting-info">
                <label>Backend Environment</label>
                <p>Choose which environment to connect to</p>
              </div>
              <div className="env-selector">
                {(['local', 'sandbox', 'production', 'custom'] as const).map((env) => (
                  <button
                    key={env}
                    className={`env-btn ${environment === env ? 'active' : ''}`}
                    onClick={() => setEnvironment(env)}
                  >
                    <span className="env-icon">
                      {env === 'local'
                        ? '🏠'
                        : env === 'sandbox'
                          ? '🏗️'
                          : env === 'production'
                            ? '🚀'
                            : '⚙️'}
                    </span>
                    <span className="env-label">{env.charAt(0).toUpperCase() + env.slice(1)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Active API URL</label>
                <p>
                  Currently connecting to: <code className="url-code">{apiUrl}</code>
                </p>
              </div>
              {environment === 'custom' && (
                <input
                  type="text"
                  className="text-input"
                  placeholder="https://api.yourdomain.com"
                  value={customApiUrl}
                  onChange={(e) => setCustomApiUrl(e.target.value)}
                />
              )}
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Web App (thenewfuse.com parity)</label>
                <p>Full web surfaces open at this URL from Web Parity Hub</p>
              </div>
              <div className="web-app-row">
                <code className="url-code">{webAppUrl}</code>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => void openExternal(webAppUrl)}
                >
                  Open Web App
                </button>
              </div>
            </div>
          </section>

          {/* Appearance Section */}
          <section id="appearance" className="settings-section">
            <h2 className="section-title">🎨 Appearance</h2>

            <div className="setting-item">
              <div className="setting-info">
                <label>Theme</label>
                <p>Choose your preferred color scheme</p>
              </div>
              <div className="theme-selector">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    className={`theme-btn ${theme === t ? 'active' : ''}`}
                    onClick={() => setTheme(t)}
                  >
                    {t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '💻'}
                    <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Animations</label>
                <p>Enable smooth transitions</p>
              </div>
              <label className="toggle">
                <input type="checkbox" defaultChecked />
                <span className="slider"></span>
              </label>
            </div>
          </section>

          {/* AI Configuration Section */}
          <section id="ai" className="settings-section">
            <h2 className="section-title">🤖 AI Configuration</h2>

            <div className="setting-item">
              <div className="setting-info">
                <label>Default Provider</label>
                <p>Primary AI service for new conversations</p>
              </div>
              <select className="select-input">
                <option>Claude (Anthropic)</option>
                <option>GPT-4 (OpenAI)</option>
                <option>Gemini (Google)</option>
                <option>Perplexity</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>API Key</label>
                <p>Your provider API key (stored securely)</p>
              </div>
              <input
                type="password"
                className="text-input"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </section>

          {/* Notifications Section */}
          <section id="notifications" className="settings-section">
            <h2 className="section-title">🔔 Notifications</h2>

            <div className="setting-item">
              <div className="setting-info">
                <label>Task Completion</label>
                <p>Get notified when tasks finish</p>
              </div>
              <label className="toggle">
                <input type="checkbox" defaultChecked />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Agent Errors</label>
                <p>Get notified about agent failures</p>
              </div>
              <label className="toggle">
                <input type="checkbox" defaultChecked />
                <span className="slider"></span>
              </label>
            </div>
          </section>

          {/* About Section */}
          <section id="about" className="settings-section">
            <h2 className="section-title">ℹ️ About</h2>
            <div className="about-info">
              <div className="app-info">
                <span className="app-icon">🔥</span>
                <div>
                  <h3>TNF (The New Fuse) Desktop App</h3>
                  <p>Version 4.1.0</p>
                </div>
              </div>
              <p className="tagline">"World Class or Nothing"</p>
              <div className="links">
                <a href="https://thenewfuse.com" target="_blank" rel="noopener">
                  Website
                </a>
                <a href="https://docs.thenewfuse.com" target="_blank" rel="noopener">
                  Documentation
                </a>
                <a href="https://github.com/whodaniel/fuse" target="_blank" rel="noopener">
                  GitHub
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>

      <style>{`
        .page-container {
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
          min-height: 100%;
        }

        .page-header {
          margin-bottom: 32px;
        }

        .page-title {
          font-family: var(--tnf-font-heading);
          font-size: 32px;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .page-subtitle {
          color: var(--tnf-text-muted);
          margin: 4px 0 0;
        }

        .settings-layout {
          display: flex;
          gap: 32px;
        }

        .settings-nav {
          width: 200px;
          position: sticky;
          top: 32px;
          height: fit-content;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          text-align: left;
          border: none;
          background: transparent;
          cursor: pointer;
          font: inherit;
          padding: 12px 16px;
          border-radius: 8px;
          color: var(--tnf-text-muted);
          transition: all 0.2s;
          margin-bottom: 4px;
        }

        .nav-link:hover,
        .nav-link.active {
          background: var(--tnf-surface-hover);
          color: var(--tnf-text-primary);
        }

        .settings-content {
          flex: 1;
        }

        .settings-section {
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .section-title {
          font-family: var(--tnf-font-heading);
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 24px;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid var(--tnf-border);
        }

        .setting-item:last-child {
          border-bottom: none;
        }

        .setting-info label {
          font-weight: 500;
          display: block;
          margin-bottom: 4px;
        }

        .setting-info p {
          font-size: 13px;
          color: var(--tnf-text-muted);
          margin: 0;
        }

        .theme-selector {
          display: flex;
          gap: 8px;
        }

        .theme-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 16px;
          background: var(--tnf-surface-hover);
          border: 1px solid var(--tnf-border);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--tnf-text-primary);
          font-size: 12px;
        }

        .theme-btn.active {
          border-color: var(--tnf-primary);
          background: rgba(99, 102, 241, 0.1);
        }

        /* Environment Selector */
        .env-selector {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .env-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--tnf-border);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--tnf-text-primary);
        }

        .env-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .env-btn.active {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
          border-color: var(--tnf-primary);
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.1);
        }

        .env-icon {
          font-size: 18px;
        }

        .env-label {
          font-size: 14px;
          font-weight: 600;
        }

        .url-code {
          background: rgba(0, 0, 0, 0.3);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--tnf-primary-light);
          font-family: var(--tnf-font-mono);
          font-size: 12px;
        }

        .web-app-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .toggle {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 26px;
        }

        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background: var(--tnf-surface-active);
          border-radius: 26px;
          transition: 0.4s;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background: white;
          border-radius: 50%;
          transition: 0.4s;
        }

        .toggle input:checked + .slider {
          background: var(--tnf-primary);
        }

        .toggle input:checked + .slider:before {
          transform: translateX(22px);
        }

        .select-input, .text-input {
          background: var(--tnf-surface-hover);
          border: 1px solid var(--tnf-border);
          border-radius: 8px;
          padding: 10px 14px;
          color: var(--tnf-text-primary);
          font-size: 14px;
          min-width: 200px;
        }

        .text-input {
          min-width: 280px;
        }

        .about-info {
          text-align: center;
        }

        .app-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .app-icon {
          font-size: 48px;
        }

        .app-info h3 {
          margin: 0;
          font-family: var(--tnf-font-heading);
        }

        .app-info p {
          margin: 4px 0 0;
          color: var(--tnf-text-muted);
          font-size: 13px;
        }

        .tagline {
          font-style: italic;
          color: var(--tnf-primary-light);
          margin-bottom: 20px;
        }

        .links {
          display: flex;
          justify-content: center;
          gap: 24px;
        }

        .links a {
          color: var(--tnf-text-secondary);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }

        .links a:hover {
          color: var(--tnf-primary-light);
        }
      `}</style>
    </PageShell>
  );
};

export default Settings;
