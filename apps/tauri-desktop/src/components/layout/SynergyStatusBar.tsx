import React from 'react';
import { useOperatorSynergy } from '../../hooks/useOperatorSynergy';
import { useRoute } from '../route-context';

const CHIP_ROUTES: Record<string, string> = {
  Relay: '/browser',
  Federation: '/a2a',
  Extension: '/browser',
  API: '/settings',
};

/** Compact synergy plane status — use at top of operator pages */
export const SynergyStatusBar: React.FC = () => {
  const { state } = useOperatorSynergy();
  const { navigate } = useRoute();

  const chips = [
    { label: 'Relay', ok: state.relayConnected },
    { label: 'Federation', ok: state.relayRegistered },
    { label: 'Extension', ok: state.extensionConnected },
    { label: 'API', ok: state.apiOnline },
  ];

  return (
    <div className="synergy-status-bar" role="status" aria-label="Synergy plane status">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          className={`synergy-chip ${chip.ok ? 'ok' : 'off'}`}
          onClick={() => navigate(CHIP_ROUTES[chip.label] || '/dashboard')}
          title={`Open ${chip.label} settings`}
          aria-label={`${chip.label}: ${chip.ok ? 'online' : 'offline'}`}
        >
          <span className="dot" aria-hidden />
          {chip.label}
        </button>
      ))}
      <span className="synergy-meta">
        {state.unifiedAgents.length} agents · {state.channelCount} channels
      </span>
      <style>{`
        .synergy-status-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid var(--tnf-border);
          background: var(--tnf-surface-card);
        }
        .synergy-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid var(--tnf-border);
          color: var(--tnf-text-muted);
          background: transparent;
          cursor: pointer;
        }
        .synergy-chip.ok {
          color: #6ee7b7;
          border-color: rgba(16, 185, 129, 0.35);
          background: rgba(16, 185, 129, 0.08);
        }
        .synergy-chip.off {
          color: #cbd5e1;
          border-color: rgba(148, 163, 184, 0.45);
          background: rgba(148, 163, 184, 0.08);
        }
        .synergy-chip .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }
        .synergy-meta {
          margin-left: auto;
          font-size: 12px;
          color: var(--tnf-text-secondary, #cbd5e1);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default SynergyStatusBar;
