import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'
import { Button, Input, Card, CardContent, Badge, Alert, Container, Select } from '@the-new-fuse/ui-consolidated'
import type { RootState } from '../../store/store'

export const ConnectionTab: React.FC = () => {
  const { tnfRelay, mcp, systemStatus } = useSelector((state: RootState) => state.connections)
  
  // Local state for configuration
  const [tnfConfig, setTnfConfig] = useState({
    url: 'ws://localhost:3001',
    port: 3001,
    autoReconnect: true,
    maxReconnectAttempts: 5
  })
  
  const [mcpConfig, setMcpConfig] = useState({
    host: 'localhost',
    port: 3000,
    protocol: 'ws' as 'http' | 'ws'
  })

  const handleTNFConnect = async () => {
    try {
      if (window.api) {
        const response = await window.api.tnfConnect(tnfConfig)
        if (response.success) {
          toast.success('Successfully connected to TNF Relay')
        } else {
          toast.error(response.error || 'Failed to connect to TNF Relay')
        }
      }
    } catch {
      toast.error('An error occurred while connecting')
    }
  }

  const handleTNFDisconnect = async () => {
    try {
      if (window.api) {
        const response = await window.api.tnfDisconnect()
        if (response.success) {
          toast.success('Successfully disconnected from TNF Relay')
        }
      }
    } catch {
      toast.error('An error occurred while disconnecting')
    }
  }

  const handleMCPConnect = async () => {
    try {
      if (window.api) {
        const response = await window.api.mcpConnect(mcpConfig)
        if (response.success) {
          toast.success('Successfully connected to MCP Server')
        } else {
          toast.error(response.error || 'Failed to connect to MCP Server')
        }
      }
    } catch {
      toast.error('An error occurred while connecting to MCP')
    }
  }

  const handleMCPDisconnect = async () => {
    try {
      if (window.api) {
        const response = await window.api.mcpDisconnect()
        if (response.success) {
          toast.success('Successfully disconnected from MCP Server')
        }
      }
    } catch {
      toast.error('An error occurred while disconnecting from MCP')
    }
  }

  const handleTestConnection = async (type: 'tnf' | 'mcp') => {
    try {
      if (window.api) {
        const response = type === 'tnf' 
          ? await window.api.testTNFConnection()
          : await window.api.testMCPConnection()
        
        if (response.success) {
          toast.success(`${type.toUpperCase()} connection test successful`)
        } else {
          toast.error(response.error || `${type.toUpperCase()} connection test failed`)
        }
      }
    } catch {
      toast.error(`An error occurred during ${type.toUpperCase()} connection test`)
    }
  }

  const getStatusColor = (connected: boolean) => connected ? 'green' : 'red'
  const getStatusText = (connected: boolean) => connected ? 'Connected' : 'Disconnected'

  return (
    <Container className="space-y-6">
      {/* System Status Alert */}
      {!systemStatus.initialized && (
        <Alert variant="warning" className="rounded-lg">
          <div>
            <div className="font-semibold">System Initializing</div>
            <div className="text-sm">
              The hybrid backend is still initializing. Some features may not be available yet.
            </div>
          </div>
        </Alert>
      )}

      {/* TNF Relay Connection */}
      <Card className="bg-white/10 border-white/20">
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">TNF Relay</h3>
            <Badge variant={tnfRelay.connected ? 'default' : 'outline'}>
              {getStatusText(tnfRelay.connected)}
            </Badge>
          </div>
          
          <p className="text-sm text-gray-400">
            Connect to the TNF Relay system for AI-powered browser automation
          </p>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">WebSocket URL</label>
              <Input
                value={tnfConfig.url}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTnfConfig(prev => ({ ...prev, url: e.target.value }))}
                placeholder="ws://localhost:3001"
                size="sm"
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Port</label>
              <Input
                type="number"
                value={tnfConfig.port}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTnfConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 3001 }))}
                min={1000}
                max={65535}
                size="sm"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auto-reconnect"
                checked={tnfConfig.autoReconnect}
                onChange={(e) => setTnfConfig(prev => ({ ...prev, autoReconnect: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="auto-reconnect" className="text-sm">Auto-reconnect</label>
            </div>

            <Button
              onClick={tnfRelay.connected ? handleTNFDisconnect : handleTNFConnect}
              variant={tnfRelay.connected ? 'destructive' : 'default'}
              size="sm"
            >
              {tnfRelay.connected ? 'Disconnect' : 'Connect'}
            </Button>
          </div>

          {tnfRelay.connected && tnfRelay.lastConnected && (
            <p className="text-xs text-gray-500">
              Last connected: {new Date(tnfRelay.lastConnected).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      <hr className="border-gray-600" />

      {/* MCP Connection */}
      <Card className="bg-white/10 border-white/20">
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Model Context Protocol (MCP)</h3>
            <Badge variant={mcp.connected ? 'default' : 'outline'}>
              {getStatusText(mcp.connected)}
            </Badge>
          </div>
          
          <p className="text-sm text-gray-400">
            Connect to MCP servers for enhanced AI capabilities and tool integration
          </p>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Host</label>
              <Input
                value={mcpConfig.host}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMcpConfig(prev => ({ ...prev, host: e.target.value }))}
                placeholder="localhost"
                size="sm"
              />
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Port</label>
              <Input
                type="number"
                value={mcpConfig.port}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMcpConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 3000 }))}
                min={1000}
                max={65535}
                size="sm"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400">
              Protocol: WebSocket
            </p>

            <Button
              onClick={mcp.connected ? handleMCPDisconnect : handleMCPConnect}
              variant={mcp.connected ? 'destructive' : 'default'}
              size="sm"
            >
              {mcp.connected ? 'Disconnect' : 'Connect'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <hr className="border-gray-600" />

      {/* Native Host Status */}
      <Card className="bg-white/10 border-white/20">
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Native Host</h3>
            <Badge variant={systemStatus.nativeHost ? 'default' : 'outline'}>
              {getStatusText(systemStatus.nativeHost)}
            </Badge>
          </div>
          
          <p className="text-sm text-gray-400">
            Python native host for system-level automation and file operations
          </p>

          {!systemStatus.nativeHost && (
            <Alert variant="default" className="rounded-md">
              <p className="text-sm">
                Native host provides system-level automation capabilities. 
                Ensure Python 3 is installed and the host script is available.
              </p>
            </Alert>
          )}
        </CardContent>
      </Card>
    </Container>
  )
}
