import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import {
  Button,
  Input,
  Card,
  CardContent,
  Badge,
  Alert,
  Select,
  Container
} from '@the-new-fuse/ui-consolidated'
import { FiPlus, FiTrash2, FiRefreshCw, FiPlay, FiServer, FiActivity, FiExternalLink, FiMonitor } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import type { RootState } from '../../store/store'

export const LocalServicesTab: React.FC = () => {
  
  const { monitored, statuses } = useSelector((state: RootState) => state.ports)
  const { tnfRelay, systemStatus } = useSelector((state: RootState) => state.connections)
  
  const [newPort, setNewPort] = useState<number>(3000)
  const [selectedCommand, setSelectedCommand] = useState('restart_server')
  const [customCommand, setCustomCommand] = useState('')
  const [commandArgs, setCommandArgs] = useState('')

  // Default TNF Services - Updated for current architecture
  const defaultServices = [
    { 
      name: 'Theia IDE', 
      port: 3006, 
      url: 'http://localhost:3006',
      description: 'AI-powered IDE with MCP integration',
      type: 'development'
    },
    { 
      name: 'Backend API', 
      port: 3004, 
      url: 'http://localhost:3004/api/health',
      description: 'NestJS backend server (API endpoints)',
      type: 'api'
    },
    { 
      name: 'API Gateway', 
      port: 5002, 
      url: 'http://localhost:5002/v1',
      description: 'Gateway and proxy service',
      type: 'gateway'
    },
    { 
      name: 'Electron Desktop', 
      port: 5174, 
      url: 'http://localhost:5174',
      description: 'Electron renderer dev server',
      type: 'development'
    }
  ]

  const predefinedCommands = [
    { value: 'restart_server', label: 'Restart Server', description: 'Restart a local development server' },
    { value: 'kill_process', label: 'Kill Process', description: 'Terminate a process by port' },
    { value: 'check_system', label: 'System Check', description: 'Run system diagnostics' },
    { value: 'open_application', label: 'Open Application', description: 'Launch an application' },
    { value: 'file_operation', label: 'File Operation', description: 'Perform file system operations' },
    { value: 'custom', label: 'Custom Command', description: 'Execute a custom command' }
  ]

  // Auto-add default service ports to monitoring
  React.useEffect(() => {
    const addDefaultPorts = async () => {
      for (const service of defaultServices) {
        if (!monitored.includes(service.port)) {
          try {
            if (window.api) {
              await window.api.portsAdd(service.port)
            }
          } catch (error) {
            console.log(`Failed to add port ${service.port} to monitoring`)
          }
        }
      }
    }
    addDefaultPorts()
  }, [monitored])

  const handleOpenService = (url: string) => {
    if (window.api && window.api.openExternal) {
      window.api.openExternal(url)
    } else {
      // Fallback to creating a new tab in the same window
      window.open(url, '_blank')
    }
  }

  const getServiceStatus = (port: number) => {
    const status = statuses.find(s => s.port === port)
    return status?.isOpen || false
  }

  const getServiceByPort = (port: number) => {
    return defaultServices.find(service => service.port === port)
  }

  const handleAddPort = async () => {
    if (monitored.includes(newPort)) {
      toast.error(`Port ${newPort} is already being monitored`)
      return
    }

    try {
      if (window.api) {
        const response = await window.api.portsAdd(newPort)
        if (response.success) {
          toast.success(`Port ${newPort} is now being monitored`)
          setNewPort(3000)
        }
      }
    } catch {
      toast.error('An error occurred while adding the port')
    }
  }

  const handleRemovePort = async (port: number) => {
    try {
      if (window.api) {
        const response = await window.api.portsRemove(port)
        if (response.success) {
          toast.success(`Port ${port} is no longer being monitored`)
        }
      }
    } catch {
      toast.error('An error occurred while removing the port')
    }
  }

  const handleRefreshStatuses = async () => {
    try {
      if (window.api) {
        const response = await window.api.portsStatus()
        if (response.success) {
          toast.success('Port statuses have been updated')
        }
      }
    } catch {
      toast.error('Failed to refresh port statuses')
    }
  }

  const handleExecuteCommand = async () => {
    if (!systemStatus.nativeHost) {
      toast.error('Native host is required for command execution')
      return
    }

    const command = selectedCommand === 'custom' ? customCommand : selectedCommand
    const args = commandArgs ? commandArgs.split(' ').filter(arg => arg.trim()) : []

    if (!command.trim()) {
      toast({
        title: 'No Command Specified',
        description: 'Please enter a command to execute',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      if (window.api) {
        const response = await window.api.nativeExecute(command, args)
        if (response.success && response.data) {
          toast({
            title: 'Command Executed',
            description: `Command completed with exit code ${response.data.exitCode || 0}`,
            status: response.data.success ? 'success' : 'warning',
            duration: 5000,
            isClosable: true,
          })
        } else {
          toast({
            title: 'Command Failed',
            description: response.error || 'Command execution failed',
            status: 'error',
            duration: 5000,
            isClosable: true,
          })
        }
      }
    } catch {
      toast({
        title: 'Execution Error',
        description: 'An error occurred while executing the command',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const getPortStatus = (port: number) => {
    return statuses.find(status => status.port === port)
  }

  const getStatusColor = (isOpen: boolean) => isOpen ? 'green' : 'red'
  const getStatusText = (isOpen: boolean) => isOpen ? 'Open' : 'Closed'

  return (
    <Container className="space-y-6">
      {/* TNF Services Quick Access */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">TNF Services</h3>
              <Badge variant="info">
                Quick Access
              </Badge>
            </div>
            
            <p className="text-sm text-gray-400">
              Direct access to running TNF services - Browser Hub is now the central interface
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {defaultServices.map(service => {
                const isRunning = getServiceStatus(service.port)
                return (
                  <div key={service.port}>
                    <Card 
                      className={`${isRunning ? "bg-green-900/50 border-green-400" : "bg-red-900/50 border-red-400"} border-2`}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start w-full">
                            <div className="space-y-0">
                              <h4 className="font-bold text-md">{service.name}</h4>
                              <p className="text-xs text-gray-400">:{service.port}</p>
                            </div>
                            <Badge 
                              variant={isRunning ? 'success' : 'destructive'}
                            >
                              {isRunning ? 'Running' : 'Offline'}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-gray-300 text-center">
                            {service.description}
                          </p>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={isRunning ? "default" : "secondary"}
                              onClick={() => handleOpenService(service.url)}
                              className="flex-1"
                              disabled={!isRunning}
                            >
                              <FiExternalLink className="w-3 h-3 mr-1" />
                              Open
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleRefreshStatuses}
                            >
                              <FiRefreshCw className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="border-t border-slate-700" />

      {/* Native Host Status */}
      {!systemStatus.nativeHost && (
        <Alert variant="warning" className="rounded-lg">
          <div>
            <p className="text-sm">
              Native host is not available. Command execution and some system operations will not work.
              Ensure Python 3 is installed and the native host script is accessible.
            </p>
          </div>
        </Alert>
      )}

      {/* Port Monitoring */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Port Monitoring</h3>
              <div className="flex gap-2">
                <Button
                  onClick={handleRefreshStatuses}
                  size="sm"
                  variant="ghost"
                >
                  <FiRefreshCw className="w-4 h-4 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-gray-400">
              Monitor local development servers and services
            </p>

            {/* Add New Port */}
            <div className="flex gap-2">
              <Input
                type="number"
                value={newPort}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPort(parseInt(e.target.value) || 3000)}
                min={1000}
                max={65535}
                placeholder="Port"
                className="w-32"
              />
              
              <Button
                onClick={handleAddPort}
                size="sm"
              >
                <FiPlus className="w-4 h-4 mr-1" />
                Add Port
              </Button>
            </div>

            {/* Monitored Ports List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {monitored.map(port => {
                const status = getPortStatus(port)
                const service = getServiceByPort(port)
                return (
                  <div key={port}>
                    <Card 
                      className={`bg-slate-800/30 ${
                        status ? 
                          (status.isOpen ? 'border-green-400 border-2' : 'border-red-400 border-2') : 
                          'border-slate-600'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start w-full">
                            <div className="space-y-0">
                              <h4 className="font-bold text-md">:{port}</h4>
                              {service && (
                                <p className="text-xs text-blue-300">{service.name}</p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemovePort(port)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <FiTrash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          {status && (
                            <>
                              <Badge 
                                variant={status.isOpen ? 'success' : 'destructive'}
                                className="w-full text-center"
                              >
                                {getStatusText(status.isOpen)}
                              </Badge>
                              
                              {service && status.isOpen && (
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenService(service.url)}
                                  className="w-full"
                                >
                                  <FiExternalLink className="w-3 h-3 mr-1" />
                                  Open
                                </Button>
                              )}
                              
                              {status.service && !service && (
                                <p className="text-xs text-gray-400 text-center">
                                  {status.service}
                                </p>
                              )}
                              
                              <p className="text-xs text-gray-500 text-center">
                                Last checked: {new Date(status.lastChecked).toLocaleTimeString()}
                              </p>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>

            {monitored.length === 0 && (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-2">No ports being monitored</p>
                <p className="text-sm text-gray-600">
                  Add a port above to start monitoring
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="border-t border-slate-700" />

      {/* Native Commands */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Native Commands</h3>
              <Badge 
                variant={systemStatus.nativeHost ? 'success' : 'destructive'}
              >
                {systemStatus.nativeHost ? 'Available' : 'Unavailable'}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-400">
              Execute system-level commands through the native host
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Command Type</label>
                <Select
                   value={selectedCommand}
                   onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCommand(e.target.value)}
                   options={predefinedCommands.map(cmd => ({ value: cmd.value, label: cmd.label }))}
                 />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">
                  {selectedCommand === 'custom' ? 'Custom Command' : 'Arguments'}
                </label>
                {selectedCommand === 'custom' ? (
                  <Input
                     value={customCommand}
                     onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomCommand(e.target.value)}
                     placeholder="Enter command to execute"
                   />
                 ) : (
                   <Input
                     value={commandArgs}
                     onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommandArgs(e.target.value)}
                     placeholder="Enter command arguments"
                   />
                 )}
              </div>
            </div>

            {/* Command Description */}
            <div className="bg-slate-800/30 p-3 rounded-md">
              <p className="text-sm text-gray-300">
                <strong>Description:</strong> {predefinedCommands.find(cmd => cmd.value === selectedCommand)?.description}
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleExecuteCommand}
                variant="default"
                disabled={!systemStatus.nativeHost}
              >
                <FiPlay className="w-4 h-4 mr-1" />
                Execute Command
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Status Overview */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Service Overview</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center space-y-2">
                <div className={`p-3 rounded-full ${tnfRelay.connected ? 'bg-green-900' : 'bg-red-900'}`}>
                  <FiServer color={tnfRelay.connected ? 'lightgreen' : 'lightcoral'} size="24" />
                </div>
                <p className="text-sm text-center">TNF Relay</p>
                <Badge variant={tnfRelay.connected ? 'success' : 'destructive'}>
                  {tnfRelay.connected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>

              <div className="flex flex-col items-center space-y-2">
                <div className={`p-3 rounded-full ${systemStatus.nativeHost ? 'bg-green-900' : 'bg-red-900'}`}>
                  <FiActivity color={systemStatus.nativeHost ? 'lightgreen' : 'lightcoral'} size="24" />
                </div>
                <p className="text-sm text-center">Native Host</p>
                <Badge variant={systemStatus.nativeHost ? 'success' : 'destructive'}>
                  {systemStatus.nativeHost ? 'Running' : 'Stopped'}
                </Badge>
              </div>

              <div className="flex flex-col items-center space-y-2">
                <div className={`p-3 rounded-full ${statuses.some(s => s.isOpen) ? 'bg-green-900' : 'bg-red-900'}`}>
                  <FiServer color={statuses.some(s => s.isOpen) ? 'lightgreen' : 'lightcoral'} size="24" />
                </div>
                <p className="text-sm text-center">Local Services</p>
                <Badge variant={statuses.some(s => s.isOpen) ? 'success' : 'destructive'}>
                  {statuses.filter(s => s.isOpen).length} Active
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  )
}
