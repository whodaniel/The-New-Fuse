import { invoke } from '@tauri-apps/api/core';
import React, { useEffect, useState } from 'react';

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
        const size = await invoke<{ width: number; height: number }>('get_screen_size');
        setScreenSize(size);
        addLog(`System initialized: ${size.width}x${size.height} display detected.`);
      } catch (e) {
        addLog(`Error: Failed to get screen size. ${e}`);
      }
    };
    loadInitData();

    const interval = setInterval(async () => {
      try {
        const pos = await invoke<{ x: number; y: number }>('get_mouse_position');
        setMousePos(pos);
      } catch (e) {
        // Silent error for mouse pos
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
        fullScreen: true,
        quality: 80,
      });
      setScreenshot(`data:image/jpeg;base64,${result}`);
      addLog('Screen captured successfully.');
    } catch (e) {
      addLog(`Capture failed: ${e}`);
    } finally {
      setIsCapturing(false);
    }
  };

  const executeAction = async (action: string, params: any) => {
    addLog(`Executing ${action}...`);
    try {
      await invoke(`execute_${action}`, params);
      addLog(`${action} completed.`);
    } catch (e) {
      addLog(`${action} failed: ${e}`);
    }
  };

  return (
    <div className="oagi-container">
      <header className="oagi-header">
        <div className="header-info">
          <h1 className="page-title">OAGI Hub</h1>
          <p className="page-subtitle">Visual Computer Use & Automation</p>
        </div>
        <div className="system-status">
          <div className="status-item">
            <span className="label">Screen:</span>
            <span className="value">
              {screenSize ? `${screenSize.width}×${screenSize.height}` : '---'}
            </span>
          </div>
          <div className="status-item">
            <span className="label">Mouse:</span>
            <span className="value">{mousePos ? `${mousePos.x}, ${mousePos.y}` : '---'}</span>
          </div>
        </div>
      </header>

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
                <button onClick={() => executeAction('scroll', { deltaX: 0, deltaY: -500 })}>
                  Scroll Up
                </button>
                <button onClick={() => executeAction('scroll', { deltaX: 0, deltaY: 500 })}>
                  Scroll Down
                </button>
              </div>
            </div>

            <div className="action-group">
              <h4>Keyboard Actions</h4>
              <div className="action-buttons">
                <button onClick={() => executeAction('type', { text: 'The New Fuse', delay: 50 })}>
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
                  <button className="run-btn">Run</button>
                </div>
                <div className="script-item">
                  <div className="script-info">
                    <span className="script-name">Browser Launch</span>
                    <span className="script-desc">Open default browser via keys</span>
                  </div>
                  <button className="run-btn">Run</button>
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
  );
};

export default OAGIHub;
