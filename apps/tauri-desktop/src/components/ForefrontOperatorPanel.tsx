import React, { useEffect, useState } from 'react';
import { useRoute } from './route-context';
import { useBrowserControl } from '../hooks/useBrowserControl';
import { useFederationNode } from '../hooks/useFederationNode';
import { useSettingsStore } from '../stores';

const LOCAL_UI_URL = 'http://localhost:1420/#/browser';

export const ForefrontOperatorPanel: React.FC = () => {
  const { navigate } = useRoute();
  const browser = useBrowserControl();
  const federation = useFederationNode();
  const { environment } = useSettingsStore();
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('http://127.0.0.1:3000/health')
      .then((res) => {
        if (!cancelled) setApiHealthy(res.ok);
      })
      .catch(() => {
        if (!cancelled) setApiHealthy(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="forefront-panel">
      <div className="forefront-copy">
        <p className="eyebrow">TNF Forefront</p>
        <h2>Operator command surface</h2>
        <p>
          Local harness, relay-backed browser control, and agent orchestration in one place. Environment:{' '}
          <strong>{environment}</strong>.
        </p>
      </div>

      <div className="forefront-status">
        <StatusChip label="Relay" ok={browser.state.relayConnected} />
        <StatusChip label="Extension" ok={browser.state.extensionConnected} />
        <StatusChip label="Federation" ok={federation.state.registered} />
        <StatusChip label="Relay HTTP" ok={apiHealthy === true} warn={apiHealthy === null} />
        <StatusChip label="Session" ok={browser.state.sessionActive} />
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
          onClick={() => void browser.connect()}
          disabled={browser.state.relayConnected || browser.state.connecting}
        >
          {browser.state.connecting ? 'Connecting…' : 'Connect Relay'}
        </button>
        <button
          className="forefront-btn ghost"
          onClick={() => {
            window.open(LOCAL_UI_URL, '_blank', 'noopener,noreferrer');
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
