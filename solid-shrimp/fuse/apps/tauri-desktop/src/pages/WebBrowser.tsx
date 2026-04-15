import React, { useState } from 'react';
import { useSettingsStore } from '../stores';

/**
 * Web Browser Page - High-Performance Integrated Explorer
 * Features a modern multi-tab interface with premium design
 */
const WebBrowser: React.FC = () => {
  const [url, setUrl] = useState('https://www.google.com');
  const [currentTab, setCurrentTab] = useState(0);
  const [tabs, setTabs] = useState([
    { id: 0, title: 'Google', url: 'https://www.google.com', loading: false },
    { id: 1, title: 'GitHub', url: 'https://github.com', loading: false },
  ]);
  const [inputUrl, setInputUrl] = useState('https://www.google.com');
  const { environment } = useSettingsStore();

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let targetUrl = inputUrl;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    const newTabs = [...tabs];
    newTabs[currentTab].url = targetUrl;
    newTabs[currentTab].title = targetUrl
      .replace('https://', '')
      .replace('http://', '')
      .split('/')[0];
    setTabs(newTabs);
    setUrl(targetUrl);
    setInputUrl(targetUrl);
  };

  const addTab = () => {
    const newId = Math.max(...tabs.map((t) => t.id)) + 1;
    const newTab = { id: newId, title: 'New Tab', url: 'about:blank', loading: false };
    setTabs([...tabs, newTab]);
    setCurrentTab(tabs.length);
    setUrl('about:blank');
    setInputUrl('about:blank');
  };

  const closeTab = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;

    const index = tabs.findIndex((t) => t.id === id);
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);

    if (currentTab === index) {
      const nextTab = index === 0 ? 0 : index - 1;
      setCurrentTab(nextTab);
      setUrl(newTabs[nextTab].url);
      setInputUrl(newTabs[nextTab].url);
    } else if (currentTab > index) {
      setCurrentTab(currentTab - 1);
    }
  };

  const selectTab = (index: number) => {
    setCurrentTab(index);
    setUrl(tabs[index].url);
    setInputUrl(tabs[index].url);
  };

  return (
    <div className="browser-page">
      {/* Browser Tab Bar */}
      <div className="tab-bar">
        {tabs.map((tab, idx) => (
          <div
            key={tab.id}
            className={`tab ${currentTab === idx ? 'active' : ''}`}
            onClick={() => selectTab(idx)}
          >
            <span className="tab-favicon">🌐</span>
            <span className="tab-title">{tab.title}</span>
            <button className="tab-close" onClick={(e) => closeTab(tab.id, e)}>
              ×
            </button>
          </div>
        ))}
        <button className="add-tab-btn" onClick={addTab}>
          +
        </button>
      </div>

      {/* Browser Navigation Controls */}
      <div className="browser-controls">
        <div className="nav-btns">
          <button className="nav-btn" title="Back">
            ←
          </button>
          <button className="nav-btn" title="Forward">
            →
          </button>
          <button className="nav-btn" title="Reload">
            ↻
          </button>
          <button className="nav-btn" title="Home">
            🏠
          </button>
        </div>

        <form className="address-bar-container" onSubmit={handleNavigate}>
          <input
            type="text"
            className="address-bar"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Search or enter website address"
          />
        </form>

        <div className="browser-actions">
          <div className={`env-badge ${environment}`} title="Current Connection Environment">
            <span className="env-dot"></span>
            {environment.charAt(0).toUpperCase() + environment.slice(1)}
          </div>
          <button className="action-btn" title="Bookmarks">
            ⭐
          </button>
          <button className="action-btn" title="Downloads">
            📥
          </button>
          <button className="action-btn" title="Extensions">
            🧩
          </button>
          <button className="action-btn" title="Menu">
            ⋮
          </button>
        </div>
      </div>

      {/* Browser Content Area */}
      <div className="content-area">
        {url === 'about:blank' ? (
          <div className="new-tab-page">
            <div className="new-tab-content">
              <h1>The New Fuse</h1>
              <p>Experience the next generation of web browsing.</p>
              <div className="search-box">
                <input type="text" placeholder="Search with Google..." />
                <button>Search</button>
              </div>
              <div className="shortcuts">
                <div className="shortcut-card">
                  <div className="shortcut-icon github"></div>
                  <span>GitHub</span>
                </div>
                <div className="shortcut-card">
                  <div className="shortcut-icon docs"></div>
                  <span>Docs</span>
                </div>
                <div className="shortcut-card">
                  <div className="shortcut-icon tauri"></div>
                  <span>Tauri</span>
                </div>
                <div className="shortcut-card">
                  <div className="shortcut-icon ai"></div>
                  <span>AI Hub</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="iframe-container">
            <iframe
              src={url}
              className="content-frame"
              title="Browser View"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
            {/* Overlay to inform about iframe limitations */}
            <div className="browser-notice">
              <p>
                <strong>Security Notice:</strong> Complex sites (Google, GitHub) block embedded
                previews.
              </p>
              <button
                onClick={() => import('@tauri-apps/plugin-shell').then(({ open }) => open(url))}
                style={{
                  marginTop: '8px',
                  background: 'var(--tnf-primary)',
                  color: 'white',
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%',
                  fontSize: '11px',
                }}
              >
                Open in Native Window
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .browser-page {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--tnf-obsidian);
          color: white;
        }

        /* Iframe Notice */
        .browser-notice {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 11px;
          color: var(--tnf-text-muted);
          max-width: 300px;
          pointer-events: none;
          z-index: 100;
        }

        .iframe-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .add-tab-btn {
          background: transparent;
          border: none;
          color: var(--tnf-text-muted);
          font-size: 20px;
          padding: 0 12px;
          cursor: pointer;
          transition: color 0.2s;
        }

        .add-tab-btn:hover {
          color: white;
        }

        .nav-btns {
          display: flex;
          gap: 4px;
        }

        .address-bar-container {
          flex: 1;
        }

        /* New Tab Page */
        .new-tab-page {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: radial-gradient(circle at center, #1e293b 0%, #020617 100%);
        }

        .new-tab-content {
          text-align: center;
          max-width: 600px;
          width: 100%;
          padding: 40px;
        }

        .new-tab-content h1 {
          font-family: var(--tnf-font-heading);
          font-size: 48px;
          margin-bottom: 16px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .search-box {
          display: flex;
          gap: 12px;
          margin: 32px 0;
          background: rgba(255, 255, 255, 0.05);
          padding: 12px;
          border-radius: 12px;
          border: 1px solid var(--tnf-border);
        }

        .search-box input {
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          padding: 8px;
          font-size: 16px;
        }

        .search-box input:focus {
          outline: none;
        }

        .search-box button {
          background: var(--tnf-primary);
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .shortcuts {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .shortcut-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px;
          background: var(--tnf-surface);
          border: 1px solid var(--tnf-border);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .shortcut-card:hover {
          background: var(--tnf-surface-hover);
          transform: translateY(-4px);
          border-color: var(--tnf-primary);
        }

        .shortcut-icon {
          width: 48px;
          height: 48px;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.5));
        }

        .shortcut-icon.github { background-image: url('https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'); filter: invert(1); }
        .shortcut-icon.docs { background-image: url('https://cdn.iconscout.com/icon/free/png-256/free-google-docs-2981831-2476483.png'); }
        .shortcut-icon.tauri { background-image: url('https://tauri.app/img/favicon.png'); }
        .shortcut-icon.ai { background-image: url('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/GitHub_Copilot_logo.svg/1024px-GitHub_Copilot_logo.svg.png'); }

        .env-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid rgba(255, 255, 255, 0.2);
          margin-right: 8px;
          cursor: help;
        }

        .env-badge.local {
          background: rgba(34, 197, 94, 0.1);
          color: #4ade80;
          border-color: rgba(34, 197, 94, 0.2);
        }

        .env-badge.sandbox {
          background: rgba(167, 139, 250, 0.1);
          color: #a78bfa;
          border-color: rgba(167, 139, 250, 0.2);
        }

        .env-badge.production {
          background: rgba(244, 63, 94, 0.1);
          color: #fb7185;
          border-color: rgba(244, 63, 94, 0.2);
        }

        .env-dot {
          width: 6px;
          height: 6px;
          background: currentColor;
          border-radius: 50%;
          box-shadow: 0 0 4px currentColor;
        }
      `}</style>
    </div>
  );
};

export default WebBrowser;
