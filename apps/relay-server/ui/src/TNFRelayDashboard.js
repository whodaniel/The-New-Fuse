import { useEffect, useState } from 'react';

const TNFRelayDashboard = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [interceptedMessages, setInterceptedMessages] = useState([]);
  const [agents, setAgents] = useState([]);
  const [interceptRules, setInterceptRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [newRule, setNewRule] = useState({ hostname: '', description: '', enabled: true });
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const RELAY_BASE_URL = 'http://localhost:3000';

  // Icons using Unicode
  const Icon = ({ name, className = 'h-5 w-5' }) => {
    const icons = {
      activity: '📊',
      monitor: '🖥️',
      shield: '🛡️',
      globe: '🌐',
      terminal: '💻',
      settings: '⚙️',
      refresh: '🔄',
      message: '💬',
      plus: '➕',
      trash: '🗑️',
      eye: '👁️',
      eyeOff: '🙈',
      square: '⏹️',
      zap: '⚡',
      link: '🔗',
    };
    return <span className={`inline-block ${className}`}>{icons[name] || '❓'}</span>;
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${RELAY_BASE_URL}/api/dashboard`);
      const data = await response.json();
      setSystemStatus(data.systemStatus);
      setInterceptedMessages(data.recentMessages || []);
      setInterceptRules(data.interceptRules || []);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setConnectionStatus('error');
    }
  };

  const setupClaudeCodeEnvironment = async () => {
    try {
      const response = await fetch(`${RELAY_BASE_URL}/setup/claude-code-env`, { method: 'POST' });
      const data = await response.json();
      alert(
        data.success
          ? 'Claude Code environment configured! Restart your terminal and use "claude" commands.'
          : `Error: ${data.error}`
      );
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const setupVSCodeProxy = async () => {
    const config = {
      'http.proxy': 'http://localhost:8888',
      'http.proxyStrictSSL': false,
      'http.proxySupport': 'on',
    };

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      alert(
        'VS Code proxy configuration copied to clipboard!\\nAdd these settings to your VS Code settings.json'
      );
    } else {
      alert(
        `Add these settings to your VS Code settings.json:\\n\\n${JSON.stringify(config, null, 2)}`
      );
    }
  };

  const configureSystemProxy = (enable) => {
    const command = enable
      ? 'networksetup -setwebproxy "Wi-Fi" localhost 8888 && networksetup -setsecurewebproxy "Wi-Fi" localhost 8888'
      : 'networksetup -setwebproxystate "Wi-Fi" off && networksetup -setsecurewebproxystate "Wi-Fi" off';
    alert(`To ${enable ? 'enable' : 'disable'} system proxy, run:\\n\\n${command}`);
  };

  const addInterceptRule = async () => {
    if (!newRule.hostname) return;
    try {
      const response = await fetch(`${RELAY_BASE_URL}/intercept-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRule,
          action: 'intercept_and_route',
          target: 'claude_desktop',
        }),
      });
      if (response.ok) {
        setNewRule({ hostname: '', description: '', enabled: true });
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error adding intercept rule:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchDashboardData();
      setIsLoading(false);
    };
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Icon name="refresh" className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading TNF Relay Dashboard...</p>
        </div>
      </div>
    );
  }

  const StatusBadge = ({ status }) => (
    <div
      className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-green-500' : status === 'error' ? 'bg-yellow-500' : 'bg-red-500'}`}
    ></div>
  );

  const DashboardTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'System Status',
            value: systemStatus?.isRunning ? 'Running' : 'Stopped',
            icon: 'activity',
            color: 'green',
          },
          {
            label: 'Connected Agents',
            value: systemStatus?.stats?.agents || 0,
            icon: 'monitor',
            color: 'blue',
          },
          {
            label: 'Intercepted Messages',
            value: systemStatus?.stats?.interceptedMessages || 0,
            icon: 'shield',
            color: 'purple',
          },
          {
            label: 'WebSocket Status',
            value: (
              <div className="flex items-center gap-2">
                <StatusBadge status={connectionStatus} />
                <span className="text-sm capitalize">{connectionStatus}</span>
              </div>
            ),
            icon: 'globe',
            color: 'indigo',
          },
        ].map((item, index) => (
          <div key={index} className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{item.label}</p>
                <div className={`text-2xl font-bold text-${item.color}-400`}>{item.value}</div>
              </div>
              <Icon name={item.icon} className={`h-8 w-8 text-${item.color}-400`} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="zap" className="h-5 w-5" />
          Quick Setup
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={setupClaudeCodeEnvironment}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Icon name="terminal" className="h-4 w-4" />
            Setup Claude Code
          </button>
          <button
            onClick={setupVSCodeProxy}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Icon name="settings" className="h-4 w-4" />
            VS Code Proxy Config
          </button>
          <button
            onClick={() => configureSystemProxy(true)}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Icon name="globe" className="h-4 w-4" />
            Enable System Proxy
          </button>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="message" className="h-5 w-5" />
          Recent Intercepted Messages
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {interceptedMessages.map((message, index) => (
            <div key={index} className="bg-gray-700 p-3 rounded border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-mono text-sm text-green-400">
                    {message.method} {message.url}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(message.timestamp).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs bg-blue-600 px-2 py-1 rounded">{message.source}</span>
              </div>
            </div>
          ))}
          {interceptedMessages.length === 0 && (
            <div className="text-gray-400 text-center py-4">
              <p>No intercepted messages yet</p>
              <p className="text-xs mt-2">
                Start using Claude Code or configure applications to see intercepted API calls here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const AgentsTab = () => (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Icon name="monitor" className="h-5 w-5" />
        Connected Agents
      </h3>
      <div className="space-y-2">
        {agents.map((agent, index) => (
          <div key={index} className="bg-gray-700 p-4 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-semibold">{agent.name}</p>
              <p className="text-sm text-gray-400">ID: {agent.id}</p>
              <p className="text-sm text-gray-400">Type: {agent.type}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={agent.status === 'running' ? 'connected' : 'disconnected'} />
              <span className="text-sm">{agent.status}</span>
            </div>
          </div>
        ))}
        {agents.length === 0 && (
          <p className="text-gray-400 text-center py-4">No agents connected</p>
        )}
      </div>
    </div>
  );

  const InterceptTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="plus" className="h-5 w-5" />
          Add Intercept Rule
        </h3>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Hostname (e.g., api.example.com)"
            value={newRule.hostname}
            onChange={(e) => setNewRule({ ...newRule, hostname: e.target.value })}
            className="flex-1 bg-gray-700 px-3 py-2 rounded border border-gray-600 focus:border-blue-500 outline-none text-white"
          />
          <input
            type="text"
            placeholder="Description"
            value={newRule.description}
            onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
            className="flex-1 bg-gray-700 px-3 py-2 rounded border border-gray-600 focus:border-blue-500 outline-none text-white"
          />
          <button
            onClick={addInterceptRule}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center gap-2"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add Rule
          </button>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="shield" className="h-5 w-5" />
          Intercept Rules
        </h3>
        <div className="space-y-2">
          {interceptRules.map(([hostname, config], index) => (
            <div
              key={index}
              className="bg-gray-700 p-4 rounded-lg flex items-center justify-between"
            >
              <div>
                <p className="font-semibold">{hostname}</p>
                <p className="text-sm text-gray-400">{config.description}</p>
                <p className="text-xs text-gray-500">
                  Action: {config.action} → {config.target}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Icon
                    name={config.enabled ? 'eye' : 'eyeOff'}
                    className={`h-4 w-4 ${config.enabled ? 'text-green-400' : 'text-gray-400'}`}
                  />
                  <span className="text-sm">{config.enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>
          ))}
          {interceptRules.length === 0 && (
            <p className="text-gray-400 text-center py-4">No intercept rules configured</p>
          )}
        </div>
      </div>
    </div>
  );

  const MessagesTab = () => (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Icon name="message" className="h-5 w-5" />
          All Intercepted Messages
        </h3>
        <button
          onClick={fetchDashboardData}
          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm flex items-center gap-2"
        >
          <Icon name="refresh" className="h-4 w-4" />
          Refresh
        </button>
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {interceptedMessages.map((message, index) => (
          <div key={index} className="bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-mono text-sm text-green-400">
                  {message.method} {message.url}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(message.timestamp).toLocaleString()}
                </p>
              </div>
              <span className="text-xs bg-blue-600 px-2 py-1 rounded">{message.source}</span>
            </div>
            {message.body && (
              <details className="mt-2">
                <summary className="text-sm text-blue-400 cursor-pointer hover:text-blue-300">
                  View Request Body
                </summary>
                <pre className="mt-2 text-xs bg-gray-800 p-2 rounded overflow-x-auto">
                  {JSON.stringify(JSON.parse(message.body || '{}'), null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
        {interceptedMessages.length === 0 && (
          <p className="text-gray-400 text-center py-8">No intercepted messages yet</p>
        )}
      </div>
    </div>
  );

  const SettingsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="settings" className="h-5 w-5" />
          System Control
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded flex items-center gap-2"
          >
            <Icon name="refresh" className="h-4 w-4" />
            Restart Dashboard
          </button>
          <button
            onClick={() => alert('To stop: Press Ctrl+C in terminal')}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded flex items-center gap-2"
          >
            <Icon name="square" className="h-4 w-4" />
            Stop System
          </button>
          <button
            onClick={() => window.open(`${RELAY_BASE_URL}/status`, '_blank')}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center gap-2"
          >
            <Icon name="link" className="h-4 w-4" />
            API Status
          </button>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="terminal" className="h-5 w-5" />
          Environment Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={setupClaudeCodeEnvironment}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center gap-2"
          >
            <Icon name="terminal" className="h-4 w-4" />
            Setup Claude Code Environment
          </button>
          <button
            onClick={setupVSCodeProxy}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center gap-2"
          >
            <Icon name="settings" className="h-4 w-4" />
            Generate VS Code Proxy Config
          </button>
          <button
            onClick={() => configureSystemProxy(true)}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded flex items-center gap-2"
          >
            <Icon name="globe" className="h-4 w-4" />
            Enable System Proxy
          </button>
          <button
            onClick={() => configureSystemProxy(false)}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded flex items-center gap-2"
          >
            <Icon name="globe" className="h-4 w-4" />
            Disable System Proxy
          </button>
        </div>
      </div>

      {systemStatus && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon name="activity" className="h-5 w-5" />
            System Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[
              ['Relay ID', systemStatus.relayId],
              ['Version', systemStatus.version],
              ['HTTP Port', systemStatus.ports?.http],
              ['WebSocket Port', systemStatus.ports?.websocket],
              ['Proxy Port', systemStatus.ports?.proxy],
              ['UI Port', systemStatus.ports?.ui],
            ].map(([label, value], index) => (
              <div key={index}>
                <p className="text-gray-400">{label}:</p>
                <p className={label === 'Relay ID' ? 'font-mono' : ''}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Icon name="shield" className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">TNF Relay Dashboard</h1>
                <p className="text-sm text-gray-400">
                  Comprehensive AI API Interception & Management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <StatusBadge status={connectionStatus} />
                <span className="text-sm capitalize">{connectionStatus}</span>
              </div>
              <button
                onClick={fetchDashboardData}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded flex items-center gap-2"
              >
                <Icon name="refresh" className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: 'activity' },
              { id: 'agents', label: 'Agents', icon: 'monitor' },
              { id: 'intercept', label: 'Intercept Rules', icon: 'shield' },
              { id: 'messages', label: 'Messages', icon: 'message' },
              { id: 'settings', label: 'Settings', icon: 'settings' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon name={tab.icon} className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedTab === 'dashboard' && <DashboardTab />}
        {selectedTab === 'agents' && <AgentsTab />}
        {selectedTab === 'intercept' && <InterceptTab />}
        {selectedTab === 'messages' && <MessagesTab />}
        {selectedTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
};

export default TNFRelayDashboard;
