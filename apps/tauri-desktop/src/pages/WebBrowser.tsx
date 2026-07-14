import React, { useEffect, useState } from 'react';
import BrowserControlPanel from '../components/browser/BrowserControlPanel';
import PageShell from '../components/layout/PageShell';
import SynergyStatusBar from '../components/layout/SynergyStatusBar';
import { useBrowserControl } from '../hooks/useBrowserControl';
import { useFederationNode } from '../hooks/useFederationNode';
import { useTnfBrowser } from '../hooks/useTnfBrowser';
import {
  closeTNFBrowserWebview,
  focusTNFBrowserWebview,
  navigateTNFBrowserWebview,
  openTNFBrowserWebview,
} from '../lib/tnfBrowserWebview';
import { useSettingsStore } from '../stores';

type TabState = { id: number; title: string; url: string; loading: boolean };

/**
 * TNF Browser control surface.
 * Left: navigator / live preview. Right: protocol operator panel (:7331).
 */
const WebBrowser: React.FC = () => {
  const browser = useBrowserControl();
  const tnf = useTnfBrowser();
  const federation = useFederationNode();
  const { environment } = useSettingsStore();
  const [currentTab, setCurrentTab] = useState(0);
  const [tabs, setTabs] = useState<TabState[]>([
    { id: 0, title: 'New Tab', url: 'about:blank', loading: false },
  ]);
  const [inputUrl, setInputUrl] = useState('');
  const [webviewOpen, setWebviewOpen] = useState(false);

  useEffect(() => {
    const liveUrl = tnf.state.currentUrl || browser.state.currentUrl;
    if (!liveUrl) return;
    setInputUrl(liveUrl);
    setTabs((prev) => {
      const tab = prev[currentTab];
      if (!tab) return prev;
      const nextTitle =
        tnf.state.currentTitle ||
        browser.state.currentTitle ||
        liveUrl.replace(/^https?:\/\//, '').split('/')[0] ||
        'Tab';
      if (tab.url === liveUrl && tab.title === nextTitle) return prev;
      return prev.map((item, index) =>
        index === currentTab ? { ...item, url: liveUrl, title: nextTitle } : item
      );
    });
  }, [
    tnf.state.currentUrl,
    tnf.state.currentTitle,
    browser.state.currentUrl,
    browser.state.currentTitle,
    currentTab,
  ]);

  const openLiveWebView = async (targetUrl: string) => {
    try {
      await openTNFBrowserWebview(targetUrl);
      setWebviewOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to open TNF Browser webview: ${message}`);
    }
  };

  const applyUrlToTab = (targetUrl: string, title?: string) => {
    setTabs((prev) => {
      const next = [...prev];
      const tab = next[currentTab];
      if (!tab) return prev;
      tab.url = targetUrl;
      tab.title =
        title ||
        targetUrl.replace(/^https?:\/\//, '').split('/')[0] ||
        (targetUrl === 'about:blank' ? 'New Tab' : 'Tab');
      return next;
    });
  };

  const navigateToUrl = async (rawUrl: string, event?: React.FormEvent) => {
    event?.preventDefault();
    let targetUrl = rawUrl.trim();
    if (!targetUrl || targetUrl === 'about:blank') return;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    setInputUrl(targetUrl);
    applyUrlToTab(targetUrl);

    if (tnf.state.status?.connected) {
      await tnf.navigate(targetUrl);
    } else {
      await browser.navigate(targetUrl);
    }

    if (webviewOpen) {
      try {
        await navigateTNFBrowserWebview(targetUrl);
      } catch (error) {
        console.error('TNF Browser webview navigation failed', error);
      }
    } else {
      await openLiveWebView(targetUrl);
    }
  };

  const handleNavigate = async (event?: React.FormEvent) => {
    await navigateToUrl(inputUrl, event);
  };

  const addTab = () => {
    const newId = Math.max(...tabs.map((tab) => tab.id), 0) + 1;
    const newTab = { id: newId, title: 'New Tab', url: 'about:blank', loading: false };
    setTabs((prev) => [...prev, newTab]);
    setCurrentTab(tabs.length);
    setInputUrl('');
  };

  const closeTab = (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (tabs.length === 1) return;

    const index = tabs.findIndex((tab) => tab.id === id);
    const newTabs = tabs.filter((tab) => tab.id !== id);
    setTabs(newTabs);

    if (currentTab === index) {
      const nextTab = index === 0 ? 0 : index - 1;
      setCurrentTab(nextTab);
      const nextUrl = newTabs[nextTab]?.url || 'about:blank';
      setInputUrl(nextUrl === 'about:blank' ? '' : nextUrl);
    } else if (currentTab > index) {
      setCurrentTab(currentTab - 1);
    }
  };

  const selectTab = (index: number) => {
    setCurrentTab(index);
    const nextUrl = tabs[index]?.url || 'about:blank';
    setInputUrl(nextUrl === 'about:blank' ? '' : nextUrl);
  };

  const activeUrl = tabs[currentTab]?.url || 'about:blank';
  const isBlank = activeUrl === 'about:blank';
  const tnfConnected = Boolean(tnf.state.status?.connected);
  const tnfListening = Boolean(tnf.state.status?.listening);
  const extensionMode = browser.state.extensionConnected;
  const previewShot = tnf.state.lastScreenshot || browser.state.lastScreenshot;

  const statusLabel = tnfConnected
    ? 'TNF Browser live'
    : tnfListening
      ? 'TNF Browser ready'
      : extensionMode
        ? 'Extension connected'
        : federation.state.registered
          ? 'Federation'
          : 'Offline';

  const statusClass =
    tnfConnected || extensionMode ? 'local' : federation.state.registered ? 'cloud' : 'offline';

  return (
    <PageShell
      className="page-fill"
      title="Browser Control"
      subtitle="TNF Browser — live DOM control on :7331, with relay and federation fallbacks"
      actions={<span className={`env-badge ${statusClass}`}>{statusLabel}</span>}
    >
      <SynergyStatusBar />
      <div className="page-fill-body">
        <div className="browser-page">
          <div className="browser-main">
            <div className="tab-bar">
              {tabs.map((tab, idx) => (
                <div
                  key={tab.id}
                  className={`tab ${currentTab === idx ? 'active' : ''}`}
                  onClick={() => selectTab(idx)}
                  role="tab"
                  aria-selected={currentTab === idx}
                >
                  <span className="tab-mark" aria-hidden />
                  <span className="tab-title">{tab.title}</span>
                  <button
                    className="tab-close"
                    onClick={(event) => closeTab(tab.id, event)}
                    aria-label={`Close ${tab.title}`}
                    type="button"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button className="add-tab-btn" onClick={addTab} aria-label="New tab" type="button">
                +
              </button>
            </div>

            <div className="browser-controls">
              <div className="nav-btns">
                <button
                  className="nav-btn"
                  title="Back"
                  type="button"
                  onClick={() => void browser.goBack()}
                >
                  ←
                </button>
                <button
                  className="nav-btn"
                  title="Forward"
                  type="button"
                  onClick={() => void browser.goForward()}
                >
                  →
                </button>
                <button
                  className="nav-btn"
                  title="Reload"
                  type="button"
                  onClick={() => {
                    if (tnfConnected) void tnf.reload();
                    else void browser.refresh();
                  }}
                >
                  ↻
                </button>
                <button
                  className="nav-btn"
                  title="Home"
                  type="button"
                  onClick={() => {
                    setInputUrl('');
                    applyUrlToTab('about:blank', 'New Tab');
                  }}
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
                  placeholder="Search or enter website address"
                  aria-label="Address bar"
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
                <div className={`env-badge ${extensionMode ? 'local' : 'sandbox'}`}>
                  {extensionMode ? 'Relay Live' : 'Relay Idle'}
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
                      Drive a real Chromium session through the live DOM — discover, click, html,
                      screenshot. Prefer inspect → act → verify.
                    </p>
                    <form className="search-box" onSubmit={handleNavigate}>
                      <input
                        type="text"
                        value={inputUrl}
                        onChange={(event) => setInputUrl(event.target.value)}
                        placeholder="Navigate anywhere…"
                        aria-label="New tab navigation"
                      />
                      <button type="submit">Go</button>
                    </form>
                    <div className="shortcuts">
                      {[
                        ['Example', 'https://example.com'],
                        ['TNF Docs', 'https://thenewfuse.com'],
                        ['Relay Health', 'http://127.0.0.1:3000/health'],
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
                    <div className="startup-hint">
                      {tnfListening ? (
                        tnfConnected ? (
                          <span>Connected to TNF Browser on :7331</span>
                        ) : (
                          <button type="button" onClick={() => void tnf.connect()}>
                            Connect to running TNF Browser
                          </button>
                        )
                      ) : (
                        <button type="button" onClick={() => void tnf.startRuntime()}>
                          Start TNF Browser runtime
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : extensionMode && !tnfConnected ? (
                <div className="extension-mode">
                  <div className="extension-banner">
                    <strong>Extension-controlled session</strong>
                    <p>{browser.state.currentTitle || activeUrl}</p>
                    <button type="button" onClick={() => void browser.openNative(activeUrl)}>
                      Open in system browser
                    </button>
                  </div>
                  {previewShot ? (
                    <img src={previewShot} alt="Live browser preview" className="live-preview" />
                  ) : (
                    <div className="live-placeholder">
                      <p>
                        Use Screenshot or Discover in the control panel to inspect the active tab.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="live-webview-surface">
                  <div className="live-webview-head">
                    <div className="live-webview-meta">
                      <strong>Live surface</strong>
                      <span className="live-webview-url">
                        {tnf.state.currentTitle || browser.state.currentTitle || activeUrl}
                      </span>
                    </div>
                    <div className="live-webview-actions">
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
                    </div>
                  </div>
                  <div className="live-webview-body">
                    {previewShot ? (
                      <img src={previewShot} alt="Live browser preview" className="live-preview" />
                    ) : (
                      <div className="live-placeholder">
                        <p>
                          The live site renders in a Tauri child WebView (native, not a sandboxed
                          iframe). Use Focus Window, or run Discover / Screenshot from the panel.
                        </p>
                        <button type="button" onClick={() => void openLiveWebView(activeUrl)}>
                          Open Live Window
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
              applyUrlToTab(url);
              await tnf.navigate(url);
              if (webviewOpen) await navigateTNFBrowserWebview(url).catch(() => undefined);
              else await openLiveWebView(url);
            }}
            onTnfReload={tnf.reload}
            onTnfScreenshot={tnf.takeScreenshot}
            onTnfDiscover={tnf.discover}
            onTnfHtml={tnf.readHtml}
            onTnfClick={tnf.click}
            onTnfRefreshTabs={tnf.refreshTabs}
            state={browser.state}
            federation={federation.state}
            onConnect={browser.connect}
            onFederationConnect={federation.connect}
            onFederationRefresh={federation.refresh}
            onSelectChannel={federation.selectChannel}
            onCreateChannel={federation.createChannel}
            onJoinChannel={federation.joinChannel}
            onLeaveChannel={federation.leaveChannel}
            onSendChannelMessage={federation.sendMessage}
            onPauseChannel={federation.pauseChannel}
            onResumeChannel={federation.resumeChannel}
            onNavigate={browser.navigate}
            onBack={browser.goBack}
            onForward={browser.goForward}
            onRefresh={browser.refresh}
            onScreenshot={browser.takeScreenshot}
            onAnalyze={browser.analyzePage}
            onStartSession={browser.startSession}
            onEndSession={browser.endSession}
            onOpenNative={browser.openNative}
            onRefreshTabs={browser.refreshTabs}
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
        .extension-banner {
          margin: 16px;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(8px);
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 12px;
          border: 1px solid var(--tnf-border);
        }
        .extension-banner button {
          margin-top: 8px;
          background: var(--tnf-accent, #06b6d4);
          color: #042f2e;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }
        .extension-mode, .new-tab-page {
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
        }
        .live-webview-actions button {
          background: rgba(255,255,255,0.06);
          color: white;
          border: 1px solid var(--tnf-border);
          border-radius: 6px;
          padding: 6px 12px;
          cursor: pointer;
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
          padding: 8px 12px;
          background: rgba(255,255,255,0.04);
          border-radius: 10px 10px 0 0;
          cursor: pointer;
          min-width: 120px;
        }
        .tab.active {
          background: rgba(6,182,212,0.14);
        }
        .tab-mark {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--tnf-accent, #06b6d4);
          opacity: 0.7;
          flex-shrink: 0;
        }
        .tab-close {
          background: transparent;
          border: none;
          color: inherit;
          cursor: pointer;
          margin-left: auto;
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
          .shortcuts { grid-template-columns: 1fr; }
        }
      `}</style>
        </div>
      </div>
    </PageShell>
  );
};

export default WebBrowser;
