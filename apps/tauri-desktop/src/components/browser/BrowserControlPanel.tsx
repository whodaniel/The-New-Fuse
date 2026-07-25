import React, { useEffect, useState } from 'react';
import type { TnfBrowserHookState } from '../../hooks/useTnfBrowser';
import type { TnfBrowserStartResult } from '../../services/TnfBrowserService';

/** Discovered elements rendered before the list is explicitly expanded. */
const DISCOVER_PAGE = 40;

interface BrowserControlPanelProps {
  tnf: TnfBrowserHookState;
  onTnfConnect: () => Promise<boolean>;
  onTnfDisconnect: () => Promise<void>;
  onTnfStart: () => Promise<TnfBrowserStartResult>;
  onTnfNavigate: (url: string) => Promise<unknown>;
  onTnfReload: () => Promise<void>;
  onTnfScreenshot: () => Promise<unknown>;
  onTnfDiscover: () => Promise<unknown>;
  onTnfHtml: () => Promise<unknown>;
  onTnfCopyFullHtml: () => Promise<string>;
  onTnfClick: (selectorOrHandle: string) => Promise<unknown>;
  onTnfType: (text: string, selectorOrHandle?: string) => Promise<unknown>;
  onTnfKeyPress: (key: string) => Promise<unknown>;
  onTnfActivateTab: (tabId: number) => Promise<unknown>;
  onTnfCloseTab: (tabId: number) => Promise<unknown>;
  onTnfCreateTab: (url?: string) => Promise<unknown>;
  onTnfRefreshTabs: () => Promise<unknown>;
}

