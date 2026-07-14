import React, { useState } from 'react';
import type { BrowserControlState } from '../../hooks/useBrowserControl';
import type { FederationNodeState } from '../../hooks/useFederationNode';
import FederationChannelPanel from '../federation/FederationChannelPanel';

interface BrowserControlPanelProps {
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
  const [activeTab, setActiveTab] = useState<'browser' | 'federation'>('browser');
  const [urlInput, setUrlInput] = useState(state.currentUrl || 'https://example.com');
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (label: string, action: () => Promise<unknown>) => {
    setBusy(label);
    try {
      await action();
    } finally {
      setBusy(null);
    }
  };

  const tabBar = (
    <div className="panel-tabs">
      <button
        className={activeTab === 'browser' ? 'tab active' : 'tab'}
        onClick={() => setActiveTab('browser')}
      >
        Browser
      </button>
      <button
        className={activeTab === 'federation' ? 'tab active' : 'tab'}
        onClick={() => setActiveTab('federation')}
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
        <style>{panelTabsCss}</style>
      </aside>
    );
  }

  return (
    <aside className="browser-control-panel">
      {tabBar}
      <header className="panel-header">
        <h2>Browser Control</h2>
        <p>TNF harness relay + Chrome extension operator surface</p>
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
        {!state.extensionConnected && state.relayConnected && (
          <p className="panel-hint">
            Extension offline — federation node still drives relay channels. Switch to the
            Federation tab for standalone channel control.
          </p>
        )}
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
            <button className="panel-btn primary" type="submit" disabled={!!busy}>
              Go
            </button>
            <button
              className="panel-btn"
              type="button"
              disabled={!!busy}
              onClick={() => void run('native', () => onOpenNative(urlInput))}
            >
              Native
            </button>
          </div>
        </form>
        <div className="panel-row">
          <button className="panel-btn" disabled={!!busy} onClick={() => void run('back', onBack)}>
            ←
          </button>
          <button
            className="panel-btn"
            disabled={!!busy}
            onClick={() => void run('forward', onForward)}
          >
            →
          </button>
          <button
            className="panel-btn"
            disabled={!!busy}
            onClick={() => void run('refresh', onRefresh)}
          >
            ↻
          </button>
        </div>
      </section>

      <section className="panel-section">
        <h3>Operator Actions</h3>
        <div className="panel-row wrap">
          <button
            className="panel-btn"
            disabled={!!busy || !state.extensionConnected}
            onClick={() => void run('screenshot', onScreenshot)}
          >
            Screenshot
          </button>
          <button
            className="panel-btn"
            disabled={!!busy || !state.extensionConnected}
            onClick={() => void run('analyze', onAnalyze)}
          >
            Analyze
          </button>
          <button
            className="panel-btn"
            disabled={!!busy || !state.extensionConnected}
            onClick={() => void run('tabs', onRefreshTabs)}
          >
            Refresh Tabs
          </button>
          {!state.sessionActive ? (
            <button
              className="panel-btn"
              disabled={!!busy || !state.extensionConnected}
              onClick={() => void run('session', onStartSession)}
            >
              Start Session
            </button>
          ) : (
            <button
              className="panel-btn danger"
              disabled={!!busy}
              onClick={() => void onEndSession()}
            >
              End Session
            </button>
          )}
        </div>
      </section>

      {state.tabs.length > 0 && (
        <section className="panel-section">
          <h3>Extension Tabs ({state.tabs.length})</h3>
          <ul className="tab-list">
            {state.tabs.map((tab) => (
              <li key={tab.id} className={tab.active ? 'active' : ''}>
                <strong>{tab.title}</strong>
                <span>{tab.url}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {state.lastScreenshot && (
        <section className="panel-section">
          <h3>Last Screenshot</h3>
          <img src={state.lastScreenshot} alt="Browser screenshot" className="screenshot-preview" />
        </section>
      )}

      <section className="panel-section panel-log">
        <h3>Activity</h3>
        <div className="log-stream">
          {state.activityLog.length === 0 ? (
            <p className="panel-hint">No activity yet.</p>
          ) : (
            state.activityLog.map((line, index) => (
              <div key={`${line}-${index}`} className="log-line">
                {line}
              </div>
            ))
          )}
        </div>
      </section>

      <style>{`
        .browser-control-panel {
          width: 360px;
          min-width: 320px;
          border-left: 1px solid var(--tnf-border, rgba(255,255,255,0.08));
          background: rgba(2, 6, 23, 0.92);
          display: flex;
          flex-direction: column;
          gap: 0;
          overflow-y: auto;
        }
        .panel-header {
          padding: 20px 20px 12px;
          border-bottom: 1px solid var(--tnf-border);
        }
        .panel-header h2 {
          margin: 0 0 6px;
          font-size: 18px;
        }
        .panel-header p {
          margin: 0;
          color: var(--tnf-text-muted, #94a3b8);
          font-size: 12px;
        }
        .panel-section {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .panel-section h3 {
          margin: 0 0 12px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
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
          color: white;
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
        .panel-btn {
          flex: 1;
          background: rgba(255,255,255,0.06);
          border: 1px solid var(--tnf-border);
          color: white;
          border-radius: 8px;
          padding: 8px 10px;
          cursor: pointer;
        }
        .panel-btn.primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-color: transparent;
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
        .tab-list li {
          padding: 8px 10px;
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid transparent;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .tab-list li.active {
          border-color: rgba(99, 102, 241, 0.45);
        }
        .tab-list strong {
          font-size: 12px;
        }
        .tab-list span {
          font-size: 11px;
          color: var(--tnf-text-muted);
          word-break: break-all;
        }
        .screenshot-preview {
          width: 100%;
          border-radius: 8px;
          border: 1px solid var(--tnf-border);
        }
        .panel-log .log-stream {
          max-height: 180px;
          overflow-y: auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
        }
        .log-line {
          padding: 4px 0;
          color: #cbd5e1;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .panel-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding: 12px 16px 0;
        }
        .panel-tabs .tab {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: #cbd5e1;
          border-radius: 8px;
          padding: 8px 10px;
          cursor: pointer;
        }
        .panel-tabs .tab.active {
          background: rgba(99,102,241,0.18);
          border-color: rgba(99,102,241,0.35);
          color: white;
        }
        .federation-mode {
          width: 420px;
        }
      `}</style>
    </aside>
  );
};

const panelTabsCss = `
  .panel-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 12px 16px 0;
  }
  .panel-tabs .tab {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: #cbd5e1;
    border-radius: 8px;
    padding: 8px 10px;
    cursor: pointer;
  }
  .panel-tabs .tab.active {
    background: rgba(99,102,241,0.18);
    border-color: rgba(99,102,241,0.35);
    color: white;
  }
  .federation-mode {
    width: 420px;
  }
`;

const StatusPill: React.FC<{ label: string; ok: boolean }> = ({ label, ok }) => (
  <div className={`status-pill ${ok ? 'ok' : 'off'}`}>
    <span>{label}</span>
    <strong>{ok ? 'ON' : 'OFF'}</strong>
    <style>{`
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
    `}</style>
  </div>
);

export default BrowserControlPanel;
