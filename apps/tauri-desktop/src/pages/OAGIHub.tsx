import { invoke } from '@tauri-apps/api/core';
import React, { useEffect, useState } from 'react';
import PageShell from '../components/layout/PageShell';
import SynergyStatusBar from '../components/layout/SynergyStatusBar';
import { openExternal } from '../lib/openExternal';

/**
 * OAGI Hub - Optimized Agentic General Intelligence Hub
 * Powering local computer automation and visual understanding
 */
const OAGIHub: React.FC = () => {
  const [screenSize, setScreenSize] = useState<{ width: number; height: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const loadInitData = async () => {
      try {
        // Rust returns (width, height) tuple — not { width, height }.
        const [width, height] = await invoke<[number, number]>('get_screen_size');
        if (typeof width === 'number' && typeof height === 'number') {
          setScreenSize({ width, height });
          addLog(`System initialized: ${width}×${height} display detected.`);
        } else {
          addLog('Error: get_screen_size returned unexpected shape.');
        }
      } catch (e) {
        addLog(`Error: Failed to get screen size. ${e}`);
      }
    };
    loadInitData();

    const interval = setInterval(async () => {
      try {
        const [x, y] = await invoke<[number, number]>('get_mouse_position');
        if (typeof x === 'number' && typeof y === 'number') {
          setMousePos({ x, y });
        }
      } catch {
        // Mouse position unavailable — silent between polls.
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const handleCapture = async () => {
    setIsCapturing(true);
    addLog('Capturing screen...');
    try {
      const result = await invoke<string>('capture_screen', {
        format: 'jpeg',
        quality: 80,
      });
      // Rust already returns a data: URL; avoid double-prefixing.
      setScreenshot(result.startsWith('data:') ? result : `data:image/jpeg;base64,${result}`);
      addLog('Screen captured successfully.');
    } catch (e) {
      addLog(`Capture failed: ${e}`);
    } finally {
      setIsCapturing(false);
    }
  };

  const executeAction = async (
    action: 'click' | 'scroll' | 'type' | 'hotkey' | 'wait',
    params: Record<string, unknown>
  ) => {
    addLog(`Executing ${action}...`);
    try {
      switch (action) {
        case 'click':
          await invoke('execute_click', {
            x: params.x ?? 0,
            y: params.y ?? 0,
            button: params.button ?? 'left',
          });
          break;
        case 'scroll':
          await invoke('execute_scroll', {
            amount: params.amount ?? 0,
            x: params.x ?? 0,
            y: params.y ?? 0,
          });
          break;
        case 'type':
          await invoke('execute_type', {
            text: params.text ?? '',
            delay: params.delay ?? 0,
          });
          break;
        case 'hotkey':
          await invoke('execute_hotkey', {
            keys: params.keys ?? [],
            interval: params.interval ?? 0.1,
          });
          break;
        case 'wait':
          await invoke('wait_duration', { seconds: params.seconds ?? 1 });
          break;
      }
      addLog(`${action} completed.`);
    } catch (e) {
      addLog(`${action} failed: ${e}`);
    }
  };

  const runSelfCheck = async () => {
    addLog('Self-Check: probing screen + mouse...');
    await handleCapture();
    try {
      const [x, y] = await invoke<[number, number]>('get_mouse_position');
      addLog(`Self-Check: mouse at ${x}, ${y}`);
    } catch (e) {
      addLog(`Self-Check: mouse probe failed — ${e}`);
    }
  };

  const runBrowserLaunch = async () => {
    await executeAction('hotkey', { keys: ['cmd', 'space'], interval: 0.1 });
    await executeAction('wait', { seconds: 0.5 });
    await executeAction('type', { text: 'Safari', delay: 30 });
    await executeAction('wait', { seconds: 0.3 });
    await executeAction('hotkey', { keys: ['return'], interval: 0.1 });
  };

  return (
    <PageShell
      title="OAGI Hub"
      subtitle="Visual computer use — screen capture, mouse/keyboard automation via native Tauri layer"
      actions={
        <>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void openExternal('https://thenewfuse.com/oagi')}
          >
            Web docs
          </button>
          <span className="env-badge local">
            Screen: {screenSize ? `${screenSize.width}×${screenSize.height}` : '—'}
          </span>
          <span className="env-badge cloud">
            Mouse: {mousePos ? `${mousePos.x}, ${mousePos.y}` : '—'}
          </span>
        </>
      }
    >
      <SynergyStatusBar />
      <div className="oagi-container">
        <div className="oagi-grid">
          {/* Visual Preview */}
          <div className="preview-pane">
            <div className="pane-header">
              <h3>Visual Preview</h3>
              <button
                className={`capture-btn ${isCapturing ? 'loading' : ''}`}
                onClick={handleCapture}
                disabled={isCapturing}
              >
                {isCapturing ? '🔄' : '📸'} Capture Now
              </button>
            </div>
            <div className="screenshot-container">
              {screenshot ? (
                <img src={screenshot} alt="Screen Capture" className="screenshot-img" />
              ) : (
                <div className="no-screenshot">
                  <div className="empty-icon">📺</div>
                  <p>No capture data available.</p>
                  <button className="primary-button" onClick={handleCapture}>
                    Initialize Visual Context
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Controls */}
          <div className="controls-pane">
            <div className="pane-header">
              <h3>Action Center</h3>
            </div>
            <div className="action-groups">
              <div className="action-group">
                <h4>Mouse Actions</h4>
                <div className="action-buttons">
                  <button onClick={() => executeAction('click', { x: 500, y: 300 })}>
                    Move & Left Click
                  </button>
                  <button
                    onClick={() => void executeAction('scroll', { amount: -500, x: 0, y: 0 })}
                  >
                    Scroll Up
                  </button>
                  <button onClick={() => void executeAction('scroll', { amount: 500, x: 0, y: 0 })}>
                    Scroll Down
                  </button>
                </div>
              </div>

              <div className="action-group">
                <h4>Keyboard Actions</h4>
                <div className="action-buttons">
                  <button
                    onClick={() => executeAction('type', { text: 'The New Fuse', delay: 50 })}
                  >
                    Type Test Text
                  </button>
                  <button onClick={() => executeAction('hotkey', { keys: ['cmd', 'space'] })}>
                    Spotlight / Search
                  </button>
                  <button onClick={() => executeAction('hotkey', { keys: ['cmd', 'tab'] })}>
                    Switch App
                  </button>
                </div>
              </div>

              <div className="action-group">
                <h4>Automation Scripts</h4>
                <div className="script-list">
                  <div className="script-item">
                    <div className="script-info">
                      <span className="script-name">Self-Check</span>
                      <span className="script-desc">Verify system responsiveness</span>
                    </div>
                    <button type="button" className="run-btn" onClick={() => void runSelfCheck()}>
                      Run
                    </button>
                  </div>
                  <div className="script-item">
                    <div className="script-info">
                      <span className="script-name">Browser Launch</span>
                      <span className="script-desc">Open default browser via keys</span>
                    </div>
                    <button
                      type="button"
                      className="run-btn"
                      onClick={() => void runBrowserLaunch()}
                    >
                      Run
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="logs-pane">
            <div className="pane-header">
              <h3>Activity Logs</h3>
              <button className="clear-btn" onClick={() => setLogs([])}>
                Clear
              </button>
            </div>
            <div className="logs-list">
              {logs.length === 0 ? (
                <div className="empty-logs">Initializing OAGI audit trail...</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="log-entry">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <style>{`
        .oagi-container {
          padding: 24px;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: #020617; /* Deep Slate */
          background-image:
            radial-gradient(circle at 10% 10%, rgba(59, 130, 246, 0.05) 0%, transparent 40%),
            radial-gradient(circle at 90% 90%, rgba(139, 92, 246, 0.05) 0%, transparent 40%);
          color: white;
          overflow: hidden;
        }

        .oagi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
        }

        .page-title {
          font-family: 'Outfit', sans-serif;
          font-size: 32px;
          font-weight: 800;
          margin: 0;
          background: linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 10px rgba(96, 165, 250, 0.3));
        }

        .page-subtitle {
          color: #94a3b8;
          margin: 4px 0 0;
          font-size: 14px;
          font-weight: 500;
        }

        .system-status {
          display: flex;
          gap: 24px;
        }

        .status-item {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          padding: 8px 16px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .status-item .label {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 2px;
        }

        .status-item .value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          color: #60a5fa;
          font-weight: 600;
        }

        .oagi-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          grid-template-rows: 1fr 300px;
          gap: 20px;
          flex: 1;
          min-height: 0;
        }

        .preview-pane {
          grid-row: 1 / 3;
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        }

        .controls-pane, .logs-pane {
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        }

        .pane-header {
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .pane-header h3 {
          font-size: 16px;
          font-weight: 700;
          margin: 0;
          color: #f1f5f9;
        }

        .screenshot-container {
          flex: 1;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .screenshot-img {
          max-width: 95%;
          max-height: 95%;
          border-radius: 8px;
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(255, 255, 255, 0.1);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .screenshot-img:hover {
          transform: scale(1.02);
        }

        .no-screenshot {
          text-align: center;
          color: #64748b;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 20px;
          filter: grayscale(1) opacity(0.3);
        }

        .primary-button {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .primary-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }

        .capture-btn {
          background: rgba(59, 130, 246, 0.1);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.3);
          padding: 8px 16px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .capture-btn:hover:not(:disabled) {
          background: rgba(59, 130, 246, 0.2);
          border-color: #60a5fa;
          color: white;
        }

        .action-groups {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          overflow-y: auto;
        }

        .action-group h4 {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          margin: 0 0 16px;
          letter-spacing: 0.1em;
          font-weight: 700;
        }

        .action-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .action-buttons button {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #e2e8f0;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-buttons button:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: #60a5fa;
          color: white;
          transform: translateY(-1px);
        }

        .script-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .script-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.2s;
        }

        .script-item:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .script-name {
          font-size: 14px;
          font-weight: 600;
          color: #f1f5f9;
        }

        .script-desc {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .run-btn {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #34d399;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .run-btn:hover {
          background: #10b981;
          color: white;
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
        }

        .logs-list {
          flex: 1;
          padding: 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          overflow-y: auto;
          background: #020617;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .log-entry {
          margin-bottom: 6px;
          line-height: 1.5;
          color: #94a3b8;
          padding-left: 12px;
          border-left: 2px solid rgba(59, 130, 246, 0.2);
        }

        .log-entry:first-child {
          color: #60a5fa;
          border-left-color: #60a5fa;
          background: rgba(59, 130, 246, 0.05);
          padding-top: 4px;
          padding-bottom: 4px;
        }

        .empty-logs {
          color: #475569;
          font-style: italic;
          text-align: center;
          margin-top: 40px;
        }

        .clear-btn {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s;
        }

        .clear-btn:hover {
          color: #f1f5f9;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .loading-spin {
          animation: spin 1s linear infinite;
          display: inline-block;
        }
      `}</style>
      </div>
    </PageShell>
  );
};

export default OAGIHub;