export const BrowserControlPanel: React.FC<BrowserControlPanelProps> = ({
  tnf,
  onTnfConnect,
  onTnfDisconnect,
  onTnfStart,
  onTnfNavigate,
  onTnfReload,
  onTnfScreenshot,
  onTnfDiscover,
  onTnfHtml,
  onTnfCopyFullHtml,
  onTnfClick,
  onTnfType,
  onTnfKeyPress,
  onTnfActivateTab,
  onTnfCloseTab,
  onTnfCreateTab,
  onTnfRefreshTabs,
}) => {
  const [urlInput, setUrlInput] = useState(tnf.currentUrl || 'https://example.com');
  const [selectorInput, setSelectorInput] = useState('');
  const [typeInput, setTypeInput] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [htmlExpanded, setHtmlExpanded] = useState(false);
  const [showAllDiscovered, setShowAllDiscovered] = useState(false);

  useEffect(() => {
    if (tnf.currentUrl) setUrlInput(tnf.currentUrl);
  }, [tnf.currentUrl]);

  const run = async (label: string, action: () => Promise<unknown>) => {
    setBusy(label);
    try {
      await action();
    } finally {
      setBusy(null);
    }
  };

  const connected = Boolean(tnf.status?.connected);
  const listening = Boolean(tnf.status?.listening);
  const runtime = Boolean(tnf.status?.runtimeConnected);
  const effectiveBusy = busy || tnf.busy;

  return (
    <aside className="browser-control-panel">
      <header className="panel-header">
        <h2>TNF Browser</h2>
        <p>
          Live DOM control over ws://127.0.0.1:{tnf.status?.port || 7331} — discover, click, html,
          screenshot.
        </p>
      </header>

      <section className="panel-section">
        <h3>Runtime</h3>
        <div className="status-grid">
          <StatusPill label="Server" ok={listening} />
          <StatusPill label="Client" ok={connected} />
          <StatusPill label="Extension" ok={runtime} />
        </div>
        <div className="panel-row wrap">
          {!listening && (
            <button
              className="panel-btn primary"
              disabled={!!effectiveBusy || tnf.starting}
              onClick={() => void run('start', onTnfStart)}
            >
              {tnf.starting ? 'Starting…' : 'Start TNF Browser'}
            </button>
          )}
          {!connected ? (
            <button
              className="panel-btn primary"
              disabled={!!effectiveBusy || tnf.connecting || !listening}
              onClick={() => void run('connect', onTnfConnect)}
            >
              {tnf.connecting ? 'Connecting…' : 'Connect'}
            </button>
          ) : (
            <button
              className="panel-btn"
              disabled={!!effectiveBusy}
              onClick={() => void run('disconnect', onTnfDisconnect)}
            >
              Disconnect
            </button>
          )}
        </div>
        {tnf.startResult && !tnf.startResult.ok && (
          <p className="panel-error">{tnf.startResult.message}</p>
        )}
        {!listening && (
          <p className="panel-hint">
            Or from a terminal:{' '}
            <code>{tnf.startResult?.command || 'node packages/tnf-browser/bin/cli.js start'}</code>
          </p>
        )}
        {(tnf.lastError || tnf.status?.lastError) && (
          <p className="panel-error">{tnf.lastError || tnf.status?.lastError}</p>
        )}
      </section>

      <section className="panel-section">
        <h3>Navigate</h3>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void run('navigate', () => onTnfNavigate(urlInput));
          }}
        >
          <input
            className="panel-input"
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            placeholder="https://example.com"
            aria-label="TNF Browser URL"
          />
          <div className="panel-row">
            <button
              className="panel-btn primary"
              type="submit"
              disabled={!!effectiveBusy || !connected}
            >
              Go
            </button>
            <button
              className="panel-btn"
              type="button"
              disabled={!!effectiveBusy || !connected}
              onClick={() => void run('reload', onTnfReload)}
            >
              Reload
            </button>
            <button
              className="panel-btn"
              type="button"
              disabled={!!effectiveBusy || !connected}
              onClick={() => void run('tabs', onTnfRefreshTabs)}
            >
              Refresh
            </button>
          </div>
        </form>
      </section>

      <section className="panel-section">
        <h3>Inspect</h3>
        <div className="panel-row wrap">
          <button
            className="panel-btn"
            disabled={!!effectiveBusy || !connected}
            onClick={() => void run('discover', onTnfDiscover)}
          >
            Discover
          </button>
          <button
            className="panel-btn"
            disabled={!!effectiveBusy || !connected}
            onClick={() => void run('html', onTnfHtml)}
          >
            HTML
          </button>
          <button
            className="panel-btn"
            disabled={!!effectiveBusy || !connected}
            onClick={() => void run('screenshot', onTnfScreenshot)}
          >
            Screenshot
          </button>
        </div>
        <form
          className="selector-row"
          onSubmit={(event) => {
            event.preventDefault();
            if (!selectorInput.trim()) return;
            void run('click', () => onTnfClick(selectorInput.trim()));
          }}
        >
          <input
            className="panel-input"
            value={selectorInput}
            onChange={(event) => setSelectorInput(event.target.value)}
            placeholder="selector or el_N"
            aria-label="Click target"
          />
          <button
            className="panel-btn primary"
            type="submit"
            disabled={!!effectiveBusy || !connected || !selectorInput.trim()}
          >
            Click
          </button>
        </form>
        <form
          className="type-row"
          onSubmit={(event) => {
            event.preventDefault();
            if (!typeInput) return;
            void run('type', async () => {
              await onTnfType(typeInput, selectorInput.trim() || undefined);
              setTypeInput('');
            });
          }}
        >
          <input
            className="panel-input"
            value={typeInput}
            onChange={(event) => setTypeInput(event.target.value)}
            placeholder="Text to type (uses selector above if set)"
            aria-label="Type into page"
          />
          <button
            className="panel-btn primary"
            type="submit"
            disabled={!!effectiveBusy || !connected || !typeInput}
          >
            Type
          </button>
          <button
            className="panel-btn"
            type="button"
            disabled={!!effectiveBusy || !connected}
            onClick={() => void run('enter', () => onTnfKeyPress('Enter'))}
          >
            Enter
          </button>
        </form>
      </section>

      <section className="panel-section">
        <div className="section-head">
          <h3>Tabs ({tnf.tabs.length})</h3>
          <button
            className="panel-btn"
            type="button"
            disabled={!!effectiveBusy || !connected}
            onClick={() => void run('createTab', () => onTnfCreateTab())}
          >
            + Tab
          </button>
        </div>
        {tnf.tabs.length === 0 ? (
          <p className="panel-hint">No Chrome tabs yet. Connect and create one.</p>
        ) : (
          <ul className="tab-list">
            {tnf.tabs.map((tab) => (
              <li key={tab.id} className={tab.active ? 'active' : ''}>
                <button
                  type="button"
                  className="discover-item"
                  disabled={!!effectiveBusy || !connected}
                  onClick={() => void run('activateTab', () => onTnfActivateTab(tab.id))}
                >
                  <strong>{tab.title || 'Untitled'}</strong>
                  <span>{tab.url}</span>
                </button>
                <button
                  type="button"
                  className="tab-close-btn"
                  aria-label={`Close ${tab.title || tab.url}`}
                  disabled={!!effectiveBusy || !connected}
                  onClick={() => void run('closeTab', () => onTnfCloseTab(tab.id))}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {tnf.discovered.length > 0 && (
        <section className="panel-section">
          <div className="section-head">
            <h3>
              Discovered{' '}
              <span className="section-meta">
                {showAllDiscovered || tnf.discovered.length <= DISCOVER_PAGE
                  ? `${tnf.discovered.length} elements`
                  : `${DISCOVER_PAGE} of ${tnf.discovered.length} shown`}
              </span>
            </h3>
            {tnf.discovered.length > DISCOVER_PAGE && (
              <button
                type="button"
                className="panel-btn"
                onClick={() => setShowAllDiscovered((prev) => !prev)}
              >
                {showAllDiscovered ? `Show ${DISCOVER_PAGE}` : 'Show all'}
              </button>
            )}
          </div>
          <ul
            className={
              showAllDiscovered ? 'tab-list discover-list expanded' : 'tab-list discover-list'
            }
          >
            {(showAllDiscovered ? tnf.discovered : tnf.discovered.slice(0, DISCOVER_PAGE)).map(
              (el, index) => {
                const handle = String(el.handleId || '');
                const label =
                  el.label ||
                  el.text ||
                  el.id ||
                  el.cls ||
                  el.tag ||
                  handle ||
                  `element ${index + 1}`;
                return (
                  <li key={`${handle}-${index}`}>
                    <button
                      type="button"
                      className="discover-item"
                      disabled={!!effectiveBusy || !connected || !handle}
                      onClick={() => void run('click', () => onTnfClick(handle))}
                    >
                      <strong>{String(label).slice(0, 64)}</strong>
                      <span>
                        {el.tag || 'el'}
                        {handle ? ` · ${handle}` : ''}
                      </span>
                    </button>
                  </li>
                );
              }
            )}
          </ul>
        </section>
      )}

      {tnf.htmlPreview && (
        <section className="panel-section">
          <div className="section-head">
            <h3>
              HTML{' '}
              <span className="section-meta">
                {tnf.htmlLength > tnf.htmlPreview.length
                  ? `${tnf.htmlPreview.length.toLocaleString()} of ${tnf.htmlLength.toLocaleString()} chars`
                  : `${tnf.htmlPreview.length.toLocaleString()} chars`}
              </span>
            </h3>
            <div className="head-actions">
              <button
                type="button"
                className="panel-btn"
                onClick={() => setHtmlExpanded((prev) => !prev)}
              >
                {htmlExpanded ? 'Collapse' : 'Expand'}
              </button>
              {tnf.htmlLength > tnf.htmlPreview.length ? (
                <CopyButton label="Copy full" value={onTnfCopyFullHtml} disabled={!connected} />
              ) : (
                <CopyButton label="Copy" value={tnf.htmlPreview} />
              )}
            </div>
          </div>
          <pre className={htmlExpanded ? 'html-preview expanded' : 'html-preview'}>
            {tnf.htmlPreview}
          </pre>
        </section>
      )}

      {tnf.lastScreenshot && (
        <section className="panel-section">
          <h3>Last Screenshot</h3>
          <img
            src={tnf.lastScreenshot}
            alt="Controlled Chromium screenshot"
            className="screenshot-preview"
          />
        </section>
      )}

      <section className="panel-section panel-log">
        <div className="section-head">
          <h3>Activity</h3>
          {tnf.activityLog.length > 0 && (
            <CopyButton label="Copy log" value={tnf.activityLog.slice().reverse().join('\n')} />
          )}
        </div>
        <div className="log-stream">
          {tnf.activityLog.length === 0 ? (
            <p className="panel-hint">No activity yet.</p>
          ) : (
            tnf.activityLog.map((line, index) => (
              <div key={`${line}-${index}`} className="log-line">
                {line}
              </div>
            ))
          )}
        </div>
      </section>

      <style>{panelCss}</style>
    </aside>
  );
};

const panelCss = `
  .browser-control-panel {
    width: 380px;
    min-width: 320px;
    border-left: 1px solid var(--tnf-border, rgba(255,255,255,0.08));
    background: rgba(2, 6, 23, 0.92);
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow-y: auto;
  }
  .panel-header {
    padding: 18px 20px 12px;
    border-bottom: 1px solid var(--tnf-border);
  }
  .panel-header h2 {
    margin: 0 0 6px;
    font-size: 17px;
    font-family: var(--tnf-font-heading, Outfit, sans-serif);
  }
  .panel-header p {
    margin: 0;
    color: var(--tnf-text-muted, #94a3b8);
    font-size: 12px;
    line-height: 1.45;
  }
  .panel-section {
    padding: 14px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .panel-section h3 {
    margin: 0 0 12px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--tnf-text-muted);
  }
  .status-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 12px;
  }
  .panel-input {
    width: 100%;
    box-sizing: border-box;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--tnf-border);
    color: var(--tnf-text-primary, white);
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 10px;
  }
  .panel-row {
    display: flex;
    gap: 8px;
  }
  .panel-row.wrap {
    flex-wrap: wrap;
  }
  .selector-row,
  .type-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    margin-top: 10px;
  }
  .type-row {
    grid-template-columns: 1fr auto auto;
  }
  .selector-row .panel-input,
  .type-row .panel-input {
    margin-bottom: 0;
  }
  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 12px;
  }
  .section-head h3 {
    margin: 0;
  }
  .section-head .panel-btn {
    flex: 0;
    white-space: nowrap;
  }
  .tab-list li {
    position: relative;
  }
  .tab-close-btn {
    position: absolute;
    top: 6px;
    right: 6px;
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
  }
  .tab-close-btn:hover:not(:disabled) {
    color: #fecaca;
    background: rgba(239, 68, 68, 0.15);
  }
  .panel-btn {
    flex: 1;
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--tnf-border);
    color: white;
    border-radius: 8px;
    padding: 8px 10px;
    cursor: pointer;
    font-size: 12px;
  }
  .panel-btn.primary {
    background: var(--tnf-accent, #06b6d4);
    color: #042f2e;
    border-color: transparent;
    font-weight: 600;
  }
  .panel-btn.danger {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.35);
    color: #fecaca;
  }
  .panel-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .panel-error {
    color: #fca5a5;
    font-size: 12px;
    margin: 8px 0 0;
  }
  .panel-hint {
    color: var(--tnf-text-muted);
    font-size: 12px;
    line-height: 1.5;
    margin: 8px 0 0;
  }
  .panel-hint code {
    font-family: var(--tnf-font-mono, ui-monospace, monospace);
    font-size: 11px;
    color: var(--tnf-accent, #67e8f9);
  }
  .tab-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 180px;
    overflow-y: auto;
  }
  .discover-list {
    max-height: 220px;
  }
  .tab-list li {
    padding: 0;
    border-radius: 8px;
    background: rgba(255,255,255,0.03);
    border: 1px solid transparent;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .tab-list li.active {
    border-color: rgba(6, 182, 212, 0.45);
  }
  .tab-list li > strong,
  .tab-list li > span {
    padding: 8px 10px 0;
  }
  .tab-list li > span:last-child {
    padding: 0 10px 8px;
  }
  .tab-list strong {
    font-size: 12px;
  }
  .tab-list span {
    font-size: 11px;
    color: var(--tnf-text-muted);
    word-break: break-all;
  }
  .discover-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    width: 100%;
    background: transparent;
    border: none;
    color: inherit;
    text-align: left;
    padding: 8px 10px;
    cursor: pointer;
  }
  .discover-item:hover:not(:disabled) {
    background: rgba(6, 182, 212, 0.08);
  }
  .screenshot-preview {
    width: 100%;
    border-radius: 8px;
    border: 1px solid var(--tnf-border);
  }
  .section-meta {
    text-transform: none;
    letter-spacing: 0;
    font-weight: 400;
    color: var(--tnf-text-muted);
    opacity: 0.75;
  }
  .head-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }
  .head-actions .panel-btn {
    flex: 0;
    white-space: nowrap;
    padding: 4px 10px;
    font-size: 11px;
  }
  .discover-list.expanded {
    max-height: 60vh;
  }
  .html-preview.expanded {
    max-height: 60vh;
  }
  .html-preview {
    margin: 0;
    max-height: 160px;
    overflow: auto;
    padding: 10px;
    border-radius: 8px;
    background: rgba(0,0,0,0.35);
    border: 1px solid var(--tnf-border);
    font-family: var(--tnf-font-mono, ui-monospace, monospace);
    font-size: 10px;
    white-space: pre-wrap;
    color: #cbd5e1;
  }
  .panel-log .log-stream {
    max-height: 160px;
    overflow-y: auto;
    font-family: var(--tnf-font-mono, ui-monospace, monospace);
    font-size: 11px;
  }
  .log-line {
    padding: 4px 0;
    color: #cbd5e1;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .panel-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    padding: 12px 16px 0;
  }
  .panel-tabs .tab {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: #cbd5e1;
    border-radius: 8px;
    padding: 8px 8px;
    cursor: pointer;
    font-size: 11px;
  }
  .panel-tabs .tab.active {
    background: rgba(6,182,212,0.16);
    border-color: rgba(6,182,212,0.4);
    color: white;
  }
  .status-pill {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 10px;
    border-radius: 8px;
    font-size: 11px;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .status-pill.ok {
    background: rgba(16, 185, 129, 0.12);
    color: #6ee7b7;
  }
  .status-pill.off {
    background: rgba(148, 163, 184, 0.08);
    color: #94a3b8;
  }
  .status-pill strong {
    font-size: 12px;
  }
`;

/**
 * Inspect output is only useful if it can leave the panel.
 * `value` may be a thunk when the payload should be fetched fresh on click.
 */
const CopyButton: React.FC<{
  label: string;
  value: string | (() => Promise<string>);
  disabled?: boolean;
}> = ({ label, value, disabled }) => {
  const [status, setStatus] = useState<'idle' | 'working' | 'copied'>('idle');
  return (
    <button
      type="button"
      className="panel-btn"
      disabled={disabled || status === 'working'}
      onClick={async () => {
        setStatus('working');
        try {
          const text = typeof value === 'function' ? await value() : value;
          await navigator.clipboard.writeText(text);
          setStatus('copied');
          setTimeout(() => setStatus('idle'), 1600);
        } catch {
          setStatus('idle');
        }
      }}
    >
      {status === 'copied' ? 'Copied' : status === 'working' ? '…' : label}
    </button>
  );
};

const StatusPill: React.FC<{ label: string; ok: boolean }> = ({ label, ok }) => (
  <div className={`status-pill ${ok ? 'ok' : 'off'}`}>
    <span>{label}</span>
    <strong>{ok ? 'ON' : 'OFF'}</strong>
  </div>
);

export default BrowserControlPanel;
