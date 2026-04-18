/**
 * Fuse Connect - Main Popup Component
 * 4-Tab Interface with Neon Cyberpunk Theme
 */

import React, { useState, useEffect } from 'react';
import ConnectTab from './tabs/ConnectTab.js';
import AgentsTab from './tabs/AgentsTab.js';
import NetworkTab from './tabs/NetworkTab.js';
import SettingsTab from './tabs/SettingsTab.js';
import './popup.css';

type TabType = 'connect' | 'agents' | 'network' | 'settings';

interface ConnectionStatus {
  websocketConnected: boolean;
  redisConnected: boolean;
  agentRegistered: boolean;
  agentId: string;
  currentPlatform: string | null;
}

export default function Popup() {
  const [activeTab, setActiveTab] = useState<TabType>('connect');
  const [status, setStatus] = useState<ConnectionStatus>({
    websocketConnected: false,
    redisConnected: false,
    agentRegistered: false,
    agentId: '',
    currentPlatform: null,
  });

  useEffect(() => {
    // Request status from background
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
      if (response?.success && response.status) {
        setStatus(response.status);
      }
    });

    // Listen for status updates
    const messageListener = (message: any) => {
      if (message.type === 'STATUS_UPDATE') {
        setStatus((prev) => ({ ...prev, ...message.status }));
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, []);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'connect', label: 'Connect', icon: '⚡' },
    { id: 'agents', label: 'Agents', icon: '🤖' },
    { id: 'network', label: 'Network', icon: '��' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="fuse-popup">
      {/* Header */}
      <div className="popup-header">
        <div className="header-left">
          <div className="logo-container">
            <div className="logo-icon">TNF</div>
          </div>
          <h1 className="header-title gradient-text">Fuse Connect</h1>
        </div>
        <div className="header-right">
          <div className={`status-dot ${status.websocketConnected ? 'online' : 'offline'}`} />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'connect' && <ConnectTab status={status} />}
        {activeTab === 'agents' && <AgentsTab status={status} />}
        {activeTab === 'network' && <NetworkTab status={status} />}
        {activeTab === 'settings' && <SettingsTab status={status} />}
      </div>
    </div>
  );
}
