/**
 * Connect Tab - Connection Status and Quick Actions
 */

interface ConnectionStatus {
  websocketConnected: boolean;
  redisConnected: boolean;
  agentRegistered: boolean;
  agentId: string;
  currentPlatform: string | null;
}

interface Props {
  status: ConnectionStatus;
}

const platformNames: Record<string, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Google Gemini',
  perplexity: 'Perplexity AI',
  deepseek: 'DeepSeek',
};

const platformIcons: Record<string, string> = {
  chatgpt: '🤖',
  claude: '🧠',
  gemini: '✨',
  perplexity: '🔍',
  deepseek: '🌊',
};

export default function ConnectTab({ status }: Props) {
  const handleConnect = () => {
    chrome.runtime.sendMessage({ type: 'CONNECT' });
  };

  const handleDisconnect = () => {
    chrome.runtime.sendMessage({ type: 'DISCONNECT' });
  };

  const handleAutoDetect = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'AUTO_DETECT_ELEMENTS' });
    }
  };

  const handleStartSession = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'START_AI_SESSION' });
    }
  };

  const handleTogglePanel = () => {
    chrome.runtime.sendMessage({ type: 'TOGGLE_FLOATING_PANEL' });
  };

  return (
    <div className="connect-tab">
      {/* Connection Status */}
      <div className="section">
        <div className="section-header">
          <span className="section-icon">⚡</span>
          <h2 className="section-title">Connection Status</h2>
        </div>

        <div className="status-grid">
          <div className="status-item">
            <span
              className={`status-indicator ${status.websocketConnected ? 'status-online' : 'status-offline'}`}
            />
            <span className="status-label">TNF Relay</span>
            <span
              className={`status-value ${status.websocketConnected ? 'neon-text-green' : 'text-secondary'}`}
            >
              {status.websocketConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>

          <div className="status-item">
            <span
              className={`status-indicator ${status.redisConnected ? 'status-online' : 'status-offline'}`}
            />
            <span className="status-label">Redis Network</span>
            <span
              className={`status-value ${status.redisConnected ? 'neon-text-green' : 'text-secondary'}`}
            >
              {status.redisConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>

          <div className="status-item">
            <span
              className={`status-indicator ${status.currentPlatform ? 'status-online' : 'status-idle'}`}
            />
            <span className="status-label">AI Platform</span>
            <span
              className={`status-value ${status.currentPlatform ? 'neon-text-cyan' : 'text-secondary'}`}
            >
              {status.currentPlatform ? 'DETECTED' : 'NOT DETECTED'}
            </span>
          </div>
        </div>

        <div className="action-buttons">
          {!status.websocketConnected ? (
            <button className="btn btn-primary glow-cyan" onClick={handleConnect}>
              <span>🔌</span> Connect to Relay
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={handleDisconnect}>
              <span>🔌</span> Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Detected Platform */}
      {status.currentPlatform && (
        <div className="section">
          <div className="section-header">
            <span className="section-icon">🤖</span>
            <h2 className="section-title">Detected AI Platform</h2>
          </div>

          <div className="platform-card">
            <div className="platform-icon">{platformIcons[status.currentPlatform] || '🤖'}</div>
            <div className="platform-info">
              <div className="platform-name">
                {platformNames[status.currentPlatform] || status.currentPlatform}
              </div>
              <div className="platform-url text-secondary">{window.location.hostname}</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="section">
        <div className="section-header">
          <span className="section-icon">🎯</span>
          <h2 className="section-title">Quick Actions</h2>
        </div>

        <div className="action-grid">
          <button className="btn btn-action" onClick={handleAutoDetect}>
            <span className="btn-icon">🎯</span>
            <span className="btn-text">Auto-Detect Elements</span>
          </button>

          <button className="btn btn-action" onClick={handleStartSession}>
            <span className="btn-icon">▶️</span>
            <span className="btn-text">Start Session</span>
          </button>

          <button className="btn btn-action" onClick={handleTogglePanel}>
            <span className="btn-icon">🪟</span>
            <span className="btn-text">Toggle Floating Panel</span>
          </button>
        </div>
      </div>

      {/* Agent ID */}
      <div className="section">
        <div className="agent-id-container">
          <span className="agent-id-label">Agent ID:</span>
          <code className="agent-id-value">{status.agentId || 'Not assigned'}</code>
        </div>
      </div>
    </div>
  );
}
