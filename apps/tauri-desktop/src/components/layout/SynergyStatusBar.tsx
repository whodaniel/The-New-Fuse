import React, { useEffect, useState } from 'react';
import { LIBRARY_KWS_BASE_URL, STORY_ARCHITECT_RELAY_URL } from '../../config/virtualLibrary';
import { useOperatorSynergy } from '../../hooks/useOperatorSynergy';
import { useVoiceBridge } from '../../hooks/useVoiceBridge';
import { useRoute } from '../route-context';

const CHIP_ROUTES: Record<string, string> = {
  Voice: '/voice',
  Library: '/library',
  Relay: '/computer-use',
  Federation: '/a2a',
  Extension: '/computer-use',
  API: '/settings',
};

// Simulated sparkline data generator
const generateSparklineData = () => {
  return Array.from({ length: 12 }, () => Math.max(20, Math.random() * 100));
};

async function probeLibraryAudioReady(): Promise<boolean> {
  try {
    const [relay, kws] = await Promise.all([
      fetch(`${STORY_ARCHITECT_RELAY_URL}/v1/health`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(2000),
      }),
      fetch(`${LIBRARY_KWS_BASE_URL}/healthz`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(2000),
      }),
    ]);
    return relay.ok && kws.ok;
  } catch {
    return false;
  }
}

/** Compact synergy plane status — use at top of operator pages */
export const SynergyStatusBar: React.FC = () => {
  const { state } = useOperatorSynergy();
  const { snapshot: voice } = useVoiceBridge();
  const { navigate } = useRoute();
  const [libraryAudioReady, setLibraryAudioReady] = useState(false);
  const [sparklineData, setSparklineData] = useState(generateSparklineData());

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const ready = await probeLibraryAudioReady();
      if (!cancelled) setLibraryAudioReady(ready);
    };
    void tick();
    const timer = window.setInterval(() => void tick(), 10000);
    
    const sparkTimer = window.setInterval(() => {
      if (!cancelled) setSparklineData(generateSparklineData());
    }, 2000);
    
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearInterval(sparkTimer);
    };
  }, []);

  const chips = [
    {
      label: 'Voice',
      ok: voice.online && !voice.micPaused && voice.listenRunning,
      hint: !voice.online
        ? 'Offline'
        : !voice.listenRunning
          ? 'No listen'
          : voice.micPaused
            ? 'Beam paused'
            : voice.aiSpeaking
              ? 'Speaking'
              : 'Live',
    },
    {
      label: 'Library',
      ok: libraryAudioReady,
      hint: libraryAudioReady
        ? 'Story Architect + KWS ready'
        : 'Start library voice stack on Virtual Library',
    },
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
          data-route={CHIP_ROUTES[chip.label] || '/dashboard'}
          onClick={() => navigate(CHIP_ROUTES[chip.label] || '/dashboard')}
          title={
            'hint' in chip && chip.hint
              ? `${chip.label}: ${chip.hint}`
              : `Open ${chip.label} settings`
          }
          aria-label={`${chip.label}: ${chip.ok ? 'online' : 'offline'}`}
        >
          <span className="dot" aria-hidden />
          {chip.label}
        </button>
      ))}
      <div className="synergy-meta">
        <span style={{ marginRight: '12px' }}>
          {state.unifiedAgents.length} agents · {state.channelCount} channels
        </span>
        <div className="sparkline" title="Telemetry Pulse">
          {sparklineData.map((val, i) => (
            <div key={i} className="sparkline-bar" style={{ height: `${val}%` }} />
          ))}
        </div>
      </div>
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
        .synergy-chip[data-route^="/computer-use"] {
          border-radius: 4px;
        }
        .synergy-chip[data-route^="/a2a"] {
          border-style: dashed;
        }
        .synergy-chip[data-route^="/voice"] {
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.1);
        }
        .synergy-meta {
          margin-left: auto;
          display: flex;
          align-items: center;
          font-size: 12px;
          color: var(--tnf-text-secondary, #cbd5e1);
          font-weight: 500;
        }
        .sparkline {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 14px;
          padding-left: 12px;
          border-left: 1px solid var(--tnf-border);
        }
        .sparkline-bar {
          width: 3px;
          background: var(--tnf-text-muted, #94a3b8);
          border-radius: 1px;
          opacity: 0.6;
          transition: height 0.3s ease;
        }
        .synergy-chip.ok ~ .synergy-meta .sparkline-bar {
          background: var(--tnf-success, #10b981);
        }
      `}</style>
    </div>
  );
};

export default SynergyStatusBar;
