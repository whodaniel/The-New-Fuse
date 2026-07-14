import React, { useEffect, useState } from 'react';
import type { BrowserControlState } from '../../hooks/useBrowserControl';
import type { FederationNodeState } from '../../hooks/useFederationNode';
import type { TnfBrowserHookState } from '../../hooks/useTnfBrowser';
import FederationChannelPanel from '../federation/FederationChannelPanel';

interface BrowserControlPanelProps {
  tnf: TnfBrowserHookState;
  onTnfConnect: () => Promise<boolean>;
  onTnfDisconnect: () => Promise<void>;
  onTnfStart: () => Promise<{ ok: boolean; message: string }>;
  onTnfNavigate: (url: string) => Promise<unknown>;
  onTnfReload: () => Promise<void>;
  onTnfScreenshot: () => Promise<unknown>;
  onTnfDiscover: () => Promise<unknown>;
  onTnfHtml: () => Promise<unknown>;
  onTnfClick: (selectorOrHandle: string) => Promise<unknown>;
  onTnfRefreshTabs: () => Promise<unknown>;
  state: BrowserControlState;
  federation: FederationNodeState;
  onConnect: () => void;
  onFederationConnect: () => Promise<boolean>;
  onFederationRefresh: () => void;
  onSelectChannel: (channelId: string) => void;
  onCreateChannel: (name: string) => void;
  onJoinChannel: (channelId: string) => void;
  onLeaveChannel: (channelId: string) => void;
  onSendChannelMessage: (content: string, channelId?: string) => void;
  onPauseChannel: (channelId: string) => void;
  onResumeChannel: (channelId: string) => void;
  onNavigate: (url: string) => Promise<unknown>;
  onBack: () => Promise<void>;
  onForward: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onScreenshot: () => Promise<unknown>;
  onAnalyze: () => Promise<unknown>;
  onStartSession: () => Promise<unknown>;
  onEndSession: () => Promise<void>;
  onOpenNative: (url: string) => Promise<void>;
  onRefreshTabs: () => Promise<void>;
}

