import React, { useEffect, useState } from 'react';
import PageShell from '../components/layout/PageShell';
import {
  getVoicePort,
  getVoiceProfile,
  getVoiceProjectRoot,
  setVoicePort,
  setVoiceProfile,
  setVoiceProjectRoot,
} from '../config/voiceBridge';
import { useVoiceBridge } from '../hooks/useVoiceBridge';
import { isTauriRuntime } from '../lib/isTauri';

const VoiceHub: React.FC = () => {
  const {
    snapshot,
    refresh,
    pauseBeam,
    resumeBeam,
    stopSpeech,
    ensureStarted,
    sendUtterance,
    setResponseAudioEnabled,
  } = useVoiceBridge();

  const [draftRoot, setDraftRoot] = useState(getVoiceProjectRoot());
  const [draftPort, setDraftPort] = useState(String(getVoicePort()));
  const [draftProfile, setDraftProfile] = useState(getVoiceProfile());
  const [testLine, setTestLine] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [bootNote, setBootNote] = useState<string | null>(null);

  const runAction = async (label: string, action: () => Promise<void>) => {
    setBusy(label);
    try {
      await action();
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    if (!isTauriRuntime()) return;
    let cancelled = false;
    void (async () => {
      setBusy('boot');
      try {
        const result = await ensureStarted();
        if (!cancelled && result?.message) {
          setBootNote(result.message);
        }
      } catch (error) {
        if (!cancelled) {
          setBootNote(error instanceof Error ? error.message : String(error));
        }
      } finally {
        if (!cancelled) setBusy(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ensureStarted]);

  const saveConfig = async () => {
    setVoiceProjectRoot(draftRoot);
    setVoicePort(Number.parseInt(draftPort, 10) || 50005);
    setVoiceProfile(draftProfile);
    await refresh();
  };

  return (
    <PageShell
      title="Voice Bridge"
      subtitle="Same stack as `tnf voice up --with-listen` — server, listen STT, beam, and spoken replies."
      actions={
        <button
          type="button"
          className="primary-button"
          onClick={() =>
            void runAction('boot', async () => {
              const result = await ensureStarted();
              if (result?.message) setBootNote(result.message);
            })
          }
          disabled={!!busy}
        >
          {busy === 'boot' ? 'Starting…' : 'Start full stack'}
        </button>
      }
    >
      {bootNote ? <p className="voice-muted voice-boot-note">{bootNote}</p> : null}

      <p className="voice-muted voice-cli-hint">
        Agents/CLI: use <code>tnf voice …</code> (canonical). Prefer <code>tnf voice listen</code> —
        bare <code>tnf listen</code> is not a command.
      </p>

      <section className="voice-status-grid" aria-label="Voice bridge status">
        {[
          {
            label: 'Voice server',
            ok: snapshot.online,
            detail: snapshot.online
              ? `127.0.0.1:${snapshot.port}`
              : snapshot.lastError || 'Offline',
          },
          {
            label: 'Listen STT',
            ok: snapshot.listenRunning,
            detail: snapshot.listenRunning
              ? `Sidecar live · ${snapshot.profile}`
              : 'Not running — start full stack',
          },
          {
            label: 'Beam',
            ok: snapshot.online && !snapshot.micPaused,
            detail: !snapshot.online ? 'Offline' : snapshot.micPaused ? 'Paused' : 'Active',
          },
          {
            label: 'Whisper',
            ok: snapshot.stt.ready,
            detail: snapshot.stt.detail || (snapshot.stt.ready ? 'Ready' : 'Not ready'),
          },
          {
            label: 'TTS',
            ok: !snapshot.aiSpeaking,
            detail: snapshot.aiSpeaking ? 'Speaking' : 'Idle',
          },
          {
            label: 'Reply audio',
            ok: snapshot.responseAudioEnabled,
            detail: snapshot.responseAudioEnabled ? 'On' : 'Off',
          },
        ].map((card) => (
          <div key={card.label} className={`voice-status-card ${card.ok ? 'ok' : 'warn'}`}>
            <span className="voice-status-label">{card.label}</span>
            <strong>{card.detail}</strong>
          </div>
        ))}
      </section>

      <div className="voice-hub-grid">
        <section className="voice-panel">
          <h2>Speaker</h2>
          <p className="voice-lead">
            You are <strong>{snapshot.speakerName}</strong> on profile{' '}
            <strong>{snapshot.profile}</strong>.
          </p>
          <p className="voice-muted">
            Routing tags stay on the voice stream and in logs. Chat injection and this page show
            your plain words only.
          </p>
          <div className="voice-meta-list">
            <div>
              <span>State dir</span>
              <code>{snapshot.stateDir}</code>
            </div>
            <div>
              <span>Beam target</span>
              <code>
                {snapshot.beamTarget?.kind || 'unknown'}
                {snapshot.beamTarget?.tty ? ` · ${snapshot.beamTarget.tty}` : ''}
                {snapshot.beamTarget?.press_enter ? ' · enter' : ''}
              </code>
            </div>
          </div>
        </section>

        <section className="voice-panel">
          <h2>Controls</h2>
          <div className="voice-actions">
            <button
              type="button"
              className="primary-button"
              disabled={!!busy || !snapshot.online}
              onClick={() => void runAction('beam', snapshot.micPaused ? resumeBeam : pauseBeam)}
            >
              {snapshot.micPaused ? 'Resume beam' : 'Pause beam'}
            </button>
            <button
              type="button"
              className="ghost-button"
              disabled={!!busy || !snapshot.online}
              onClick={() => void runAction('stop', stopSpeech)}
            >
              Stop speech
            </button>
            <button
              type="button"
              className="ghost-button"
              disabled={!!busy}
              onClick={() =>
                void runAction('audio', () =>
                  setResponseAudioEnabled(!snapshot.responseAudioEnabled)
                )
              }
            >
              {snapshot.responseAudioEnabled ? 'Mute reply audio' : 'Enable reply audio'}
            </button>
            <button
              type="button"
              className="ghost-button"
              disabled={!!busy}
              onClick={() => void refresh()}
            >
              Refresh status
            </button>
            <button
              type="button"
              className="ghost-button"
              disabled={!!busy}
              onClick={() =>
                void runAction('activate', async () => {
                  const result = await ensureStarted();
                  if (result?.message) setBootNote(result.message);
                })
              }
            >
              Heal bridge + listen
            </button>
          </div>

          <form
            className="voice-test-form"
            onSubmit={(event) => {
              event.preventDefault();
              void runAction('send', async () => {
                await sendUtterance(testLine);
                setTestLine('');
              });
            }}
          >
            <label htmlFor="voice-test-line">Send test line to stream</label>
            <div className="voice-test-row">
              <input
                id="voice-test-line"
                value={testLine}
                onChange={(event) => setTestLine(event.target.value)}
                placeholder="Say something…"
              />
              <button
                type="submit"
                className="primary-button"
                disabled={!!busy || !testLine.trim()}
              >
                Send
              </button>
            </div>
          </form>
        </section>

        <section className="voice-panel voice-panel-wide">
          <h2>Recent utterances</h2>
          {!isTauriRuntime() ? (
            <p className="voice-muted">
              Stream tail is available in the packaged Tauri app. Server status still updates in the
              browser preview.
            </p>
          ) : null}
          {snapshot.recentUtterances.length === 0 ? (
            <p className="voice-muted">No lines in the voice stream yet.</p>
          ) : (
            <ul className="voice-stream-list">
              {[...snapshot.recentUtterances].reverse().map((entry) => (
                <li key={`${entry.messageId || entry.raw}-${entry.body}`}>
                  <span className="voice-stream-speaker">{entry.from}</span>
                  <span className="voice-stream-body">{entry.body}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="voice-panel">
          <h2>Bridge config</h2>
          <div className="voice-config-grid">
            <label>
              Project root
              <input value={draftRoot} onChange={(event) => setDraftRoot(event.target.value)} />
            </label>
            <label>
              Port
              <input value={draftPort} onChange={(event) => setDraftPort(event.target.value)} />
            </label>
            <label>
              Profile
              <input
                value={draftProfile}
                onChange={(event) => setDraftProfile(event.target.value)}
              />
            </label>
          </div>
          <button type="button" className="primary-button" onClick={() => void saveConfig()}>
            Save config
          </button>
        </section>

        {/* Embedded Sensor Iframe */}
        <section
          className="voice-panel voice-panel-wide"
          style={{ border: '1px solid rgba(99, 102, 241, 0.45)' }}
        >
          <h2>Native Audio Capture Engine</h2>
          <p className="voice-muted">
            The Voice Beam requires microphone access. Start the engine below to activate the
            embedded sensor without opening a separate browser tab.
          </p>
          <iframe
            src={`http://localhost:${snapshot.port}`}
            allow="microphone"
            style={{
              width: '100%',
              height: '300px',
              borderRadius: '10px',
              border: 'none',
              background: '#000',
            }}
            title="Voice Sensor Engine"
          />
        </section>
      </div>

      <style>{`
        .voice-status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        .voice-status-card {
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid var(--tnf-border);
          background: var(--tnf-surface-card);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .voice-status-card.ok strong { color: #6ee7b7; }
        .voice-status-card.warn strong { color: #fbbf24; }
        .voice-status-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--tnf-text-muted);
        }
        .voice-hub-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .voice-panel {
          padding: 18px;
          border-radius: 14px;
          border: 1px solid var(--tnf-border);
          background: var(--tnf-surface-card);
        }
        .voice-panel-wide {
          grid-column: 1 / -1;
        }
        .voice-panel h2 {
          margin: 0 0 12px;
          font-size: 18px;
        }
        .voice-lead {
          margin: 0 0 8px;
          color: var(--tnf-text-primary);
        }
        .voice-muted {
          margin: 0 0 12px;
          color: var(--tnf-text-secondary, #cbd5e1);
          font-size: 14px;
        }
        .voice-cli-hint code {
          font-size: 12px;
          padding: 1px 6px;
          border-radius: 4px;
          background: rgba(255,255,255,0.06);
        }
        .voice-boot-note {
          margin: 0 0 12px;
          padding: 10px 12px;
          border-radius: 8px;
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.25);
        }
        .voice-meta-list {
          display: grid;
          gap: 10px;
        }
        .voice-meta-list span {
          display: block;
          font-size: 12px;
          color: var(--tnf-text-muted);
          margin-bottom: 4px;
        }
        .voice-meta-list code {
          display: block;
          font-size: 12px;
          word-break: break-all;
        }
        .voice-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 16px;
        }
        .voice-test-form label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          color: var(--tnf-text-muted);
        }
        .voice-test-row {
          display: flex;
          gap: 10px;
        }
        .voice-test-row input,
        .voice-config-grid input {
          flex: 1;
          min-width: 0;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid var(--tnf-border);
          background: rgba(15, 23, 42, 0.35);
          color: inherit;
        }
        .voice-config-grid {
          display: grid;
          gap: 12px;
          margin-bottom: 12px;
        }
        .voice-config-grid label {
          display: grid;
          gap: 6px;
          font-size: 13px;
          color: var(--tnf-text-muted);
        }
        .voice-stream-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 10px;
          max-height: 320px;
          overflow: auto;
        }
        .voice-stream-list li {
          display: grid;
          gap: 4px;
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(15, 23, 42, 0.35);
          border: 1px solid rgba(148, 163, 184, 0.15);
        }
        .voice-stream-speaker {
          font-size: 12px;
          font-weight: 700;
          color: #93c5fd;
        }
        .voice-stream-body {
          font-size: 14px;
        }
        @media (max-width: 960px) {
          .voice-hub-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </PageShell>
  );
};

export default VoiceHub;
