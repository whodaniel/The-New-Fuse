import { invoke } from '@tauri-apps/api/core';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageShell from '../components/layout/PageShell';
import {
  buildVirtualLibraryEmbedUrl,
  DEFAULT_VIRTUAL_LIBRARY_URL,
  DIRECT_DEV_VIRTUAL_LIBRARY_URL,
  getVirtualLibraryBaseUrl,
  probeLibraryAudioDependencies,
  setVirtualLibraryBaseUrl,
  type LibraryAudioDependency,
} from '../config/virtualLibrary';
import { useVoiceBridge } from '../hooks/useVoiceBridge';
import { isTauriRuntime } from '../lib/isTauri';
import { openExternal } from '../lib/openExternal';

type LifecycleResult = {
  ok: boolean;
  message: string;
  already_running?: boolean;
};

const LIBRARY_DEV_CMD = 'pnpm --filter virtual-library-blueprints dev';
const LIBRARY_AUDIO_CMD = 'node scripts/library/ensure-library-audio-stack.cjs';

const VirtualLibraryHub: React.FC = () => {
  const [baseUrl, setBaseUrlState] = useState(getVirtualLibraryBaseUrl);
  const [draftUrl, setDraftUrl] = useState(baseUrl);
  const [deps, setDeps] = useState<LibraryAudioDependency[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [booting, setBooting] = useState(false);
  const [bootNote, setBootNote] = useState<string | null>(null);
  const { snapshot: voice, pauseBeam } = useVoiceBridge();
  const inTauri = isTauriRuntime();

  const embedUrl = useMemo(() => buildVirtualLibraryEmbedUrl(baseUrl), [baseUrl, reloadKey]);
  const libraryOnline = deps.find((d) => d.id === 'library')?.online ?? null;
  const storyOnline = deps.find((d) => d.id === 'storyArchitect')?.online ?? null;
  const kwsOnline = deps.find((d) => d.id === 'kws')?.online ?? null;
  const audioReady = storyOnline === true && kwsOnline === true;
  const beamMayConflict = voice.online && voice.listenRunning && !voice.micPaused;

  const probe = useCallback(async () => {
    setDeps(await probeLibraryAudioDependencies(baseUrl));
  }, [baseUrl]);

  useEffect(() => {
    void probe();
    const timer = window.setInterval(() => void probe(), 8000);
    return () => window.clearInterval(timer);
  }, [probe]);

  const saveUrl = () => {
    const trimmed = draftUrl.trim().replace(/\/$/, '');
    if (!trimmed) return;
    setVirtualLibraryBaseUrl(trimmed);
    setBaseUrlState(trimmed);
    setReloadKey((value) => value + 1);
    void probe();
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setBootNote(`Copied: ${text}`);
    } catch {
      setBootNote(text);
    }
  };

  const startLibraryAudioStack = async () => {
    setBooting(true);
    setBootNote(null);
    try {
      if (inTauri) {
        const result = await invoke<LifecycleResult>('ensure_library_audio_stack');
        setBootNote(result.message);
        if (beamMayConflict) {
          try {
            await pauseBeam();
            setBootNote(
              (prev) =>
                `${prev || result.message} · Whisper beam paused so Library browser STT can own the mic.`
            );
          } catch {
            /* optional */
          }
        }
      } else {
        // Chrome / Vite preview cannot spawn local processes — probe and guide.
        const after = await probeLibraryAudioDependencies(baseUrl);
        setDeps(after);
        const story = after.find((d) => d.id === 'storyArchitect')?.online;
        const kws = after.find((d) => d.id === 'kws')?.online;
        if (story && kws) {
          setBootNote(
            'Story Architect + KWS already live. Inside the Library, click Enable Voice.'
          );
        } else {
          setBootNote(
            `Browser preview cannot spawn local services. From the TNF repo root run: ${LIBRARY_AUDIO_CMD}` +
              (!libraryOnline ? ` · then ${LIBRARY_DEV_CMD}` : '')
          );
        }
      }
      window.setTimeout(() => void probe(), 1200);
    } catch (err) {
      setBootNote(err instanceof Error ? err.message : String(err));
    } finally {
      setBooting(false);
    }
  };

  return (
    <PageShell
      className="page-fill"
      title="Virtual Library"
      subtitle="3D spatial library — Story Architect, timeline, and the full browser-mic audio pipeline (KWS + AI relay)."
      actions={
        <>
          <span
            className={`env-badge ${libraryOnline ? 'local' : libraryOnline === false ? 'offline' : ''}`}
          >
            {libraryOnline
              ? 'Library online'
              : libraryOnline === false
                ? 'Library offline'
                : 'Checking…'}
          </span>
          <button
            type="button"
            className="primary-button"
            disabled={booting}
            onClick={() => void startLibraryAudioStack()}
          >
            {booting
              ? 'Starting…'
              : audioReady
                ? 'Heal library voice'
                : 'Start library voice stack'}
          </button>
          <button type="button" className="ghost-button" onClick={() => setReloadKey((v) => v + 1)}>
            Reload
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void openExternal(baseUrl)}
          >
            Open in browser
          </button>
        </>
      }
      banner={
        libraryOnline === false ? (
          <div
            className="info-banner"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <strong style={{ color: '#fca5a5' }}>Library Engine is Offline</strong>
            <span>
              Start the Virtual Library UI on :5173, then reload. Voice needs Story Architect
              (:43120) and KWS (:43110) — use Start library voice stack once the UI is up.
            </span>
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
              <code
                style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 12px', borderRadius: '6px' }}
              >
                {LIBRARY_DEV_CMD}
              </code>
              <button
                type="button"
                className="secondary-button"
                onClick={() => void copyText(LIBRARY_DEV_CMD)}
              >
                Copy Command
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => void copyText(LIBRARY_AUDIO_CMD)}
              >
                Copy voice stack cmd
              </button>
            </div>
          </div>
        ) : null
      }
    >
      <div className="library-audio-strip" role="status" aria-label="Library audio dependencies">
        <div className={`lib-audio-chip ${storyOnline ? 'ok' : 'off'}`}>
          <span className="dot" aria-hidden />
          Story Architect {storyOnline ? 'live' : 'offline'}
          <code>:43120</code>
        </div>
        <div className={`lib-audio-chip ${kwsOnline ? 'ok' : 'off'}`}>
          <span className="dot" aria-hidden />
          KWS {kwsOnline ? 'live' : 'offline'}
          <code>:43110</code>
        </div>
        <div className={`lib-audio-chip ${beamMayConflict ? 'warn' : 'ok'}`}>
          <span className="dot" aria-hidden />
          {beamMayConflict
            ? 'Whisper beam active — may steal mic from Library voice'
            : 'Mic path clear for Library Web Speech'}
        </div>
        {!inTauri ? (
          <div className="lib-audio-chip warn">
            <span className="dot" aria-hidden />
            Chrome preview — start services via repo script
          </div>
        ) : null}
        <p className="library-audio-hint">
          Inside the Library, use Story Architect <strong>Enable Voice</strong> — that is the
          complete path (browser STT → KWS rules → AI relay TTS). Desktop Voice Hub remains the
          Whisper beam for terminals/agents. Shortcuts: <kbd>Tab</kbd> Story Architect ·{' '}
          <kbd>T</kbd> Timeline · <kbd>M</kbd> Empire Map.
        </p>
        {bootNote ? <p className="library-boot-note">{bootNote}</p> : null}
        {!audioReady ? (
          <div className="library-boot-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={() => void copyText(LIBRARY_AUDIO_CMD)}
            >
              Copy ensure-audio command
            </button>
          </div>
        ) : null}
      </div>

      <div className="library-toolbar">
        <label className="library-url-field">
          <span>Library URL</span>
          <input value={draftUrl} onChange={(event) => setDraftUrl(event.target.value)} />
        </label>
        <button type="button" className="primary-button" onClick={saveUrl}>
          Save
        </button>
        <button
          type="button"
          className="ghost-button"
          onClick={() => {
            setDraftUrl(DIRECT_DEV_VIRTUAL_LIBRARY_URL);
            setVirtualLibraryBaseUrl(DIRECT_DEV_VIRTUAL_LIBRARY_URL);
            setBaseUrlState(DIRECT_DEV_VIRTUAL_LIBRARY_URL);
            setReloadKey((value) => value + 1);
          }}
        >
          Use :5173 dev
        </button>
        <button
          type="button"
          className="ghost-button"
          onClick={() => {
            setDraftUrl(DEFAULT_VIRTUAL_LIBRARY_URL);
            setVirtualLibraryBaseUrl(DEFAULT_VIRTUAL_LIBRARY_URL);
            setBaseUrlState(DEFAULT_VIRTUAL_LIBRARY_URL);
            setReloadKey((value) => value + 1);
          }}
        >
          Use default host
        </button>
      </div>

      <div className="library-frame-wrap">
        {libraryOnline ? (
          <iframe
            key={embedUrl}
            src={embedUrl}
            title="Virtual Library"
            className="library-frame"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; xr-spatial-tracking; microphone; camera"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-pointer-lock allow-modals"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="library-frame-placeholder">
            <strong>Waiting for Library UI</strong>
            <p>
              The hub embeds the 3D Library once :5173 answers. Run the blueprints Vite app, then
              click Reload.
            </p>
            <code>{LIBRARY_DEV_CMD}</code>
          </div>
        )}
      </div>

      <style>{`
        .library-audio-strip {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid var(--tnf-border);
          background: rgba(26, 20, 16, 0.55);
        }
        .lib-audio-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid var(--tnf-border);
        }
        .lib-audio-chip code {
          font-size: 11px;
          opacity: 0.8;
        }
        .lib-audio-chip.ok {
          color: #6ee7b7;
          border-color: rgba(16, 185, 129, 0.35);
          background: rgba(16, 185, 129, 0.08);
        }
        .lib-audio-chip.off {
          color: #fca5a5;
          border-color: rgba(239, 68, 68, 0.35);
          background: rgba(239, 68, 68, 0.08);
        }
        .lib-audio-chip.warn {
          color: #fcd34d;
          border-color: rgba(245, 158, 11, 0.4);
          background: rgba(245, 158, 11, 0.1);
        }
        .lib-audio-chip .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }
        .library-audio-hint {
          flex-basis: 100%;
          margin: 4px 0 0;
          font-size: 12px;
          color: var(--tnf-text-secondary, #cbd5e1);
          line-height: 1.45;
        }
        .library-audio-hint kbd {
          font-size: 11px;
          padding: 1px 5px;
          border-radius: 4px;
          border: 1px solid var(--tnf-border);
          background: rgba(0,0,0,0.35);
        }
        .library-boot-note {
          flex-basis: 100%;
          margin: 0;
          font-size: 12px;
          color: #c4a35a;
        }
        .library-boot-actions {
          flex-basis: 100%;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .library-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: flex-end;
          margin-bottom: 12px;
        }
        .library-url-field {
          display: grid;
          gap: 4px;
          flex: 1;
          min-width: 220px;
          font-size: 12px;
          color: var(--tnf-text-muted);
        }
        .library-url-field input {
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid var(--tnf-border);
          background: rgba(15, 23, 42, 0.35);
          color: inherit;
        }
        .library-frame-wrap {
          flex: 1;
          min-height: 0;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--tnf-border);
          background: #1a1410;
        }
        .library-frame {
          width: 100%;
          height: 100%;
          min-height: calc(100vh - 320px);
          border: 0;
          display: block;
        }
        .library-frame-placeholder {
          min-height: calc(100vh - 320px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 24px;
          color: #d4b896;
          text-align: center;
        }
        .library-frame-placeholder code {
          background: rgba(0,0,0,0.35);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
        }
        .page-fill .page-fill-body,
                .page-fill > :not(.page-header):not(.synergy-status-bar):not(style) {
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
      `}</style>
    </PageShell>
  );
};

export default VirtualLibraryHub;
