import React, { useState } from 'react';
import { useMcpClients, useMcpServers } from '../../hooks/useMcp';

const TabButton = ({ children, onClick, isActive }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium ${
      isActive ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    {children}
  </button>
);

export const McpMonitor: React.FC = () => {
  const {
    servers,
    serverStatus,
    startServer,
    stopServer,
    registerTool,
    registerResource,
    registerPrompt,
  } = useMcpServers();

  const { clients, clientStatus, connectClient, disconnectClient, discoverCapabilities, callTool } =
    useMcpClients();

  const [activeTab, setActiveTab] = useState('servers');

  const [newServerConfig, setNewServerConfig] = useState({
    id: '',
    name: '',
    description: '',
    version: '1.0.0',
    transport: 'sse',
    port: 3000,
    authRequired: false,
    authKey: '',
  });

  const [newClientConfig, setNewClientConfig] = useState({
    id: '',
    serverUrl: '',
    transport: 'sse',
    timeout: 30000,
    authKey: '',
  });

  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [toolParams, setToolParams] = useState<string>('{}');

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">MCP Monitor</h1>
      <p className="mb-4">Manage Model Context Protocol servers and clients</p>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <TabButton onClick={() => setActiveTab('servers')} isActive={activeTab === 'servers'}>
            Servers
          </TabButton>
          <TabButton onClick={() => setActiveTab('clients')} isActive={activeTab === 'clients'}>
            Clients
          </TabButton>
          <TabButton
            onClick={() => setActiveTab('test-tools')}
            isActive={activeTab === 'test-tools'}
          >
            Test Tools
          </TabButton>
          <TabButton onClick={() => setActiveTab('logs')} isActive={activeTab === 'logs'}>
            Logs
          </TabButton>
        </nav>
      </div>

      <div className="mt-4">
        {activeTab === 'servers' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">MCP Servers</h2>
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">ID</th>
                  <th className="py-2 px-4 border-b">Name</th>
                  <th className="py-2 px-4 border-b">Transport</th>
                  <th className="py-2 px-4 border-b">Status</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {servers.map((server) => (
                  <tr key={server.id}>
                    <td className="py-2 px-4 border-b">{server.id}</td>
                    <td className="py-2 px-4 border-b">{server.name}</td>
                    <td className="py-2 px-4 border-b">{server.transport}</td>
                    <td className="py-2 px-4 border-b">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${serverStatus[server.id] === 'running' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {serverStatus[server.id] || 'stopped'}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <div className="flex space-x-2">
                        {serverStatus[server.id] === 'running' ? (
                          <button
                            className="px-2 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700"
                            onClick={() => stopServer(server.id)}
                          >
                            Stop
                          </button>
                        ) : (
                          <button
                            className="px-2 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700"
                            onClick={() => startServer(server.id)}
                          >
                            Start
                          </button>
                        )}
                        <button
                          className="px-2 py-1 text-xs text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                          onClick={() => setSelectedServer(server.id)}
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selectedServer && (
              <div className="mt-4 p-4 border rounded-md">
                <h3 className="text-lg font-semibold mb-2">Server Details: {selectedServer}</h3>
                {/* TODO: Implement tabbed view for details */}
              </div>
            )}

            <hr className="my-4" />

            <h3 className="text-xl font-semibold mb-2">Add New Server</h3>
            {/* New server form */}
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">MCP Clients</h2>
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">ID</th>
                  <th className="py-2 px-4 border-b">Server URL</th>
                  <th className="py-2 px-4 border-b">Transport</th>
                  <th className="py-2 px-4 border-b">Status</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td className="py-2 px-4 border-b">{client.id}</td>
                    <td className="py-2 px-4 border-b">{client.serverUrl}</td>
                    <td className="py-2 px-4 border-b">{client.transport}</td>
                    <td className="py-2 px-4 border-b">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${clientStatus[client.id] === 'connected' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {clientStatus[client.id] || 'disconnected'}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <div className="flex space-x-2">
                        {clientStatus[client.id] === 'connected' ? (
                          <button
                            className="px-2 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700"
                            onClick={() => disconnectClient(client.id)}
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button
                            className="px-2 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700"
                            onClick={() => connectClient(client.id)}
                          >
                            Connect
                          </button>
                        )}
                        <button
                          className="px-2 py-1 text-xs text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                          onClick={() => setSelectedClient(client.id)}
                        >
                          Details
                        </button>
                        {clientStatus[client.id] === 'connected' && (
                          <button
                            className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                            onClick={() => discoverCapabilities(client.id)}
                          >
                            Discover
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selectedClient && (
              <div className="mt-4 p-4 border rounded-md">
                <h3 className="text-lg font-semibold mb-2">Client Details: {selectedClient}</h3>
                {/* Client details and capabilities */}
              </div>
            )}

            <hr className="my-4" />

            <h3 className="text-xl font-semibold mb-2">Add New Client</h3>
            {/* New client form */}
          </div>
        )}

        {activeTab === 'test-tools' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Test Tool Calls</h2>
            {/* Tool testing UI */}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">MCP Logs</h2>
            {/* Log viewer */}
          </div>
        )}
      </div>
    </div>
  );
};