export const BrowserControlPanel: React.FC<BrowserControlPanelProps> = ({
  tnf,
  onTnfConnect,
  onTnfDisconnect,
  onTnfStart,
  onTnfNavigate,
  onTnfReload,
  onTnfScreenshot,
  onTnfDiscover,
  onTnfHtml,
  onTnfClick,
  onTnfRefreshTabs,
  state,
  federation,
  onConnect,
  onFederationConnect,
  onFederationRefresh,
  onSelectChannel,
  onCreateChannel,
  onJoinChannel,
  onLeaveChannel,
  onSendChannelMessage,
  onPauseChannel,
  onResumeChannel,
  onNavigate,
  onBack,
  onForward,
  onRefresh,
  onScreenshot,
  onAnalyze,
  onStartSession,
  onEndSession,
  onOpenNative,
  onRefreshTabs,
}) => {
  const [activeTab, setActiveTab] = useState<'tnf' | 'legacy' | 'federation'>('tnf');
  const [urlInput, setUrlInput] = useState(tnf.currentUrl || 'https://example.com');
  const [selectorInput, setSelectorInput] = useState('button');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (tnf.currentUrl) setUrlInput(tnf.currentUrl);
  }, [tnf.currentUrl]);

  const run = async (label: string, action: () => Promise<unknown>) => {
    setBusy(label);
    try {
      await action();
    } finally {
      setBusy(null);
    }
  };

  const connected = Boolean(tnf.status?.connected);
  const listening = Boolean(tnf.status?.listening);
  const runtime = Boolean(tnf.status?.runtimeConnected);
  const effectiveBusy = busy || tnf.busy;

  const tabBar = (
    <div className="panel-tabs">
      <button
        className={activeTab === 'tnf' ? 'tab active' : 'tab'}
        onClick={() => setActiveTab('tnf')}
        type="button"
      >
        TNF Browser
      </button>
      <button
        className={activeTab === 'legacy' ? 'tab active' : 'tab'}
        onClick={() => setActiveTab('legacy')}
        type="button"
      >
        Relay
      </button>
      <button
        className={activeTab === 'federation' ? 'tab active' : 'tab'}
        onClick={() => setActiveTab('federation')}
        type="button"
      >
        Federation
      </button>
    </div>
  );

  if (activeTab === 'federation') {
    return (
      <aside className="browser-control-panel federation-mode">
        {tabBar}
        <FederationChannelPanel
          state={federation}
          onConnect={onFederationConnect}
          onRefresh={onFederationRefresh}
          onSelectChannel={onSelectChannel}
          onCreateChannel={onCreateChannel}
          onJoinChannel={onJoinChannel}
          onLeaveChannel={onLeaveChannel}
          onSendMessage={onSendChannelMessage}
          onPauseChannel={onPauseChannel}
          onResumeChannel={onResumeChannel}
        />
        <style>{panelCss}</style>
      </aside>
    );
  }

  if (activeTab === 'legacy') {
    return (
      <aside className="browser-control-panel">
        {tabBar}
        <header className="panel-header">
          <h2>Legacy Relay</h2>
          <p>Chrome extension path via the TNF harness relay (port 3000).</p>
        </header>

        <section className="panel-section">
          <h3>Connection</h3>
          <div className="status-grid">
            <StatusPill label="Relay" ok={state.relayConnected} />
            <StatusPill label="Extension" ok={state.extensionConnected} />
            <StatusPill label="Session" ok={state.sessionActive} />
          </div>
          {!state.relayConnected && (
            <button className="panel-btn primary" disabled={state.connecting} onClick={onConnect}>
              {state.connecting ? 'Connecting…' : 'Connect Relay'}
            </button>
          )}
          {state.lastError && <p className="panel-error">{state.lastError}</p>}
        </section>

        <section className="panel-section">
          <h3>Navigate</h3>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void run('navigate', () => onNavigate(urlInput));
            }}
          >
            <input
              className="panel-input"
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              placeholder="https://example.com"
            />
            <div className="panel-row">
              <button className="panel-btn primary" type="submit" disabled={!!effectiveBusy}>
                Go
              </button>
              <button
                className="panel-btn"
                type="button"
                disabled={!!effectiveBusy}
                onClick={() => void run('native', () => onOpenNative(urlInput))}
              >
                Native
              </button>
            </div>
          </form>
          <div className="panel-row">
            <button
              className="panel-btn"
              disabled={!!effectiveBusy}
              onClick={() => void run('back', onBack)}
            >
              Back
            </button>
            <button
              className="panel-btn"
              disabled={!!effectiveBusy}
              onClick={() => void run('forward', onForward)}
            >
              Forward
            </button>
            <button
              className="panel-btn"
              disabled={!!effectiveBusy}
              onClick={() => void run('refresh', onRefresh)}
            >
              Reload
            </button>
          </div>
        </section>

        <section className="panel-section">
          <h3>Operator Actions</h3>
          <div className="panel-row wrap">
            <button
              className="panel-btn"
              disabled={!!effectiveBusy || !state.extensionConnected}
              onClick={() => void run('screenshot', onScreenshot)}
            >
              Screenshot
            </button>
            <button
              className="panel-btn"
              disabled={!!effectiveBusy || !state.extensionConnected}
              onClick={() => void run('analyze', onAnalyze)}
            >
              Analyze
            </button>
            <button
              className="panel-btn"
              disabled={!!effectiveBusy || !state.extensionConnected}
              onClick={() => void run('tabs', onRefreshTabs)}
            >
              Refresh Tabs
            </button>
            {!state.sessionActive ? (
              <button
                className="panel-btn"
                disabled={!!effectiveBusy || !state.extensionConnected}
                onClick={() => void run('session', onStartSession)}
              >
                Start Session
              </button>
            ) : (
              <button
                className="panel-btn danger"
                disabled={!!effectiveBusy}
                onClick={() => void onEndSession()}
              >
                End Session
              </button>
            )}
          </div>
        </section>
        <style>{panelCss}</style>
      </aside>
    );
  }

  return (
    <aside className="browser-control-panel">
      {tabBar}
      <header className="panel-header">
        <h2>TNF Browser</h2>
        <p>
          Live DOM control over ws://127.0.0.1:{tnf.status?.port || 7331} — discover, click, html,
          screenshot.
        </p>
      </header>

      <section className="panel-section">
        <h3>Runtime</h3>
        <div className="status-grid">
          <StatusPill label="Server" ok={listening} />
          <StatusPill label="Client" ok={connected} />
          <StatusPill label="Extension" ok={runtime} />
        </div>
        <div className="panel-row wrap">
          {!listening && (
            <button
              className="panel-btn primary"
              disabled={!!effectiveBusy}
              onClick={() => void run('start', onTnfStart)}
            >
              Start TNF Browser
            </button>
          )}
          {!connected ? (
            <button
              className="panel-btn primary"
              disabled={!!effectiveBusy || tnf.connecting || !listening}
              onClick={() => void run('connect', onTnfConnect)}
            >
              {tnf.connecting ? 'Connecting…' : 'Connect'}
            </button>
          ) : (
            <button
              className="panel-btn"
              disabled={!!effectiveBusy}
              onClick={() => void run('disconnect', onTnfDisconnect)}
            >
              Disconnect
            </button>
          )}
        </div>
        {!listening && (
          <p className="panel-hint">
            Or from a terminal: <code>node packages/tnf-browser/bin/cli.js start</code>
          </p>
        )}
        {(tnf.lastError || tnf.status?.lastError) && (
          <p className="panel-error">{tnf.lastError || tnf.status?.lastError}</p>
        )}
      </section>

      <section className="panel-section">
        <h3>Navigate</h3>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void run('navigate', () => onTnfNavigate(urlInput));
          }}
        >
          <input
            className="panel-input"
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            placeholder="https://example.com"
            aria-label="TNF Browser URL"
          />
          <div className="panel-row">
            <button
              className="panel-btn primary"
              type="submit"
              disabled={!!effectiveBusy || !connected}
            >
              Go
            </button>
            <button
              className="panel-btn"
              type="button"
              disabled={!!effectiveBusy || !connected}
              onClick={() => void run('reload', onTnfReload)}
            >
              Reload
            </button>
            <button
              className="panel-btn"
              type="button"
              disabled={!!effectiveBusy || !connected}
              onClick={() => void run('tabs', onTnfRefreshTabs)}
            >
              Tabs
            </button>
          </div>
        </form>
      </section>

      <section className="panel-section">
        <h3>Inspect</h3>
        <div className="panel-row wrap">
          <button
            className="panel-btn"
            disabled={!!effectiveBusy || !connected}
            onClick={() => void run('discover', onTnfDiscover)}
          >
            Discover
          </button>
          <button
            className="panel-btn"
            disabled={!!effectiveBusy || !connected}
            onClick={() => void run('html', onTnfHtml)}
          >
            HTML
          </button>
          <button
            className="panel-btn"
            disabled={!!effectiveBusy || !connected}
            onClick={() => void run('screenshot', onTnfScreenshot)}
          >
            Screenshot
          </button>
        </div>
        <form
          className="selector-row"
          onSubmit={(event) => {
            event.preventDefault();
            void run('click', () => onTnfClick(selectorInput));
          }}
        >
          <input
            className="panel-input"
            value={selectorInput}
            onChange={(event) => setSelectorInput(event.target.value)}
            placeholder="selector or el_N"
            aria-label="Click target"
          />
          <button
            className="panel-btn primary"
            type="submit"
            disabled={!!effectiveBusy || !connected}
          >
            Click
          </button>
        </form>
      </section>

      {tnf.tabs.length > 0 && (
        <section className="panel-section">
          <h3>Tabs ({tnf.tabs.length})</h3>
          <ul className="tab-list">
            {tnf.tabs.map((tab) => (
              <li key={tab.id} className={tab.active ? 'active' : ''}>
                <strong>{tab.title || 'Untitled'}</strong>
                <span>{tab.url}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tnf.discovered.length > 0 && (
        <section className="panel-section">
          <h3>Discovered ({tnf.discovered.length})</h3>
          <ul className="tab-list discover-list">
            {tnf.discovered.slice(0, 40).map((el, index) => {
              const handle = String(el.handleId || '');
              const label =
                el.label ||
                el.text ||
                el.id ||
                el.cls ||
                el.tag ||
                handle ||
                `element ${index + 1}`;
              return (
                <li key={`${handle}-${index}`}>
                  <button
                    type="button"
                    className="discover-item"
                    disabled={!!effectiveBusy || !connected || !handle}
                    onClick={() => void run('click', () => onTnfClick(handle))}
                  >
                    <strong>{String(label).slice(0, 64)}</strong>
                    <span>
                      {el.tag || 'el'}
                      {handle ? ` · ${handle}` : ''}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {tnf.htmlPreview && (
        <section className="panel-section">
          <h3>HTML Preview</h3>
          <pre className="html-preview">{tnf.htmlPreview}</pre>
        </section>
      )}

      {(tnf.lastScreenshot || state.lastScreenshot) && (
        <section className="panel-section">
          <h3>Last Screenshot</h3>
          <img
            src={tnf.lastScreenshot || state.lastScreenshot || ''}
            alt="Browser screenshot"
            className="screenshot-preview"
          />
        </section>
      )}

      <section className="panel-section panel-log">
        <h3>Activity</h3>
        <div className="log-stream">
          {tnf.activityLog.length === 0 ? (
            <p className="panel-hint">No activity yet.</p>
          ) : (
            tnf.activityLog.map((line, index) => (
              <div key={`${line}-${index}`} className="log-line">
                {line}
              </div>
            ))
          )}
        </div>
      </section>

      <style>{panelCss}</style>
    </aside>
  );
};

const panelCss = `
  .browser-control-panel {
    width: 380px;
    min-width: 320px;
    border-left: 1px solid var(--tnf-border, rgba(255,255,255,0.08));
    background: rgba(2, 6, 23, 0.92);
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow-y: auto;
  }
  .panel-header {
    padding: 18px 20px 12px;
    border-bottom: 1px solid var(--tnf-border);
  }
  .panel-header h2 {
    margin: 0 0 6px;
    font-size: 17px;
    font-family: var(--tnf-font-heading, Outfit, sans-serif);
  }
  .panel-header p {
    margin: 0;
    color: var(--tnf-text-muted, #94a3b8);
    font-size: 12px;
    line-height: 1.45;
  }
  .panel-section {
    padding: 14px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .panel-section h3 {
    margin: 0 0 12px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--tnf-text-muted);
  }
  .status-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 12px;
  }
  .panel-input {
    width: 100%;
    box-sizing: border-box;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--tnf-border);
    color: var(--tnf-text-primary, white);
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 10px;
  }
  .panel-row {
    display: flex;
    gap: 8px;
  }
  .panel-row.wrap {
    flex-wrap: wrap;
  }
  .selector-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    margin-top: 10px;
  }
  .selector-row .panel-input {
    margin-bottom: 0;
  }
  .panel-btn {
    flex: 1;
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--tnf-border);
    color: white;
    border-radius: 8px;
    padding: 8px 10px;
    cursor: pointer;
    font-size: 12px;
  }
  .panel-btn.primary {
    background: var(--tnf-accent, #06b6d4);
    color: #042f2e;
    border-color: transparent;
    font-weight: 600;
  }
  .panel-btn.danger {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.35);
    color: #fecaca;
  }
  .panel-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .panel-error {
    color: #fca5a5;
    font-size: 12px;
    margin: 8px 0 0;
  }
  .panel-hint {
    color: var(--tnf-text-muted);
    font-size: 12px;
    line-height: 1.5;
    margin: 8px 0 0;
  }
  .panel-hint code {
    font-family: var(--tnf-font-mono, ui-monospace, monospace);
    font-size: 11px;
    color: var(--tnf-accent, #67e8f9);
  }
  .tab-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 180px;
    overflow-y: auto;
  }
  .discover-list {
    max-height: 220px;
  }
  .tab-list li {
    padding: 0;
    border-radius: 8px;
    background: rgba(255,255,255,0.03);
    border: 1px solid transparent;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .tab-list li.active {
    border-color: rgba(6, 182, 212, 0.45);
  }
  .tab-list li > strong,
  .tab-list li > span {
    padding: 8px 10px 0;
  }
  .tab-list li > span:last-child {
    padding: 0 10px 8px;
  }
  .tab-list strong {
    font-size: 12px;
  }
  .tab-list span {
    font-size: 11px;
    color: var(--tnf-text-muted);
    word-break: break-all;
  }
  .discover-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    width: 100%;
    background: transparent;
    border: none;
    color: inherit;
    text-align: left;
    padding: 8px 10px;
    cursor: pointer;
  }
  .discover-item:hover:not(:disabled) {
    background: rgba(6, 182, 212, 0.08);
  }
  .screenshot-preview {
    width: 100%;
    border-radius: 8px;
    border: 1px solid var(--tnf-border);
  }
  .html-preview {
    margin: 0;
    max-height: 160px;
    overflow: auto;
    padding: 10px;
    border-radius: 8px;
    background: rgba(0,0,0,0.35);
    border: 1px solid var(--tnf-border);
    font-family: var(--tnf-font-mono, ui-monospace, monospace);
    font-size: 10px;
    white-space: pre-wrap;
    color: #cbd5e1;
  }
  .panel-log .log-stream {
    max-height: 160px;
    overflow-y: auto;
    font-family: var(--tnf-font-mono, ui-monospace, monospace);
    font-size: 11px;
  }
  .log-line {
    padding: 4px 0;
    color: #cbd5e1;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .panel-tabs {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr 1fr;
    gap: 6px;
    padding: 12px 16px 0;
  }
  .panel-tabs .tab {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: #cbd5e1;
    border-radius: 8px;
    padding: 8px 8px;
    cursor: pointer;
    font-size: 11px;
  }
  .panel-tabs .tab.active {
    background: rgba(6,182,212,0.16);
    border-color: rgba(6,182,212,0.4);
    color: white;
  }
  .federation-mode {
    width: 420px;
  }
  .status-pill {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 10px;
    border-radius: 8px;
    font-size: 11px;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .status-pill.ok {
    background: rgba(16, 185, 129, 0.12);
    color: #6ee7b7;
  }
  .status-pill.off {
    background: rgba(148, 163, 184, 0.08);
    color: #94a3b8;
  }
  .status-pill strong {
    font-size: 12px;
  }
`;

const StatusPill: React.FC<{ label: string; ok: boolean }> = ({ label, ok }) => (
  <div className={`status-pill ${ok ? 'ok' : 'off'}`}>
    <span>{label}</span>
    <strong>{ok ? 'ON' : 'OFF'}</strong>
  </div>
);

export default BrowserControlPanel;
