import React, { useEffect, useMemo, useState } from 'react';
import BrowserControlPanel from '../components/browser/BrowserControlPanel';
import StartRuntimeHint from '../components/browser/StartRuntimeHint';
import PageShell from '../components/layout/PageShell';
import SynergyStatusBar from '../components/layout/SynergyStatusBar';
import { useComputerUseEmbed } from '../contexts/ComputerUseEmbedContext';
import { useTnfBrowser } from '../hooks/useTnfBrowser';
import {
  closeTNFBrowserWebview,
  focusTNFBrowserWebview,
  openTNFBrowserWebview,
} from '../lib/tnfBrowserWebview';
import { useSettingsStore } from '../stores';

function resolveNavigationInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === 'about:blank') return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (
    trimmed === 'localhost' ||
    trimmed.startsWith('localhost:') ||
    /^[\w.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(trimmed) ||
    /^\d{1,3}(\.\d{1,3}){3}(:\d+)?([/:?#].*)?$/.test(trimmed)
  ) {
    return `https://${trimmed}`;
  }
  return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
}

/**
 * TNF Browser operator console.
 *
 * There is exactly one transport: the Chromium session driven over :7331. When
 * it is not connected there is nothing to drive, so navigation is disabled
 * rather than falling back to a surface that cannot act.
 */
const WebBrowser: React.FC = () => {
  const embedded = useComputerUseEmbed();
  const tnf = useTnfBrowser();
  const { environment } = useSettingsStore();
  const [inputUrl, setInputUrl] = useState('');
  const [webviewOpen, setWebviewOpen] = useState(false);

  const tnfConnected = Boolean(tnf.state.status?.connected);
  const tnfListening = Boolean(tnf.state.status?.listening);
  const previewShot = tnf.state.lastScreenshot;

  const activeTnfTab = useMemo(
    () => tnf.state.tabs.find((tab) => tab.active) || tnf.state.tabs[0] || null,
    [tnf.state.tabs]
  );

  const activeUrl = activeTnfTab?.url || tnf.state.currentUrl || 'about:blank';
  const activeTitle = activeTnfTab?.title || tnf.state.currentTitle || activeUrl;
  const isBlank = !tnfConnected || !activeUrl || activeUrl === 'about:blank';

  useEffect(() => {
    const liveUrl = tnf.state.currentUrl || activeTnfTab?.url;
    if (!liveUrl) return;
    setInputUrl(liveUrl === 'about:blank' ? '' : liveUrl);
  }, [tnf.state.currentUrl, activeTnfTab?.url]);

  const openAuxiliaryWebView = async (targetUrl: string) => {
    try {
      await openTNFBrowserWebview(targetUrl);
      setWebviewOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to open auxiliary webview: ${message}`);
    }
  };

  const navigateToUrl = async (rawUrl: string, event?: React.FormEvent) => {
    event?.preventDefault();
    if (!tnfConnected) return;
    const targetUrl = resolveNavigationInput(rawUrl);
    if (!targetUrl) return;

    setInputUrl(targetUrl);
    await tnf.navigate(targetUrl, activeTnfTab?.id ?? null);
  };

  const handleNavigate = async (event?: React.FormEvent) => {
    await navigateToUrl(inputUrl, event);
  };

  const closeTab = (tabId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    void tnf.closeTab(tabId);
  };

  const handleHome = () => {
    void tnf.navigate('about:blank', activeTnfTab?.id ?? null);
    setInputUrl('');
  };

  const stripTabs = tnf.state.tabs.map((tab) => ({
    id: tab.id,
    title: tab.title || tab.url || 'Tab',
    url: tab.url || 'about:blank',
    active: Boolean(tab.active),
  }));

  const statusLabel = tnfConnected
    ? 'TNF Browser live'
    : tnfListening
      ? 'TNF Browser ready'
      : 'Offline';

  const statusClass = tnfConnected ? 'local' : tnfListening ? 'cloud' : 'offline';

  const body = (
    <div className="page-fill-body">
      {!embedded ? (
        <div className="browser-status-row">
          <span className={`env-badge ${statusClass}`}>{statusLabel}</span>
        </div>
      ) : null}
      <div className="browser-page">
        <div className="browser-main">
          <div className="tab-bar" role="tablist" aria-label="Browser tabs">
            {stripTabs.length === 0 ? (
              <div className="tab empty-tab">
                <span className="tab-title">
                  {tnfConnected ? 'No Chrome tabs' : 'Not connected'}
                </span>
              </div>
            ) : (
              stripTabs.map((tab) => (
                // role="tab" carries aria-selected, so it must be the focusable
                // element. The close control stays a real button inside it.
                <div
                  key={tab.id}
                  role="tab"
                  aria-selected={tab.active}
                  tabIndex={tab.active ? 0 : -1}
                  className={`tab ${tab.active ? 'active' : ''}`}
                  title={tab.url}
                  onClick={() => void tnf.activateTab(tab.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      void tnf.activateTab(tab.id);
                    }
                  }}
                >
                  <span className="tab-mark" aria-hidden />
                  <span className="tab-title">{tab.title}</span>
                  <button
                    type="button"
                    className="tab-close"
                    aria-label={`Close ${tab.title}`}
                    onClick={(event) => closeTab(tab.id, event)}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
            <button
              className="add-tab-btn"
              onClick={() => void tnf.createTab()}
              aria-label="New tab"
              type="button"
              disabled={!tnfConnected}
            >
              +
            </button>
          </div>

          <div className="browser-controls">
            <div className="nav-btns">
              <button
                className="nav-btn"
                title="Back"
                type="button"
                disabled={!tnfConnected}
                onClick={() => void tnf.goBack(activeTnfTab?.id ?? null)}
              >
                ←
              </button>
              <button
                className="nav-btn"
                title="Forward"
                type="button"
                disabled={!tnfConnected}
                onClick={() => void tnf.goForward(activeTnfTab?.id ?? null)}
              >
                →
              </button>
              <button
                className="nav-btn"
                title="Reload"
                type="button"
                disabled={!tnfConnected}
                onClick={() => void tnf.reload(activeTnfTab?.id ?? null)}
              >
                ↻
              </button>
              <button
                className="nav-btn"
                title="Home"
                type="button"
                disabled={!tnfConnected}
                onClick={handleHome}
              >
                ⌂
              </button>
            </div>

            <form className="address-bar-container" onSubmit={handleNavigate}>
              <input
                type="text"
                className="address-bar"
                value={inputUrl}
                onChange={(event) => setInputUrl(event.target.value)}
                placeholder={
                  tnfConnected ? 'Enter address or search…' : 'Connect to TNF Browser to navigate'
                }
                aria-label="Address bar"
                disabled={!tnfConnected}
              />
            </form>

            <div className="browser-actions">
              <div className={`env-badge ${environment}`} title="Current Connection Environment">
                <span className="env-dot" />
                {environment.charAt(0).toUpperCase() + environment.slice(1)}
              </div>
              <div
                className={`env-badge ${tnfConnected ? 'local' : tnfListening ? 'cloud' : 'sandbox'}`}
              >
                {tnfConnected ? 'TNF Live' : tnfListening ? 'TNF Ready' : 'TNF Offline'}
              </div>
              <div
                className={`env-badge ${tnf.state.status?.runtimeConnected ? 'local' : 'sandbox'}`}
              >
                {tnf.state.status?.runtimeConnected ? 'Extension Live' : 'Extension Idle'}
              </div>
            </div>
          </div>

          <div className="content-area">
            {isBlank ? (
              <div className="new-tab-page">
                <div className="new-tab-content">
                  <p className="brand-kicker">The New Fuse</p>
                  <h1>TNF Browser</h1>
                  <p className="lede">
                    {tnfConnected
                      ? 'Drive the real Chromium session through the live DOM — discover, click, type, screenshot. Prefer inspect → act → verify.'
                      : 'This console drives a real Chromium session over :7331. Nothing here can act until that runtime is connected.'}
                  </p>

                  {tnfConnected && (
                    <>
                      <form className="search-box" onSubmit={handleNavigate}>
                        <input
                          type="text"
                          value={inputUrl}
                          onChange={(event) => setInputUrl(event.target.value)}
                          placeholder="Navigate or search…"
                          aria-label="New tab navigation"
                        />
                        <button type="submit">Go</button>
                      </form>
                      <div className="shortcuts">
                        {[
                          ['Example', 'https://example.com'],
                          ['TNF Docs', 'https://thenewfuse.com'],
                          ['DuckDuckGo', 'https://duckduckgo.com'],
                        ].map(([label, url]) => (
                          <button
                            key={url}
                            className="shortcut-link"
                            type="button"
                            onClick={() => {
                              void navigateToUrl(url);
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="startup-hint">
                    {tnfConnected ? (
                      <span>Connected to TNF Browser on :7331</span>
                    ) : tnfListening ? (
                      <button type="button" onClick={() => void tnf.connect()}>
                        Connect to running TNF Browser
                      </button>
                    ) : (
                      <StartRuntimeHint
                        starting={tnf.state.starting}
                        result={tnf.state.startResult}
                        onStart={() => void tnf.startRuntime()}
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="live-webview-surface">
                <div className="live-webview-head">
                  <div className="live-webview-meta">
                    <strong>Controlled session</strong>
                    <span className="live-webview-url">{activeTitle}</span>
                  </div>
                  <div className="live-webview-actions">
                    <button type="button" onClick={() => void tnf.takeScreenshot()}>
                      Refresh Shot
                    </button>
                    <button
                      type="button"
                      onClick={() => void openAuxiliaryWebView(activeUrl)}
                      title="Opens a separate WebView — not the controlled Chromium session"
                    >
                      Open Separate Window
                    </button>
                    {webviewOpen && (
                      <>
                        <button type="button" onClick={() => void focusTNFBrowserWebview()}>
                          Focus Window
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await closeTNFBrowserWebview();
                            } catch {
                              /* ignore */
                            }
                            setWebviewOpen(false);
                          }}
                        >
                          Close Window
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="live-webview-body">
                  {previewShot ? (
                    <img
                      src={previewShot}
                      alt="Controlled Chromium screenshot"
                      className="live-preview"
                    />
                  ) : (
                    <div className="live-placeholder">
                      <p>
                        This panel shows screenshots of the controlled Chromium tab — not a live
                        embedded browser. Discover / Screenshot drive the real session on :7331.
                        “Open Separate Window” is an unrelated WebView with its own cookies.
                      </p>
                      <button type="button" onClick={() => void tnf.takeScreenshot()}>
                        Take Screenshot
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <BrowserControlPanel
          tnf={tnf.state}
          onTnfConnect={tnf.connect}
          onTnfDisconnect={tnf.disconnect}
          onTnfStart={tnf.startRuntime}
          onTnfNavigate={async (url) => {
            setInputUrl(url);
            await tnf.navigate(url, activeTnfTab?.id ?? null);
          }}
          onTnfReload={() => tnf.reload(activeTnfTab?.id ?? null)}
          onTnfScreenshot={tnf.takeScreenshot}
          onTnfDiscover={tnf.discover}
          onTnfHtml={tnf.readHtml}
          onTnfCopyFullHtml={tnf.readFullHtml}
          onTnfClick={tnf.click}
          onTnfType={tnf.typeText}
          onTnfKeyPress={tnf.keyPress}
          onTnfActivateTab={tnf.activateTab}
          onTnfCloseTab={tnf.closeTab}
          onTnfCreateTab={tnf.createTab}
          onTnfRefreshTabs={tnf.refreshTabs}
        />

        <style>{`
        .browser-page {
          display: flex;
          height: 100%;
          background: var(--tnf-obsidian);
          color: var(--tnf-text-primary, white);
        }
        .browser-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .tab-bar, .browser-controls, .content-area {
          width: 100%;
        }
        .content-area {
          flex: 1;
          min-height: 0;
          position: relative;
        }
        .new-tab-page {
          width: 100%;
          height: 100%;
        }
        .live-preview {
          width: 100%;
          height: 100%;
          border: 0;
          background: #0f172a;
          object-fit: contain;
        }
        .live-placeholder {
          display: grid;
          place-items: center;
          gap: 12px;
          height: 100%;
          color: var(--tnf-text-muted);
          padding: 24px;
          text-align: center;
        }
        .live-placeholder button,
        .startup-hint button {
          background: var(--tnf-accent, #06b6d4);
          color: #042f2e;
          border: none;
          border-radius: 8px;
          padding: 10px 14px;
          cursor: pointer;
          font-weight: 600;
        }
        .live-webview-surface {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          background:
            radial-gradient(ellipse at top, rgba(6, 182, 212, 0.08), transparent 55%),
            #0f172a;
        }
        .live-webview-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--tnf-border);
          background: rgba(2, 6, 23, 0.92);
        }
        .live-webview-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .live-webview-url {
          font-size: 12px;
          color: var(--tnf-text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .live-webview-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
          flex-wrap: wrap;
        }
        .live-webview-actions button {
          background: rgba(255,255,255,0.06);
          color: white;
          border: 1px solid var(--tnf-border);
          border-radius: 6px;
          padding: 6px 12px;
          cursor: pointer;
        }
        .live-webview-actions button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .live-webview-body {
          flex: 1;
          min-height: 0;
          position: relative;
          display: grid;
          place-items: center;
          padding: 24px;
          text-align: center;
        }
        .live-webview-body .live-preview {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border: 1px solid var(--tnf-border);
          border-radius: 8px;
        }
        .add-tab-btn, .nav-btns, .address-bar-container, .browser-actions, .tab-bar {
          display: flex;
        }
        .tab-bar {
          gap: 4px;
          padding: 8px 8px 0;
          overflow-x: auto;
        }
        .tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 4px 8px 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid transparent;
          border-radius: 10px 10px 0 0;
          min-width: 120px;
          max-width: 220px;
          color: inherit;
          cursor: pointer;
        }
        .tab:focus-visible {
          outline: 2px solid var(--tnf-accent, #06b6d4);
          outline-offset: -2px;
        }
        .tab.active {
          background: rgba(6,182,212,0.14);
        }
        .tab.empty-tab {
          padding: 8px 12px;
          cursor: default;
          color: var(--tnf-text-muted);
        }
        .tab-mark {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--tnf-accent, #06b6d4);
          opacity: 0.7;
          flex-shrink: 0;
        }
        .tab-title {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .tab-close {
          background: transparent;
          border: none;
          color: inherit;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .tab-close:hover {
          background: rgba(255,255,255,0.08);
        }
        .browser-controls {
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-bottom: 1px solid var(--tnf-border);
        }
        .address-bar-container { flex: 1; }
        .address-bar {
          width: 100%;
          box-sizing: border-box;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--tnf-border);
          color: white;
          border-radius: 10px;
          padding: 10px 16px;
        }
        .nav-btn, .add-tab-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--tnf-border);
          color: white;
          border-radius: 8px;
          padding: 8px 10px;
          cursor: pointer;
        }
        .browser-actions {
          gap: 8px;
          align-items: center;
        }
        .env-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 11px;
          border: 1px solid rgba(255,255,255,0.12);
        }
        .env-badge.local { color: #4ade80; }
        .env-badge.sandbox { color: #94a3b8; }
        .env-badge.cloud { color: #67e8f9; }
        .env-badge.production { color: #fb7185; }
        .env-badge.offline { color: #f87171; }
        .env-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }
        .new-tab-page {
          display: grid;
          place-items: center;
          background:
            radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.16), transparent 50%),
            linear-gradient(180deg, #0b1224 0%, #020617 100%);
        }
        .new-tab-content {
          width: min(720px, 100%);
          padding: 32px;
          text-align: center;
          animation: tnf-fade-in 420ms ease both;
        }
        .brand-kicker {
          margin: 0 0 8px;
          font-size: 12px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--tnf-accent, #67e8f9);
        }
        .new-tab-content h1 {
          margin: 0 0 10px;
          font-family: var(--tnf-font-heading, Outfit, sans-serif);
          font-size: clamp(2rem, 4vw, 2.8rem);
          color: var(--tnf-text-primary, #f8fafc);
        }
        .lede {
          margin: 0 auto;
          max-width: 34rem;
          color: var(--tnf-text-secondary, #cbd5e1);
          line-height: 1.55;
        }
        .search-box {
          display: flex;
          gap: 8px;
          margin: 28px 0 18px;
        }
        .search-box input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--tnf-border);
          color: white;
          border-radius: 10px;
          padding: 12px 14px;
        }
        .search-box button {
          background: var(--tnf-accent, #06b6d4);
          color: #042f2e;
          border: none;
          border-radius: 10px;
          padding: 12px 16px;
          cursor: pointer;
          font-weight: 600;
        }
        .shortcuts {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }
        .shortcut-link {
          background: transparent;
          border: 1px solid var(--tnf-border);
          color: var(--tnf-text-secondary, #cbd5e1);
          border-radius: 10px;
          padding: 12px 14px;
          cursor: pointer;
        }
        .shortcut-link:hover {
          border-color: rgba(6,182,212,0.45);
          color: white;
        }
        .startup-hint {
          margin-top: 22px;
          color: var(--tnf-text-muted);
          font-size: 13px;
        }
        @media (max-width: 900px) {
          .browser-page { flex-direction: column; }
          .browser-control-panel {
            width: 100% !important;
            min-width: 0 !important;
          }
          .shortcuts { grid-template-columns: 1fr; }
        }
      `}</style>
      </div>
    </div>
  );

  if (embedded) {
    return body;
  }

  return (
    <PageShell
      className="page-fill"
      title="Browser Control"
      subtitle="Operator console for the Chromium session on :7331 — not a built-in browser"
      actions={<span className={`env-badge ${statusClass}`}>{statusLabel}</span>}
    >
      <SynergyStatusBar />
      {body}
    </PageShell>
  );
};

export default WebBrowser;
