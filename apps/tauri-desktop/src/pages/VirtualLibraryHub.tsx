import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageShell from '../components/layout/PageShell';
import SynergyStatusBar from '../components/layout/SynergyStatusBar';
import {
  buildVirtualLibraryEmbedUrl,
  DEFAULT_VIRTUAL_LIBRARY_URL,
  DIRECT_DEV_VIRTUAL_LIBRARY_URL,
  getVirtualLibraryBaseUrl,
  setVirtualLibraryBaseUrl,
} from '../config/virtualLibrary';
import { openExternal } from '../lib/openExternal';

const VirtualLibraryHub: React.FC = () => {
  const [baseUrl, setBaseUrlState] = useState(getVirtualLibraryBaseUrl);
  const [draftUrl, setDraftUrl] = useState(baseUrl);
  const [online, setOnline] = useState<boolean | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const embedUrl = useMemo(() => buildVirtualLibraryEmbedUrl(baseUrl), [baseUrl, reloadKey]);

  const probe = useCallback(async () => {
    try {
      await fetch(baseUrl, { mode: 'no-cors', cache: 'no-store' });
      setOnline(true);
    } catch {
      setOnline(false);
    }
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

  return (
    <PageShell
      className="page-fill"
      title="Virtual Library"
      subtitle="3D spatial library — Story Architect, timeline, and offline storage embedded from the canonical blueprints app."
      actions={
        <>
          <span className={`env-badge ${online ? 'local' : online === false ? 'offline' : ''}`}>
            {online ? 'Library online' : online === false ? 'Library offline' : 'Checking…'}
          </span>
          <button type="button" className="ghost-button" onClick={() => setReloadKey((v) => v + 1)}>
            Reload
          </button>
          <button type="button" className="secondary-button" onClick={() => void openExternal(baseUrl)}>
            Open in browser
          </button>
        </>
      }
      banner={
        online === false ? (
          <div className="info-banner">
            Start the library with{' '}
            <code>pnpm --filter virtual-library-blueprints dev</code> (port 3000) or{' '}
            <code>docker compose up virtual-library</code> (port 5173). Then set the URL below if
            needed.
          </div>
        ) : null
      }
    >
      <SynergyStatusBar />

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
          Use :3000 dev
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
          Use :5173 docker
        </button>
      </div>

      <div className="library-frame-wrap">
        <iframe
          key={embedUrl}
          src={embedUrl}
          title="Virtual Library"
          className="library-frame"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; xr-spatial-tracking"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-pointer-lock allow-modals"
        />
      </div>

      <style>{`
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
          min-height: calc(100vh - 280px);
          border: 0;
          display: block;
        }
        .page-fill .page-fill-body,
        .page-fill > :not(.page-header):not(.synergy-status-bar) {
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
      `}</style>
    </PageShell>
  );
};

export default VirtualLibraryHub;
