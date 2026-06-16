import React from 'react';
import { useOperatorSynergy } from '../hooks/useOperatorSynergy';
import { openExternal } from '../lib/openExternal';
import BrowserControlService from '../services/BrowserControlService';
import FederationNodeService from '../services/FederationNodeService';
import { useRoute } from './route-context';

const LOCAL_UI_URL = 'http://localhost:1420';

export const ForefrontOperatorPanel: React.FC = () => {
  const { navigate } = useRoute();
  const { state, refresh } = useOperatorSynergy();

  const connectRelay = async () => {
    await Promise.allSettled([
      FederationNodeService.connect(state.relayUrl),
      BrowserControlService.connect(state.relayUrl),
    ]);
    await refresh();
  };

  return (
    <section className="forefront-panel">
      <div className="forefront-copy">
        <p className="eyebrow">TNF Forefront</p>
        <h2>Operator command surface</h2>
        <p>
          Unified relay, federation, browser, and API orchestration. Environment:{' '}
          <strong>{state.environment}</strong> · {state.unifiedAgents.length} agents in synergy.
        </p>
      </div>

      <div className="forefront-status">
        <StatusChip label="Relay" ok={state.relayConnected} />
        <StatusChip label="Federation" ok={state.relayRegistered} />
        <StatusChip label="Extension" ok={state.extensionConnected} />
        <StatusChip label="API" ok={state.apiOnline} />
        <StatusChip
          label="Channels"
          ok={state.channelCount > 0}
          warn={state.relayConnected && state.channelCount === 0}
        />
        <StatusChip label="Session" ok={state.browserSessionActive} />
      </div>

      <div className="forefront-actions">
        <button className="forefront-btn primary" onClick={() => navigate('/browser')}>
          Open Browser + Federation
        </button>
        <button className="forefront-btn" onClick={() => navigate('/terminal')}>
          Swarm Terminal
        </button>
        <button className="forefront-btn" onClick={() => navigate('/agents')}>
          Agent Hub
        </button>
        <button
          className="forefront-btn"
          onClick={() => void connectRelay()}
          disabled={state.relayConnected}
        >
          {state.relayConnected ? 'Relay Connected' : 'Connect Relay'}
        </button>
        <button className="forefront-btn ghost" onClick={() => void refresh()}>
          Sync Synergy
        </button>
        <button
          className="forefront-btn ghost"
          onClick={() => {
            void openExternal(LOCAL_UI_URL);
          }}
        >
          Open Standalone UI
        </button>
      </div>

      <style>{`
        .forefront-panel {
          margin-bottom: 20px;
          padding: 20px;
          border-radius: 16px;
          border: 1px solid rgba(99, 102, 241, 0.35);
          background:
            radial-gradient(circle at top right, rgba(99, 102, 241, 0.18), transparent 45%),
            rgba(15, 23, 42, 0.92);
        }
        .eyebrow {
          margin: 0 0 6px;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #a5b4fc;
        }
        .forefront-copy h2 {
          margin: 0 0 8px;
          font-size: 24px;
        }
        .forefront-copy p {
          margin: 0;
          color: #94a3b8;
          max-width: 720px;
        }
        .forefront-status {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 16px 0;
        }
        .forefront-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .forefront-btn {
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          color: white;
          border-radius: 10px;
          padding: 10px 14px;
          cursor: pointer;
        }
        .forefront-btn.primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-color: transparent;
        }
        .forefront-btn.ghost {
          background: transparent;
        }
        .forefront-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
      `}</style>
    </section>
  );
};

const StatusChip: React.FC<{ label: string; ok: boolean; warn?: boolean }> = ({
  label,
  ok,
  warn,
}) => (
  <span className={`chip ${ok ? 'ok' : warn ? 'warn' : 'off'}`}>
    {label}: {ok ? 'ON' : warn ? '…' : 'OFF'}
    <style>{`
      .chip {
        display: inline-flex;
        align-items: center;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
        border: 1px solid rgba(255,255,255,0.08);
      }
      .chip.ok { color: #6ee7b7; background: rgba(16,185,129,0.12); }
      .chip.off { color: #94a3b8; background: rgba(148,163,184,0.08); }
      .chip.warn { color: #fcd34d; background: rgba(252,211,77,0.12); }
    `}</style>
  </span>
);

export default ForefrontOperatorPanel;
