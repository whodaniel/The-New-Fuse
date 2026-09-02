import {
  AlertTriangle,
  Bell,
  Bot,
  Copy,
  Eye,
  EyeOff,
  Info,
  Palette,
  ShieldCheck,
  Wifi,
} from 'lucide-react';
import React, { useEffect, useRef, useState, type ComponentType } from 'react';
import TnfLogo from '../components/brand/TnfLogo';
import PageShell from '../components/layout/PageShell';
import { useTheme } from '../providers/ThemeProvider';

import { probeRestApiUrl } from '../config/endpointDiscovery';
import { getVoicePort } from '../config/voiceBridge';
import { resolveWebAppBaseUrl } from '../config/webSurfaces';
import { useOperatorSynergy } from '../hooks/useOperatorSynergy';
import { openExternal } from '../lib/openExternal';
import { relayAuthHint } from '../lib/relayAuthHint';
import { useSettingsStore } from '../stores/settingsStore';

type SettingsSection = {
  id: string;
  title: string;
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
};

/**
 * Settings Page - The New Fuse Desktop
 */
const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { environment, setEnvironment, customApiUrl, setCustomApiUrl, apiUrl } = useSettingsStore();
  const { state: synergy, rediscover } = useOperatorSynergy();
  const webAppUrl = resolveWebAppBaseUrl(environment);
  const [apiKey, setApiKey] = useState('');
  const voicePort = getVoicePort();

  const settingsSections: SettingsSection[] = [
    { id: 'connection', title: 'Connection', Icon: Wifi },
    { id: 'appearance', title: 'Appearance', Icon: Palette },
    { id: 'ai', title: 'AI Configuration', Icon: Bot },
    { id: 'notifications', title: 'Notifications', Icon: Bell },
    { id: 'advanced', title: 'Advanced', Icon: ShieldCheck },
    { id: 'about', title: 'About', Icon: Info },
  ];

  const [activeSection, setActiveSection] = useState('connection');
  const [isPolling, setIsPolling] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [fallbackProvider, setFallbackProvider] = useState('NVIDIA NIM');
  const [defaultProvider, setDefaultProvider] = useState('NVIDIA NIM');
  const [integrityStatus, setIntegrityStatus] = useState<string | null>(null);

  const handleRediscover = async () => {
    setIsPolling(true);
    await rediscover();
    setTimeout(() => setIsPolling(false), 800);
  };

  const runIntegrityCheck = async () => {
    setIntegrityStatus('Checking local runtime...');
    await rediscover();

    const probeHttp = async (url: string): Promise<boolean> => {
      try {
        const response = await fetch(url, {
          cache: 'no-store',
          signal: AbortSignal.timeout(2500),
        });
        return response.ok;
      } catch {
        return false;
      }
    };

    const normalizedApiUrl = synergy.apiUrl.replace(/\/$/, '');
    const [apiOk, voiceOk] = await Promise.all([
      normalizedApiUrl ? probeRestApiUrl(normalizedApiUrl, 2500) : Promise.resolve(false),
      probeHttp(`http://127.0.0.1:${voicePort}/mic_state`),
    ]);
    const relayOk = synergy.relayConnected;
    const passed = [apiOk, relayOk, voiceOk].filter(Boolean).length;

    setIntegrityStatus(
      `${passed}/3 local checks healthy: API ${apiOk ? 'online' : 'offline'}, Relay ${
        relayOk ? 'connected' : 'offline'
      }, Voice ${voiceOk ? 'online' : 'offline'}.`
    );
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const authHint = relayAuthHint(synergy);

  // A click sets activeSection directly, then scrollIntoView animates the
  // content under it — but that's the only writer of activeSection, so a
  // user scrolling manually (or landing here via a deep link) leaves the
  // left nav highlighting whatever was last clicked, or nothing at all,
  // regardless of which section is actually on screen. The observer below
  // keeps the highlight honest without fighting the click-driven scroll.
  const sectionIds = settingsSections.map((s) => s.id);
  const suppressObserverUntil = useRef(0);

  useEffect(() => {
    const targets = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (targets.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < suppressObserverUntil.current) {
          return;
        }
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) {
          setActiveSection(visible.target.id);
        }
      },
      { root: null, rootMargin: '-15% 0px -70% 0px', threshold: [0, 0.25, 0.5, 1] }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    // Ignore the observer for a moment so the smooth-scroll's transit through
    // intermediate sections doesn't flicker the highlight onto them. Only
    // ever called from a nav-button onClick, never during render.
    // eslint-disable-next-line react-hooks/purity
    suppressObserverUntil.current = Date.now() + 700;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <PageShell title="Settings" subtitle="Configure your workspace and connection preferences">
      <div className="settings-layout">
        <nav className="settings-nav">
          {settingsSections.map((section) => {
            const Icon = section.Icon;
            return (
              <button
                key={section.id}
                type="button"
                className={`nav-link ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => scrollToSection(section.id)}
              >
                <Icon size={16} strokeWidth={2} />
                <span>{section.title}</span>
              </button>
            );
          })}
        </nav>

        <div className="settings-content">
          {/* Connection Section */}
          <section id="connection" className="settings-section">
            <h2 className="section-title">Connection & Environment</h2>

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
                <label>Discovered local endpoints</label>
                <div className="endpoint-row">
                  <p>
                    API: <code className="url-code">{synergy.apiUrl}</code>
                    {' · '}
                    {synergy.apiOnline ? 'online' : 'offline'}
                  </p>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => copyToClipboard(synergy.apiUrl)}
                    title="Copy API URL"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <div className="endpoint-row">
                  <p>
                    Relay: <code className="url-code">{synergy.relayUrl}</code>
                    {' · '}
                    {synergy.relayConnected ? 'connected' : 'offline'}
                  </p>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => copyToClipboard(synergy.relayUrl)}
                    title="Copy Relay URL"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <div className="endpoint-row">
                  <p>
                    Voice: <code className="url-code">http://127.0.0.1:{voicePort}</code>
                  </p>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => copyToClipboard(`http://127.0.0.1:${voicePort}`)}
                    title="Copy Voice URL"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => void handleRediscover()}
                disabled={isPolling}
              >
                {isPolling ? 'Polling...' : 'Rediscover'}
              </button>
            </div>

            <div className="setting-item setting-item-stacked">
              <div className="setting-info">
                <label>Relay / federation authentication</label>
                <p>
                  Why agents, channels, and Mission Control's terminal mirror show "offline" even
                  when the relay process is up.
                </p>
              </div>
              {authHint ? (
                <div className="auth-hint-box">
                  <AlertTriangle size={16} />
                  <div>
                    <p>{authHint}</p>
                    <div className="auth-hint-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => copyToClipboard('RELAY_ALLOW_ANONYMOUS=1')}
                      >
                        <Copy size={12} style={{ marginRight: '4px' }} />
                        Copy RELAY_ALLOW_ANONYMOUS=1
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="auth-hint-ok">
                  {synergy.relayRegistered
                    ? 'Registered with the relay — no auth issue.'
                    : 'No auth error reported yet — waiting on a relay connection.'}
                </p>
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
                  className="icon-btn"
                  onClick={() => copyToClipboard(webAppUrl)}
                  title="Copy Web App URL"
                >
                  <Copy size={14} />
                </button>
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
            <h2 className="section-title">Appearance</h2>

            <div className="setting-item">
              <div className="setting-info">
                <label>Theme</label>
                <p>
                  Choose light, dark, or follow the OS. You can also toggle from the sidebar footer
                  or ⌘K → &quot;light/dark mode&quot;.
                </p>
              </div>
              <div className="theme-selector" role="group" aria-label="Theme">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`theme-btn ${theme === t ? 'active' : ''}`}
                    onClick={() => setTheme(t)}
                    aria-pressed={theme === t}
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
            <h2 className="section-title">AI Configuration</h2>

            <div className="setting-item">
              <div className="setting-info">
                <label>Default Provider</label>
                <p>Primary AI service for new conversations</p>
              </div>
              <select
                className="select-input"
                value={defaultProvider}
                onChange={(e) => setDefaultProvider(e.target.value)}
              >
                <option>NVIDIA NIM</option>
                <option>Groq</option>
                <option>SambaNova</option>
                <option>Cerebras</option>
                <option>DeepSeek</option>
                <option>Google Gemini</option>
                <option>OpenAI</option>
                <option>OpenRouter</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Fallback Provider</label>
                <p>Secondary provider used if the primary is unavailable</p>
              </div>
              <select
                className="select-input"
                value={fallbackProvider}
                onChange={(e) => setFallbackProvider(e.target.value)}
              >
                <option>NVIDIA NIM</option>
                <option>Groq</option>
                <option>SambaNova</option>
                <option>Cerebras</option>
                <option>DeepSeek</option>
                <option>Google Gemini</option>
                <option>OpenAI</option>
                <option>OpenRouter</option>
                <option>None</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>API Key</label>
                <p>
                  Provider API key (e.g. NVIDIA_API_KEY, GROQ_API_KEY, OPENAI_API_KEY,
                  GEMINI_API_KEY, OPENROUTER_API_KEY, DEEPSEEK_API_KEY) — stored securely
                </p>
              </div>
              <div className="password-input-wrapper">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  className="text-input"
                  placeholder="NVIDIA_API_KEY / GROQ_API_KEY / OPENAI_API_KEY ..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <button
                  type="button"
                  className="visibility-toggle"
                  onClick={() => setShowApiKey(!showApiKey)}
                  title={showApiKey ? 'Hide API Key' : 'Show API Key'}
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </section>

          {/* Notifications Section */}
          <section id="notifications" className="settings-section">
            <h2 className="section-title">Notifications</h2>

            <div className="setting-item">
              <div className="setting-info">
                <label>Routine Loop Completions</label>
                <p>Get notified when standard tasks finish</p>
              </div>
              <label className="toggle">
                <input type="checkbox" defaultChecked />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Critical Node Failures</label>
                <p>Get notified about severe agent or system failures</p>
              </div>
              <label className="toggle">
                <input type="checkbox" defaultChecked />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Agent Lifecycle Events</label>
                <p>Get notified about agent spawning and termination</p>
              </div>
              <label className="toggle">
                <input type="checkbox" />
                <span className="slider"></span>
              </label>
            </div>
          </section>

          {/* Advanced / Experimental Section */}
          <section id="advanced" className="settings-section">
            <h2 className="section-title">Advanced / Experimental</h2>

            <div className="setting-item">
              <div className="setting-info">
                <label>Retro Phosphor TUI Mode (Swarm Terminal)</label>
                <p>Enhance the vibrancy of terminal output in the Swarm Terminal surface.</p>
              </div>
              <input type="range" min="0" max="100" defaultValue="75" className="range-input" />
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Terminal Mirror Contrast</label>
                <p>Adjust the contrast of the live terminal mirror in Mission Control.</p>
              </div>
              <input type="range" min="0" max="100" defaultValue="50" className="range-input" />
            </div>
          </section>

          {/* About Section */}
          <section id="about" className="settings-section">
            <h2 className="section-title">About</h2>
            <div className="about-info">
              <div className="app-info">
                <TnfLogo size={56} />
                <div>
                  <h3>The New Fuse Desktop</h3>
                  <p>Version 4.1.0</p>
                </div>
              </div>
              <p className="tagline">"World Class or Nothing"</p>
              <div className="links">
                <a href="https://thenewfuse.com" target="_blank" rel="noopener noreferrer">
                  Website
                </a>
                <a href="https://docs.thenewfuse.com" target="_blank" rel="noopener noreferrer">
                  Documentation
                </a>
                <a
                  href="https://github.com/whodaniel/The-New-Fuse"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </div>
              <div className="integrity-check-wrapper" style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => runIntegrityCheck()}
                >
                  <ShieldCheck size={14} style={{ marginRight: '6px' }} />
                  Run System Integrity Check
                </button>
                {integrityStatus && (
                  <p
                    className="integrity-status"
                    style={{
                      marginTop: '12px',
                      fontSize: '13px',
                      color: 'var(--tnf-success, #10b981)',
                    }}
                  >
                    {integrityStatus}
                  </p>
                )}
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

        .brand-logo {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          object-fit: cover;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
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

        .icon-btn {
          background: transparent;
          border: none;
          color: var(--tnf-text-muted);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--tnf-text-primary);
        }

        .endpoint-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .endpoint-row p {
          margin-bottom: 0 !important;
        }

        .setting-item-stacked {
          flex-direction: column;
          align-items: stretch;
          gap: 12px;
        }

        .auth-hint-box {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid rgba(245, 158, 11, 0.4);
          background: rgba(245, 158, 11, 0.08);
          color: #fbbf24;
        }

        .auth-hint-box p {
          margin: 0 0 10px;
          font-size: 13px;
          color: var(--tnf-text-primary, #f8fafc);
        }

        .auth-hint-actions {
          display: flex;
          gap: 8px;
        }

        .auth-hint-ok {
          font-size: 13px;
          color: var(--tnf-text-muted);
          margin: 0;
        }
        
        .password-input-wrapper {
          position: relative;
          display: inline-block;
        }
        
        .visibility-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: var(--tnf-text-muted);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .visibility-toggle:hover {
          color: var(--tnf-text-primary);
        }

        .advanced-tui-controls {
          margin-top: 16px;
          border-top: 1px dashed var(--tnf-border);
          padding-top: 16px;
        }

        .advanced-tui-btn {
          background: transparent;
          border: none;
          color: var(--tnf-text-muted);
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0;
          transition: color 0.2s;
        }

        .advanced-tui-btn:hover {
          color: var(--tnf-primary-light);
        }

        .advanced-tui-panel {
          margin-top: 16px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 0 16px;
          border: 1px solid var(--tnf-border);
        }
        
        .range-input {
          width: 200px;
          accent-color: var(--tnf-primary);
        }
      `}</style>
    </PageShell>
  );
};

export default Settings;
