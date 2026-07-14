import React, { useEffect, useState } from 'react';
import BrowserControlPanel from '../components/browser/BrowserControlPanel';
import PageShell from '../components/layout/PageShell';
import SynergyStatusBar from '../components/layout/SynergyStatusBar';
import { useBrowserControl } from '../hooks/useBrowserControl';
import { useFederationNode } from '../hooks/useFederationNode';
import { useSettingsStore } from '../stores';

/**
 * Web Browser + TNF Browser Control Surface
 * Left: preview / new-tab UX. Right: relay-backed operator panel.
 */
const WebBrowser: React.FC = () => {
  const browser = useBrowserControl();
  const federation = useFederationNode();
  const { environment } = useSettingsStore();
  const [currentTab, setCurrentTab] = useState(0);
  const [tabs, setTabs] = useState([
    { id: 0, title: 'New Tab', url: 'about:blank', loading: false },
  ]);
  const [inputUrl, setInputUrl] = useState('https://example.com');

  useEffect(() => {
    if (browser.state.currentUrl) {
      setInputUrl(browser.state.currentUrl);
    }
  }, [browser.state.currentUrl]);

  const applyUrlToTab = (targetUrl: string, title?: string) => {
    setTabs((prev) => {
      const next = [...prev];
      const tab = next[currentTab];
      if (!tab) return prev;
      tab.url = targetUrl;
      tab.title =
        title ||
        targetUrl.replace('https://', '').replace('http://', '').split('/')[0] ||
        'New Tab';
      return next;
    });
  };

  const navigateToUrl = async (rawUrl: string, event?: React.FormEvent) => {
    event?.preventDefault();
    let targetUrl = rawUrl.trim();
    if (!targetUrl) return;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    setInputUrl(targetUrl);
    applyUrlToTab(targetUrl);
    await browser.navigate(targetUrl);
  };

  const handleNavigate = async (event?: React.FormEvent) => {
    await navigateToUrl(inputUrl, event);
  };

  const addTab = () => {
    const newId = Math.max(...tabs.map((tab) => tab.id), 0) + 1;
    const newTab = { id: newId, title: 'New Tab', url: 'about:blank', loading: false };
    setTabs((prev) => [...prev, newTab]);
    setCurrentTab(tabs.length);
    setInputUrl('about:blank');
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
      setInputUrl(newTabs[nextTab]?.url || 'about:blank');
    } else if (currentTab > index) {
      setCurrentTab(currentTab - 1);
    }
  };

  const selectTab = (index: number) => {
    setCurrentTab(index);
    setInputUrl(tabs[index]?.url || 'about:blank');
  };

  const activeUrl = tabs[currentTab]?.url || 'about:blank';
  const extensionMode = browser.state.extensionConnected;

  return (
    <PageShell
      className="page-fill"
      title="Browser Control"
      subtitle="Lux Bridge — Chrome extension relay + operator panel (Forefront)"
      actions={
        <span
          className={`env-badge ${extensionMode ? 'local' : federation.state.registered ? 'cloud' : 'offline'}`}
        >
          {extensionMode
            ? 'Extension connected'
            : federation.state.registered
              ? 'Federation'
              : 'Offline'}
        </span>
      }
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
                >
                  <span className="tab-favicon">🌐</span>
                  <span className="tab-title">{tab.title}</span>
                  <button className="tab-close" onClick={(event) => closeTab(tab.id, event)}>
                    ×
                  </button>
                </div>
              ))}
              <button className="add-tab-btn" onClick={addTab}>
                +
              </button>
            </div>

            <div className="browser-controls">
              <div className="nav-btns">
                <button className="nav-btn" title="Back" onClick={() => void browser.goBack()}>
                  ←
                </button>
                <button
                  className="nav-btn"
                  title="Forward"
                  onClick={() => void browser.goForward()}
                >
                  →
                </button>
                <button className="nav-btn" title="Reload" onClick={() => void browser.refresh()}>
                  ↻
                </button>
                <button
                  className="nav-btn"
                  title="Home"
                  onClick={() => {
                    setInputUrl('about:blank');
                    applyUrlToTab('about:blank', 'New Tab');
                  }}
                >
                  🏠
                </button>
              </div>

              <form className="address-bar-container" onSubmit={handleNavigate}>
                <input
                  type="text"
                  className="address-bar"
                  value={inputUrl}
                  onChange={(event) => setInputUrl(event.target.value)}
                  placeholder="Search or enter website address"
                />
              </form>

              <div className="browser-actions">
                <div className={`env-badge ${environment}`} title="Current Connection Environment">
                  <span className="env-dot"></span>
                  {environment.charAt(0).toUpperCase() + environment.slice(1)}
                </div>
                <div className={`env-badge ${extensionMode ? 'local' : 'sandbox'}`}>
                  {extensionMode ? 'Extension Live' : 'Preview Mode'}
                </div>
                <div className={`env-badge ${federation.state.registered ? 'local' : 'sandbox'}`}>
                  {federation.state.registered ? 'Federation Live' : 'Federation Node'}
                </div>
              </div>
            </div>

            <div className="content-area">
              {activeUrl === 'about:blank' ? (
                <div className="new-tab-page">
                  <div className="new-tab-content">
                    <h1>TNF Desktop App</h1>
                    <p>The New Fuse — local browser control and standalone federation node.</p>
                    <form className="search-box" onSubmit={handleNavigate}>
                      <input
                        type="text"
                        value={inputUrl === 'about:blank' ? '' : inputUrl}
                        onChange={(event) => setInputUrl(event.target.value)}
                        placeholder="Navigate anywhere..."
                      />
                      <button type="submit">Go</button>
                    </form>
                    <div className="shortcuts">
                      {[
                        ['GitHub', 'https://github.com'],
                        ['TNF Docs', 'https://thenewfuse.com'],
                        ['Relay Health', 'http://127.0.0.1:3000/health'],
                      ].map(([label, url]) => (
                        <button
                          key={url}
                          className="shortcut-card"
                          onClick={() => {
                            void navigateToUrl(url);
                          }}
                        >
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : extensionMode ? (
                <div className="extension-mode">
                  <div className="extension-banner">
                    <strong>Extension-controlled session</strong>
                    <p>{browser.state.currentTitle || activeUrl}</p>
                    <button onClick={() => void browser.openNative(activeUrl)}>
                      Open in system browser
                    </button>
                  </div>
                  {browser.state.lastScreenshot ? (
                    <img
                      src={browser.state.lastScreenshot}
                      alt="Live browser preview"
                      className="live-preview"
                    />
                  ) : (
                    <div className="live-placeholder">
                      <p>
                        Use Screenshot or Analyze in the control panel to inspect the active tab.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="iframe-container">
                  <iframe
                    src={activeUrl}
                    className="content-frame"
                    title="Browser View"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                  />
                  <div className="browser-notice">
                    <p>
                      <strong>Preview mode:</strong> complex sites may block embedded previews.
                      Connect the TNF Chrome extension for full browser control.
                    </p>
                    <button onClick={() => void browser.openNative(activeUrl)}>
                      Open in Native Window
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <BrowserControlPanel
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
          color: white;
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
        .browser-notice, .extension-banner {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 12px;
          max-width: 320px;
          z-index: 20;
        }
        .browser-notice button, .extension-banner button {
          margin-top: 8px;
          background: var(--tnf-primary);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          width: 100%;
        }
        .iframe-container, .extension-mode, .new-tab-page {
          width: 100%;
          height: 100%;
        }
        .content-frame, .live-preview {
          width: 100%;
          height: 100%;
          border: 0;
          background: #0f172a;
        }
        .live-placeholder {
          display: grid;
          place-items: center;
          height: 100%;
          color: var(--tnf-text-muted);
          padding: 24px;
          text-align: center;
        }
        .extension-banner {
          position: static;
          margin: 16px;
          max-width: none;
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
          background: rgba(99,102,241,0.18);
        }
        .tab-close {
          background: transparent;
          border: none;
          color: inherit;
          cursor: pointer;
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
          border-radius: 999px;
          padding: 10px 16px;
        }
        .nav-btn, .add-tab-btn, .action-btn {
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
          border-radius: 999px;
          font-size: 11px;
          border: 1px solid rgba(255,255,255,0.12);
        }
        .env-badge.local { color: #4ade80; }
        .env-badge.sandbox { color: #a78bfa; }
        .env-badge.production { color: #fb7185; }
        .env-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }
        .new-tab-page {
          display: grid;
          place-items: center;
          background: radial-gradient(circle at center, #1e293b 0%, #020617 100%);
        }
        .new-tab-content {
          width: min(720px, 100%);
          padding: 32px;
          text-align: center;
        }
        .new-tab-content h1 {
          margin: 0 0 8px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .search-box {
          display: flex;
          gap: 8px;
          margin: 24px 0;
        }
        .search-box input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--tnf-border);
          color: white;
          border-radius: 10px;
          padding: 12px 14px;
        }
        .search-box button, .shortcut-card {
          background: var(--tnf-primary);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 12px 16px;
          cursor: pointer;
        }
        .shortcuts {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        .shortcut-card {
          background: rgba(255,255,255,0.05);
        }
      `}</style>
        </div>
      </div>
    </PageShell>
  );
};

export default WebBrowser;
