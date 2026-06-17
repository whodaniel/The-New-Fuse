import React, { useMemo, useState } from 'react';
import PageShell from '../components/layout/PageShell';
import SynergyStatusBar from '../components/layout/SynergyStatusBar';
import { useRoute } from '../components/route-context';
import { desktopNativeOnlyRoutes } from '../config/routes';
import { resolveWebAppBaseUrl, WEB_SURFACES, webSurfaceUrl } from '../config/webSurfaces';
import { useOperatorSynergy } from '../hooks/useOperatorSynergy';
import { openExternal } from '../lib/openExternal';
import { useSettingsStore } from '../stores/settingsStore';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'core', label: 'Core' },
  { id: 'agents', label: 'Agents' },
  { id: 'workflows', label: 'Workflows' },
  { id: 'workspace', label: 'Workspace' },
] as const;

const WebParityHub: React.FC = () => {
  const { navigate } = useRoute();
  const { environment } = useSettingsStore();
  const { state: synergy } = useOperatorSynergy();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['id']>('all');
  const [query, setQuery] = useState('');

  const webBase = resolveWebAppBaseUrl(environment);

  const nativeOnly = desktopNativeOnlyRoutes();

  const surfaces = useMemo(() => {
    return WEB_SURFACES.filter((surface) => {
      const matchesCategory = category === 'all' || surface.category === category;
      const haystack = `${surface.name} ${surface.description}`.toLowerCase();
      const matchesQuery = !query.trim() || haystack.includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const openWeb = (path: string) => {
    void openExternal(webSurfaceUrl(webBase, path));
  };

  return (
    <PageShell
      title="Web Parity Hub"
      subtitle={`Desktop-native operator slice + ${WEB_SURFACES.length} surfaces aligned with thenewfuse.com and local frontend`}
      actions={
        <>
          <span className={`env-badge ${synergy.apiOnline ? 'cloud' : 'offline'}`}>
            API {synergy.apiOnline ? 'online' : 'offline'}
          </span>
          <button className="secondary-button" onClick={() => openWeb('/')}>
            Open thenewfuse.com
          </button>
        </>
      }
      banner={
        <div className="info-banner">
          Native desktop features (Browser Control, OAGI, Swarm Terminal, federation relay) run
          locally. Web-only surfaces open in your browser at <strong>{webBase}</strong>.
        </div>
      }
    >
      <SynergyStatusBar />
      <div className="parity-toolbar">
        <input
          className="parity-search"
          placeholder="Search surfaces..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="filter-tabs">
          {CATEGORIES.map((item) => (
            <button
              key={item.id}
              className={`filter-tab ${category === item.id ? 'active' : ''}`}
              onClick={() => setCategory(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <section className="tnf-section" style={{ marginBottom: 24 }}>
        <h2 className="tnf-section-title">Desktop-native only</h2>
        <div className="tnf-card-grid">
          {nativeOnly.map((route) => (
            <article key={route.id} className="tnf-card parity-card">
              <div className="parity-card-head">
                <span className="parity-icon">🖥️</span>
                <div>
                  <h3>{route.label}</h3>
                  <p>Tauri-native operator surface — not mirrored on thenewfuse.com</p>
                </div>
              </div>
              <div className="parity-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => navigate(route.path)}
                >
                  Open Native
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="tnf-card-grid">
        {surfaces.map((surface) => (
          <article key={surface.id} className="tnf-card parity-card">
            <div className="parity-card-head">
              <span className="parity-icon">{surface.icon}</span>
              <div>
                <h3>{surface.name}</h3>
                <p>{surface.description}</p>
              </div>
            </div>
            <div className="parity-actions">
              {surface.nativeRoute ? (
                <button
                  className="primary-button"
                  onClick={() => {
                    if (surface.nativeRoute) {
                      navigate(surface.nativeRoute);
                    }
                  }}
                >
                  Open Native
                </button>
              ) : null}
              <button className="ghost-button" onClick={() => openWeb(surface.path)}>
                Open on Web
              </button>
            </div>
          </article>
        ))}
      </div>

      {surfaces.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 16 }}>
          No surfaces match your search.
        </div>
      ) : null}

      <style>{`
        .parity-toolbar {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 22px;
        }
        .parity-search {
          width: 100%;
          max-width: 420px;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid var(--tnf-border);
          background: rgba(15, 23, 42, 0.6);
          color: var(--tnf-text-primary);
          font-size: 14px;
        }
        .parity-card h3 {
          margin: 0 0 6px;
          font-size: 1rem;
        }
        .parity-card p {
          margin: 0;
          color: var(--tnf-text-muted);
          font-size: 13px;
          line-height: 1.45;
        }
        .parity-card-head {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }
        .parity-icon {
          font-size: 28px;
          line-height: 1;
        }
        .parity-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
      `}</style>
    </PageShell>
  );
};

export default WebParityHub;
