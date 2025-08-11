import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import {
  VStack,
  HStack,
  Box,
  Text,
  Button,
  Input,
  Card,
  CardBody,
  Badge,
  Divider,
  useToast,
  Alert,
  AlertIcon,
  Grid,
  GridItem,
  IconButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel
} from '@chakra-ui/react'
import { FiPlus, FiTrash2, FiRefreshCw, FiPlay, FiServer, FiActivity, FiExternalLink, FiMonitor } from 'react-icons/fi'
import type { RootState } from '../../store/store'

export const LocalServicesTab: React.FC = () => {
  const toast = useToast()
  
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
      toast({
        title: 'Port Already Monitored',
        description: `Port ${newPort} is already being monitored`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      if (window.api) {
        const response = await window.api.portsAdd(newPort)
        if (response.success) {
          toast({
            title: 'Port Added',
            description: `Port ${newPort} is now being monitored`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          })
          setNewPort(3000)
        }
      }
    } catch {
      toast({
        title: 'Failed to Add Port',
        description: 'An error occurred while adding the port',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleRemovePort = async (port: number) => {
    try {
      if (window.api) {
        const response = await window.api.portsRemove(port)
        if (response.success) {
          toast({
            title: 'Port Removed',
            description: `Port ${port} is no longer being monitored`,
            status: 'info',
            duration: 3000,
            isClosable: true,
          })
        }
      }
    } catch {
      toast({
        title: 'Failed to Remove Port',
        description: 'An error occurred while removing the port',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleRefreshStatuses = async () => {
    try {
      if (window.api) {
        const response = await window.api.portsStatus()
        if (response.success) {
          toast({
            title: 'Statuses Refreshed',
            description: 'Port statuses have been updated',
            status: 'success',
            duration: 2000,
            isClosable: true,
          })
        }
      }
    } catch {
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh port statuses',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleExecuteCommand = async () => {
    if (!systemStatus.nativeHost) {
      toast({
        title: 'Native Host Not Available',
        description: 'Native host is required for command execution',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
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
    <VStack spacing={6} align="stretch">
      {/* TNF Services Quick Access */}
      <Card bg="whiteAlpha.100" borderColor="whiteAlpha.200">
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="bold">TNF Services</Text>
              <Badge colorScheme="blue" variant="solid">
                Quick Access
              </Badge>
            </HStack>
            
            <Text fontSize="sm" color="gray.400">
              Direct access to running TNF services - Browser Hub is now the central interface
            </Text>

            <Grid templateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={4}>
              {defaultServices.map(service => {
                const isRunning = getServiceStatus(service.port)
                return (
                  <GridItem key={service.port}>
                    <Card 
                      size="sm" 
                      bg={isRunning ? "green.900" : "red.900"} 
                      borderColor={isRunning ? "green.400" : "red.400"}
                      borderWidth="2px"
                    >
                      <CardBody>
                        <VStack spacing={3}>
                          <HStack justify="space-between" w="100%">
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="bold" fontSize="md">{service.name}</Text>
                              <Text fontSize="xs" color="gray.400">:{service.port}</Text>
                            </VStack>
                            <Badge 
                              colorScheme={isRunning ? 'green' : 'red'} 
                              variant="solid"
                            >
                              {isRunning ? 'Running' : 'Offline'}
                            </Badge>
                          </HStack>
                          
                          <Text fontSize="xs" color="gray.300" textAlign="center">
                            {service.description}
                          </Text>
                          
                          <HStack w="100%" justify="center">
                            <Button
                              size="xs"
                              colorScheme={isRunning ? "blue" : "gray"}
                              leftIcon={<FiExternalLink />}
                              onClick={() => handleOpenService(service.url)}
                              isDisabled={!isRunning}
                              flex={1}
                            >
                              {isRunning ? 'Open' : 'Unavailable'}
                            </Button>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  </GridItem>
                )
              })}
            </Grid>
          </VStack>
        </CardBody>
      </Card>

      <Divider />

      {/* Native Host Status */}
      {!systemStatus.nativeHost && (
        <Alert status="warning" borderRadius="lg">
          <AlertIcon />
          <Box>
            <Text fontSize="sm">
              Native host is not available. Command execution and some system operations will not work.
              Ensure Python 3 is installed and the native host script is accessible.
            </Text>
          </Box>
        </Alert>
      )}

      {/* Port Monitoring */}
      <Card bg="whiteAlpha.100" borderColor="whiteAlpha.200">
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="bold">Port Monitoring</Text>
              <HStack>
                <Button
                  onClick={handleRefreshStatuses}
                  size="sm"
                  variant="ghost"
                  leftIcon={<FiRefreshCw />}
                >
                  Refresh
                </Button>
              </HStack>
            </HStack>
            
            <Text fontSize="sm" color="gray.400">
              Monitor local development servers and services
            </Text>

            {/* Add New Port */}
            <HStack>
              <NumberInput
                value={newPort}
                onChange={(_, value) => setNewPort(value || 3000)}
                min={1000}
                max={65535}
                size="sm"
                w="120px"
              >
                <NumberInputField placeholder="Port" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              
              <Button
                onClick={handleAddPort}
                colorScheme="blue"
                size="sm"
                leftIcon={<FiPlus />}
              >
                Add Port
              </Button>
            </HStack>

            {/* Monitored Ports List */}
            <Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={3}>
              {monitored.map(port => {
                const status = getPortStatus(port)
                const service = getServiceByPort(port)
                return (
                  <GridItem key={port}>
                    <Card 
                      size="sm" 
                      bg="whiteAlpha.50" 
                      borderColor={status ? getStatusColor(status.isOpen) + '.400' : 'whiteAlpha.200'}
                      borderWidth={status?.isOpen ? '2px' : '1px'}
                    >
                      <CardBody>
                        <VStack spacing={2}>
                          <HStack justify="space-between" w="100%">
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="bold" fontSize="md">:{port}</Text>
                              {service && (
                                <Text fontSize="xs" color="blue.300">{service.name}</Text>
                              )}
                            </VStack>
                            <IconButton
                              aria-label="Remove port"
                              icon={<FiTrash2 />}
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleRemovePort(port)}
                            />
                          </HStack>
                          
                          {status && (
                            <>
                              <Badge 
                                colorScheme={getStatusColor(status.isOpen)} 
                                variant="solid"
                                w="100%"
                                textAlign="center"
                              >
                                {getStatusText(status.isOpen)}
                              </Badge>
                              
                              {service && status.isOpen && (
                                <Button
                                  size="xs"
                                  colorScheme="blue"
                                  leftIcon={<FiExternalLink />}
                                  onClick={() => handleOpenService(service.url)}
                                  w="100%"
                                >
                                  Open
                                </Button>
                              )}
                              
                              {status.service && !service && (
                                <Text fontSize="xs" color="gray.400" textAlign="center">
                                  {status.service}
                                </Text>
                              )}
                              
                              <Text fontSize="xs" color="gray.500" textAlign="center">
                                Last checked: {new Date(status.lastChecked).toLocaleTimeString()}
                              </Text>
                            </>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  </GridItem>
                )
              })}
            </Grid>

            {monitored.length === 0 && (
              <Box textAlign="center" py={6}>
                <Text color="gray.500" mb={2}>No ports being monitored</Text>
                <Text fontSize="sm" color="gray.600">
                  Add a port above to start monitoring
                </Text>
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>

      <Divider />

      {/* Native Commands */}
      <Card bg="whiteAlpha.100" borderColor="whiteAlpha.200">
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="bold">Native Commands</Text>
              <Badge 
                colorScheme={systemStatus.nativeHost ? 'green' : 'red'} 
                variant="solid"
              >
                {systemStatus.nativeHost ? 'Available' : 'Unavailable'}
              </Badge>
            </HStack>
            
            <Text fontSize="sm" color="gray.400">
              Execute system-level commands through the native host
            </Text>

            <Grid templateColumns="1fr 2fr" gap={4}>
              <GridItem>
                <FormControl>
                  <FormLabel fontSize="sm" htmlFor="command-type-select">Command Type</FormLabel>
                  <select
                    id="command-type-select"
                    value={selectedCommand}
                    onChange={(e) => setSelectedCommand(e.target.value)}
                    title="Command Type"
                    aria-label="Command Type"
                    style={{ fontSize: '0.875rem', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #CBD5E0', width: '100%' }}
                  >
                    {predefinedCommands.map(cmd => (
                      <option key={cmd.value} value={cmd.value}>
                        {cmd.label}
                      </option>
                    ))}
                  </select>
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel fontSize="sm">
                    {selectedCommand === 'custom' ? 'Custom Command' : 'Arguments'}
                  </FormLabel>
                  {selectedCommand === 'custom' ? (
                    <Input
                      value={customCommand}
                      onChange={(e) => setCustomCommand(e.target.value)}
                      placeholder="Enter command to execute"
                      size="sm"
                    />
                  ) : (
                    <Input
                      value={commandArgs}
                      onChange={(e) => setCommandArgs(e.target.value)}
                      placeholder="Enter command arguments"
                      size="sm"
                    />
                  )}
                </FormControl>
              </GridItem>
            </Grid>

            {/* Command Description */}
            <Box bg="whiteAlpha.50" p={3} borderRadius="md">
              <Text fontSize="sm" color="gray.300">
                <strong>Description:</strong> {predefinedCommands.find(cmd => cmd.value === selectedCommand)?.description}
              </Text>
            </Box>

            <HStack justify="flex-end">
              <Button
                onClick={handleExecuteCommand}
                colorScheme="green"
                leftIcon={<FiPlay />}
                isDisabled={!systemStatus.nativeHost}
              >
                Execute Command
              </Button>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Service Status Overview */}
      <Card bg="whiteAlpha.100" borderColor="whiteAlpha.200">
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="lg" fontWeight="bold">Service Overview</Text>
            
            <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={4}>
              <GridItem>
                <VStack>
                  <Box p={3} bg={tnfRelay.connected ? 'green.900' : 'red.900'} borderRadius="full">
                    <FiServer color={tnfRelay.connected ? 'lightgreen' : 'lightcoral'} size="24" />
                  </Box>
                  <Text fontSize="sm" textAlign="center">TNF Relay</Text>
                  <Badge colorScheme={tnfRelay.connected ? 'green' : 'red'} variant="subtle">
                    {tnfRelay.connected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </VStack>
              </GridItem>

              <GridItem>
                <VStack>
                  <Box p={3} bg={systemStatus.nativeHost ? 'green.900' : 'red.900'} borderRadius="full">
                    <FiActivity color={systemStatus.nativeHost ? 'lightgreen' : 'lightcoral'} size="24" />
                  </Box>
                  <Text fontSize="sm" textAlign="center">Native Host</Text>
                  <Badge colorScheme={systemStatus.nativeHost ? 'green' : 'red'} variant="subtle">
                    {systemStatus.nativeHost ? 'Running' : 'Stopped'}
                  </Badge>
                </VStack>
              </GridItem>

              <GridItem>
                <VStack>
                  <Box p={3} bg={statuses.some(s => s.isOpen) ? 'green.900' : 'red.900'} borderRadius="full">
                    <FiServer color={statuses.some(s => s.isOpen) ? 'lightgreen' : 'lightcoral'} size="24" />
                  </Box>
                  <Text fontSize="sm" textAlign="center">Local Services</Text>
                  <Badge colorScheme={statuses.some(s => s.isOpen) ? 'green' : 'red'} variant="subtle">
                    {statuses.filter(s => s.isOpen).length} Active
                  </Badge>
                </VStack>
              </GridItem>
            </Grid>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  )
}
