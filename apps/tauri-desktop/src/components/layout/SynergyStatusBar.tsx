import React from 'react';
import { useOperatorSynergy } from '../../hooks/useOperatorSynergy';

/** Compact synergy plane status — use at top of operator pages */
export const SynergyStatusBar: React.FC = () => {
  const { state } = useOperatorSynergy();

  const chips = [
    { label: 'Relay', ok: state.relayConnected },
    { label: 'Federation', ok: state.relayRegistered },
    { label: 'Extension', ok: state.extensionConnected },
    { label: 'API', ok: state.apiOnline },
  ];

  return (
    <div className="synergy-status-bar">
      {chips.map((chip) => (
        <span key={chip.label} className={`synergy-chip ${chip.ok ? 'ok' : 'off'}`}>
          <span className="dot" />
          {chip.label}
        </span>
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
        }
        .synergy-chip.ok {
          color: #6ee7b7;
          border-color: rgba(16, 185, 129, 0.35);
          background: rgba(16, 185, 129, 0.08);
        }
        .synergy-chip.off {
          color: #94a3b8;
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
          color: var(--tnf-text-muted);
        }
      `}</style>
    </div>
  );
};

export default SynergyStatusBar;
