import React, { useEffect, useState } from 'react';
import { NetworkGraph } from '../components/NetworkGraph';
import { QuickActionsDashboard } from '../components/QuickActionsDashboard';
import { Terminal } from '../components/Terminal';
import { apiService } from '../services/api';

/**
 * Dashboard Page - System Console Edition
 * Focused on "Under the Hood" visibility for the AI Engineer
 */
const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'controls'>('monitor');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const healthy = await apiService.healthCheck();
      setIsConnected(healthy);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleEmergencyStop = () => {
    // In a real implementation, this would call a tauri command to kill all processes
    const confirm = window.confirm(
      '⚠️ EMERGENCY STOP: This will kill all agents and close connections. Are you sure?'
    );
    if (confirm) {
      console.log('Emergency stop triggered');
      // apiService.stopAll() // To be implemented
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1 className="page-title">System Console</h1>
          <p className="page-subtitle">
            {isConnected ? '🟢 Connected via Local Relay' : '🔴 Local Relay Offline'}
          </p>
        </div>

        <div className="tab-switcher">
          <button
            className={`tab-btn ${activeTab === 'monitor' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitor')}
          >
            📡 Monitor
          </button>
          <button
            className={`tab-btn ${activeTab === 'controls' ? 'active' : ''}`}
            onClick={() => setActiveTab('controls')}
          >
            ⚡ Controls
          </button>
        </div>

        <div className="header-actions">
          <button className="emergency-stop-btn" onClick={handleEmergencyStop} title="Kill Switch">
            🛑 STOP
          </button>
          <span className="env-badge local">LOCAL: 3000</span>
          <span className="env-badge cloud">CLOUD: Connected</span>
        </div>
      </header>

      {/* Tab Content */}
      <div className="console-content">
        {activeTab === 'monitor' ? (
          <div className="console-grid">
            {/* Top Row: Network Visualization */}
            <div className="console-card full-width">
              <div className="card-header">
                <h3>Resources & Topology</h3>
                <span className="live-indicator">● LIVE</span>
              </div>
              <NetworkGraph />
            </div>

            {/* Bottom Left: System Health */}
            <div className="console-card">
              <div className="card-header">
                <h3>Active Processes</h3>
              </div>
              <div className="process-list">
                <div className="process-item">
                  <span className="status-dot green"></span>
                  <span>Tauri Bridge Relay</span>
                  <span className="pid">PID: 8421</span>
                </div>
                <div className="process-item">
                  <span className="status-dot green"></span>
                  <span>Redis Server</span>
                  <span className="pid">PID: 6379</span>
                </div>
                <div className="process-item">
                  <span className={`status-dot ${isConnected ? 'green' : 'red'}`}></span>
                  <span>Cloud WebSocket</span>
                  <span className="pid">{isConnected ? 'ESTABLISHED' : 'CLOSED'}</span>
                </div>
              </div>
            </div>

            {/* Bottom Right: Live Logs */}
            <div className="console-card terminal-card">
              <div className="card-header">
                <h3>Bridge Logs</h3>
              </div>
              <Terminal className="console-terminal" showQuickActions={false} />
            </div>
          </div>
        ) : (
          <div className="controls-container">
            <QuickActionsDashboard />
          </div>
        )}
      </div>

      <style>{`
        .dashboard-container {
          padding: 24px;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #0f172a;
          color: #e2e8f0;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-shrink: 0;
        }

        .page-title {
          font-family: 'Outfit', sans-serif;
          font-size: 24px;
          color: #f8fafc;
          margin: 0;
        }

        .page-subtitle {
          color: #94a3b8;
          font-size: 14px;
          margin: 4px 0 0;
        }

        .tab-switcher {
            background: #1e293b;
            padding: 4px;
            border-radius: 8px;
            display: flex;
            gap: 4px;
        }

        .tab-btn {
            background: transparent;
            border: none;
            color: #94a3b8;
            padding: 8px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
        }

        .tab-btn.active {
            background: #3b82f6;
            color: white;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .header-actions {
            display: flex;
            align-items: center;
        }

        .emergency-stop-btn {
            background: #ef4444;
            color: white;
            border: none;
            padding: 6px 16px;
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
            margin-right: 16px;
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
            transition: all 0.2s;
        }

        .emergency-stop-btn:hover {
            transform: scale(1.05);
            background: #dc2626;
        }

        .env-badge {
          padding: 4px 12px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          margin-left: 8px;
        }
        .env-badge.local { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .env-badge.cloud { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }

        .console-content {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
        }

        .controls-container {
            flex: 1;
            background: #1e293b;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #334155;
        }

        .console-grid {
          display: grid;
          grid-template-columns: 1fr 2fr;
          grid-template-rows: auto 1fr;
          gap: 16px;
          flex: 1;
          min-height: 0;
        }

        .console-card {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
      }

      .console-card.full-width {
          grid-column: 1 / -1;
          height: 350px;
      }

      .terminal-card {
        background: #1a1b26;
      }

      .card-header {
        padding: 12px 16px;
        border-bottom: 1px solid #334155;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .card-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .live-indicator {
        color: #10b981;
        font-size: 12px;
        font-weight: bold;
        animation: pulse 2s infinite;
      }

      .process-list {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .process-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px;
        background: rgba(255,255,255,0.05);
        border-radius: 6px;
        font-family: monospace;
        font-size: 13px;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      .status-dot.green { background: #10b981; box-shadow: 0 0 8px #10b981; }
      .status-dot.red { background: #ef4444; }

      .pid {
        margin-left: auto;
        color: #64748b;
      }

      .console-terminal {
        flex: 1;
        min-height: 0;
      }

      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      `}</style>
    </div>
  );
};

export default Dashboard;
