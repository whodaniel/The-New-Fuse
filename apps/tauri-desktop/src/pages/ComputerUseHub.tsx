import React, { lazy, Suspense, useMemo, useState } from 'react';
import PageShell from '../components/layout/PageShell';
import { useRoute } from '../components/route-context';
import { ComputerUseEmbedProvider } from '../contexts/ComputerUseEmbedContext';

const WebBrowser = lazy(() => import('./WebBrowser'));
const OAGIHub = lazy(() => import('./OAGIHub'));

type ComputerUseTab = 'browser' | 'screen';

function resolveInitialTab(params: Record<string, string>): ComputerUseTab {
  const raw = (params.tab || '').toLowerCase();
  if (raw === 'screen' || raw === 'oagi') return 'screen';
  return 'browser';
}

/**
 * Secondary agent-tools surface: Chromium browser control + screen automation.
 * Not a primary Operate product — summoned from Agent Hub / deep links.
 */
const ComputerUseHub: React.FC = () => {
  const { params, navigate } = useRoute();
  const [tab, setTab] = useState<ComputerUseTab>(() => resolveInitialTab(params));

  const subtitle = useMemo(
    () =>
      tab === 'browser'
        ? 'Agent browser via agent-browser — operator console, not a consumer web browser'
        : 'Screen capture and OS automation for agent computer-use',
    [tab]
  );

  const selectTab = (next: ComputerUseTab) => {
    setTab(next);
    navigate('/computer-use', { tab: next });
  };

  return (
    <PageShell
      className="page-fill"
      title="Computer Use"
      subtitle={subtitle}
      actions={
        <div className="cu-tabs" role="tablist" aria-label="Computer use tools">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'browser'}
            className={`cu-tab ${tab === 'browser' ? 'active' : ''}`}
            onClick={() => selectTab('browser')}
          >
            Browser runtime
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'screen'}
            className={`cu-tab ${tab === 'screen' ? 'active' : ''}`}
            onClick={() => selectTab('screen')}
          >
            Screen automation
          </button>
        </div>
      }
    >
      <ComputerUseEmbedProvider value={true}>
        <div className="cu-body page-fill-body">
          <Suspense fallback={<div className="cu-loading">Loading tool surface…</div>}>
            {tab === 'browser' ? <WebBrowser /> : <OAGIHub />}
          </Suspense>
        </div>
      </ComputerUseEmbedProvider>
      <style>{`
        .cu-tabs {
          display: inline-flex;
          gap: 6px;
          padding: 4px;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--tnf-border, rgba(255,255,255,0.1));
        }
        .cu-tab {
          border: none;
          background: transparent;
          color: var(--tnf-text-muted, #94a3b8);
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }
        .cu-tab.active {
          background: rgba(99, 102, 241, 0.25);
          color: var(--tnf-text-primary, #f8fafc);
        }
        .cu-body {
          min-height: 0;
          flex: 1;
        }
        .cu-loading {
          padding: 24px;
          color: var(--tnf-text-muted, #94a3b8);
        }
      `}</style>
    </PageShell>
  );
};

export default ComputerUseHub;
