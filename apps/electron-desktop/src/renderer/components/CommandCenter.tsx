import { Container } from '@the-new-fuse/ui-consolidated';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { ChatTab } from './tabs/ChatTab';
import { ConnectionTab } from './tabs/ConnectionTab';
import { ElementsTab } from './tabs/ElementsTab';
import { LocalServicesTab } from './tabs/LocalServicesTab';

export const CommandCenter: React.FC = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<'connections' | 'elements' | 'chat' | 'services'>(
    'connections'
  );

  const { tnfRelay, mcp, systemStatus } = useSelector((state: RootState) => state.connections);
  const { statuses: portStatuses } = useSelector((state: RootState) => state.ports);

  useEffect(() => {
    // Set up IPC event listeners for real-time updates
    if (window.api) {
      // Listen for system events
      window.api.onSystemEvent((event: string, data: any) => {
        switch (event) {
          case 'tnf-relay-connected':
            toast.success('TNF Relay Connected - Successfully connected to TNF Relay');
            break;
          case 'tnf-relay-disconnected':
            toast.error('TNF Relay Disconnected - Lost connection to TNF Relay');
            break;
          case 'element-detected':
            toast.success(
              `Element Detected - ${data.elementType} element detected with ${data.confidence}% confidence`
            );
            break;
          case 'port-statuses-updated':
            // Update port statuses in store
            break;
        }
      });
    }

    // Initial status fetch
    fetchSystemStatus();

    // Set up periodic status updates
    const statusInterval = setInterval(fetchSystemStatus, 30000); // Every 30 seconds

    return () => {
      clearInterval(statusInterval);
      if (window.api) {
        window.api.offSystemEvent(() => {});
      }
    };
  }, [dispatch]);

  const fetchSystemStatus = async () => {
    try {
      if (window.api) {
        const response = await window.api.systemStatus();
        if (response.success && response.data) {
          // Update store with system status
          // dispatch(updateSystemStatus(response.data))
        }
      }
    } catch {}
  };

  const getConnectionSummary = () => {
    const connections = [
      { name: 'TNF Relay', connected: tnfRelay.connected },
      { name: 'MCP', connected: mcp.connected },
      { name: 'Native Host', connected: systemStatus.nativeHost },
    ];

    const connectedCount = connections.filter((c) => c.connected).length;
    return { total: connections.length, connected: connectedCount, connections };
  };

  const getPortSummary = () => {
    const openPorts = portStatuses.filter((port) => port.isOpen).length;
    return { total: portStatuses.length, open: openPorts };
  };

  const connectionSummary = getConnectionSummary();
  const portSummary = getPortSummary();

  return (
    <Container className="max-w-full p-4 bg-transparent">
      <div className="space-y-6 flex flex-col items-stretch">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent">
            TNF Browser Hub
          </h1>
          <p className="text-gray-300 mt-2">Hybrid AI-Powered Browser Automation System</p>
        </div>

        {/* Status Overview */}
        <div className="flex justify-around p-4 bg-white/10 rounded-lg border border-white/20">
          <div className="flex flex-col items-center">
            <span
              className={`text-2xl font-bold ${connectionSummary.connected === connectionSummary.total ? 'text-green-400' : 'text-yellow-400'}`}
            >
              {connectionSummary.connected}/{connectionSummary.total}
            </span>
            <span className="text-sm text-gray-400">Connections</span>
          </div>

          <div className="flex flex-col items-center">
            <span
              className={`text-2xl font-bold ${portSummary.open > 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {portSummary.open}/{portSummary.total}
            </span>
            <span className="text-sm text-gray-400">Services</span>
          </div>

          <div className="flex flex-col items-center">
            <span
              className={`text-2xl font-bold ${systemStatus.initialized ? 'text-green-400' : 'text-gray-400'}`}
            >
              {systemStatus.initialized ? '✓' : '○'}
            </span>
            <span className="text-sm text-gray-400">System</span>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="w-full">
          <div className="flex justify-center gap-2 mb-4">
            <button
              className={`px-4 py-2 rounded-full transition-all ${activeTab === 'connections' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              onClick={() => setActiveTab('connections')}
            >
              Connections
            </button>
            <button
              className={`px-4 py-2 rounded-full transition-all ${activeTab === 'elements' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              onClick={() => setActiveTab('elements')}
            >
              Elements
            </button>
            <button
              className={`px-4 py-2 rounded-full transition-all ${activeTab === 'chat' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </button>
            <button
              className={`px-4 py-2 rounded-full transition-all ${activeTab === 'services' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              onClick={() => setActiveTab('services')}
            >
              Services
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'connections' && <ConnectionTab />}
            {activeTab === 'elements' && <ElementsTab />}
            {activeTab === 'chat' && <ChatTab />}
            {activeTab === 'services' && <LocalServicesTab />}
          </div>
        </div>
      </div>
    </Container>
  );
};
