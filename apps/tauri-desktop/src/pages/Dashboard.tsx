import React, { useEffect, useState } from 'react';
import { NetworkGraph } from '../components/NetworkGraph';
import { QuickActionsDashboard } from '../components/QuickActionsDashboard';
import { Terminal } from '../components/Terminal';
import { apiService } from '../services/api';
import { useAgentStore } from '../stores/agentStore';
import type { DashboardStats } from '../types';

/**
 * Dashboard Page - Mission Control
 * The central command center for the entire TNF ecosystem.
 */
const Dashboard: React.FC = () => {
  const { agents } = useAgentStore();
  const [activeTab, setActiveTab] = useState<'monitor' | 'controls'>('monitor');
  const [stats, setStats] = useState<DashboardStats>({
    activeAgents: 0,
    totalWorkflows: 0,
    tasksToday: 0,
    successRate: 0,
    recentActivity: [],
  });
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
    const confirm = window.confirm(
      '⚠️ EMERGENCY PROTOCOL: This will immediately halt all agent processes. Confirm?'
    );
    if (confirm) {
      console.log('Emergency stop triggered');
      // apiService.stopAll() // To be implemented
    }
  };

  return (
    <div className="dashboard-container">
      {/* HUD Header */}
      <header className="hud-header">
        <div className="header-left">
          <div className="status-indicator">
            <span className={`indicator-light ${isConnected ? 'online' : 'offline'}`}></span>
            <span className="indicator-text">
              {isConnected ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
            </span>
          </div>
          <h1 className="mission-title">Mission Control</h1>
        </div>

        <div className="hud-controls">
          <div className="tab-switcher">
            <button
              className={`hud-tab ${activeTab === 'monitor' ? 'active' : ''}`}
              onClick={() => setActiveTab('monitor')}
            >
              <span className="icon">📡</span> MONITOR
            </button>
            <button
              className={`hud-tab ${activeTab === 'controls' ? 'active' : ''}`}
              onClick={() => setActiveTab('controls')}
            >
              <span className="icon">⚡</span> CONTROLS
            </button>
          </div>

          <div className="divider"></div>

          <button className="kill-switch" onClick={handleEmergencyStop} title="Emergency Stop">
            <span className="icon">🛑</span> ABORT
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <div className="viewport">
        {activeTab === 'monitor' ? (
          <div className="grid-layout">
            {/* Sector A: Network Topology */}
            <div className="sector network-sector">
              <div className="sector-header">
                <h3>Topology</h3>
                <span className="live-badge">LIVE FEED</span>
              </div>
              <div className="graph-container">
                <NetworkGraph />
              </div>
            </div>

            {/* Sector B: Telemetry */}
            <div className="sector telemetry-sector">
              <div className="sector-header">
                <h3>Telemetry</h3>
              </div>
              <div className="process-list">
                <div className="telemetry-row">
                  <span className="label">Tauri Bridge</span>
                  <span className="value status-ok">ACTIVE</span>
                  <span className="metric">PID: 8421</span>
                </div>
                <div className="telemetry-row">
                  <span className="label">Redis Bus</span>
                  <span className="value status-ok">ACTIVE</span>
                  <span className="metric">Port: 6379</span>
                </div>
                <div className="telemetry-row">
                  <span className="label">Swarm Uplink</span>
                  <span className={`value ${isConnected ? 'status-ok' : 'status-err'}`}>
                    {isConnected ? 'ESTABLISHED' : 'SEVERED'}
                  </span>
                  <span className="metric">12ms</span>
                </div>
                <div className="telemetry-row">
                  <span className="label">Active Agents</span>
                  <span className="value status-info">
                    {agents.filter((a) => a.status === 'active').length}
                  </span>
                  <span className="metric">/ {agents.length}</span>
                </div>
              </div>
            </div>

            {/* Sector C: Command Console */}
            <div className="sector console-sector">
              <div className="sector-header">
                <h3>Terminal Uplink</h3>
              </div>
              <div className="terminal-wrapper">
                <Terminal showQuickActions={false} className="dashboard-terminal" />
              </div>
            </div>
          </div>
        ) : (
          <div className="controls-layer">
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
          background: #0b0e14; /* Deep space black */
          color: #e2e8f0;
          font-family: 'JetBrains Mono', monospace; /* Tech feel */
        }

        /* HUD Header */
        .hud-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 20px;
            margin-bottom: 20px;
            border-bottom: 1px solid rgba(59, 130, 246, 0.2);
            position: relative;
        }

        .hud-header::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 0;
            width: 30%;
            height: 1px;
            background: #3b82f6;
            box-shadow: 0 0 10px #3b82f6;
        }

        .header-left {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .status-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 10px;
            letter-spacing: 1px;
            color: #64748b;
        }

        .indicator-light {
            width: 6px; height: 6px; border-radius: 50%;
        }
        .indicator-light.online { background: #10b981; box-shadow: 0 0 8px #10b981; }
        .indicator-light.offline { background: #ef4444; box-shadow: 0 0 8px #ef4444; }

        .mission-title {
            margin: 0;
            font-family: 'Outfit', sans-serif;
            font-size: 24px;
            text-transform: uppercase;
            letter-spacing: 2px;
            background: linear-gradient(90deg, #fff, #94a3b8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .hud-controls {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .tab-switcher {
            display: flex;
            background: rgba(30, 41, 59, 0.5);
            border: 1px solid rgba(71, 85, 105, 0.3);
            border-radius: 6px;
            padding: 2px;
        }

        .hud-tab {
            background: transparent;
            border: none;
            color: #94a3b8;
            padding: 8px 16px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            border-radius: 4px;
            display: flex; align-items: center; gap: 8px;
            transition: all 0.2s;
        }

        .hud-tab.active {
            background: rgba(59, 130, 246, 0.2);
            color: #60a5fa;
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.1);
        }

        .divider { width: 1px; height: 24px; background: rgba(255,255,255,0.1); }

        .kill-switch {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #ef4444;
            padding: 8px 16px;
            border-radius: 4px;
            font-family: 'JetBrains Mono', monospace;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            display: flex; align-items: center; gap: 8px;
        }

        .kill-switch:hover {
            background: rgba(239, 68, 68, 0.2);
            box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
        }

        /* Viewport */
        .viewport {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .grid-layout {
            display: grid;
            grid-template-columns: 2fr 1fr;
            grid-template-rows: 2fr 1.5fr;
            gap: 16px;
            height: 100%;
        }

        .sector {
            background: rgba(17, 24, 39, 0.6);
            border: 1px solid rgba(59, 130, 246, 0.15);
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
        }

        /* Corner accents for sectors */
        .sector::before {
            content: ''; position: absolute; top: 0; left: 0; width: 8px; height: 8px;
            border-top: 1px solid #3b82f6; border-left: 1px solid #3b82f6;
        }
        .sector::after {
            content: ''; position: absolute; bottom: 0; right: 0; width: 8px; height: 8px;
            border-bottom: 1px solid #3b82f6; border-right: 1px solid #3b82f6;
        }

        .sector-header {
            background: rgba(30, 41, 59, 0.3);
            padding: 8px 12px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            display: flex; justify-content: space-between; align-items: center;
        }

        .sector-header h3 {
            margin: 0; font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px;
        }

        .live-badge {
            font-size: 9px; color: #10b981; font-weight: 700; animation: pulse 2s infinite;
        }

        /* Network Sector */
        .network-sector {
            grid-column: 1 / 2;
            grid-row: 1 / 2;
        }
        .graph-container { flex: 1; position: relative; overflow: hidden; }

        /* Telemetry Sector */
        .telemetry-sector {
            grid-column: 2 / 3;
            grid-row: 1 / 2;
        }
        .process-list {
            padding: 16px;
            display: flex; flex-direction: column; gap: 8px;
        }
        .telemetry-row {
            display: flex; justify-content: space-between; align-items: center;
            padding: 8px;
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 4px;
        }
        .telemetry-row .label { color: #94a3b8; font-size: 11px; }
        .telemetry-row .value { font-weight: 600; font-size: 12px; }
        .status-ok { color: #10b981; }
        .status-err { color: #ef4444; }
        .status-info { color: #60a5fa; }
        .telemetry-row .metric { color: #64748b; font-size: 10px; font-family: monospace; }

        /* Console Sector */
        .console-sector {
            grid-column: 1 / -1;
            grid-row: 2 / 3;
        }
        .terminal-wrapper {
            flex: 1;
            background: #000;
        }

        .controls-layer {
            height: 100%;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid rgba(59, 130, 246, 0.2);
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
