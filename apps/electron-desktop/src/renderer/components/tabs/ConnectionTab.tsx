import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import {
  VStack,
  HStack,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  Card,
  CardBody,
  Badge,
  Divider,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Box
} from '@chakra-ui/react'
import type { RootState } from '../../store/store.js'

export const ConnectionTab: React.FC = () => {
  const toast = useToast()
  
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
          toast({
            title: 'TNF Relay Connected',
            description: 'Successfully connected to TNF Relay',
            status: 'success',
            duration: 3000,
            isClosable: true,
          })
        } else {
          toast({
            title: 'Connection Failed',
            description: response.error || 'Failed to connect to TNF Relay',
            status: 'error',
            duration: 5000,
            isClosable: true,
          })
        }
      }
    } catch {
      toast({
        title: 'Connection Error',
        description: 'An error occurred while connecting',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleTNFDisconnect = async () => {
    try {
      if (window.api) {
        const response = await window.api.tnfDisconnect()
        if (response.success) {
          toast({
            title: 'TNF Relay Disconnected',
            description: 'Successfully disconnected from TNF Relay',
            status: 'info',
            duration: 3000,
            isClosable: true,
          })
        }
      }
    } catch {
      toast({
        title: 'Disconnection Error',
        description: 'An error occurred while disconnecting',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleMCPConnect = async () => {
    try {
      if (window.api) {
        const response = await window.api.mcpConnect(mcpConfig)
        if (response.success) {
          toast({
            title: 'MCP Connected',
            description: 'Successfully connected to MCP server',
            status: 'success',
            duration: 3000,
            isClosable: true,
          })
        } else {
          toast({
            title: 'MCP Connection Failed',
            description: response.error || 'Failed to connect to MCP server',
            status: 'error',
            duration: 5000,
            isClosable: true,
          })
        }
      }
    } catch {
      toast({
        title: 'MCP Connection Error',
        description: 'An error occurred while connecting to MCP',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleMCPDisconnect = async () => {
    try {
      if (window.api) {
        const response = await window.api.mcpDisconnect()
        if (response.success) {
          toast({
            title: 'MCP Disconnected',
            description: 'Successfully disconnected from MCP server',
            status: 'info',
            duration: 3000,
            isClosable: true,
          })
        }
      }
    } catch {
      toast({
        title: 'MCP Disconnection Error',
        description: 'An error occurred while disconnecting from MCP',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const getStatusColor = (connected: boolean) => connected ? 'green' : 'red'
  const getStatusText = (connected: boolean) => connected ? 'Connected' : 'Disconnected'

  return (
    <VStack spacing={6} align="stretch">
      {/* System Status Alert */}
      {!systemStatus.initialized && (
        <Alert status="warning" borderRadius="lg">
          <AlertIcon />
          <Box>
            <AlertTitle>System Initializing</AlertTitle>
            <AlertDescription>
              The hybrid backend is still initializing. Some features may not be available yet.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* TNF Relay Connection */}
      <Card bg="whiteAlpha.100" borderColor="whiteAlpha.200">
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="bold">TNF Relay</Text>
              <Badge colorScheme={getStatusColor(tnfRelay.connected)} variant="solid">
                {getStatusText(tnfRelay.connected)}
              </Badge>
            </HStack>
            
            <Text fontSize="sm" color="gray.400">
              Connect to the TNF Relay system for AI-powered browser automation
            </Text>

            <HStack spacing={4}>
              <FormControl flex={2}>
                <FormLabel fontSize="sm">WebSocket URL</FormLabel>
                <Input
                  value={tnfConfig.url}
                  onChange={(e) => setTnfConfig(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="ws://localhost:3001"
                  size="sm"
                />
              </FormControl>
              
              <FormControl flex={1}>
                <FormLabel fontSize="sm">Port</FormLabel>
                <NumberInput
                  value={tnfConfig.port}
                  onChange={(_, value) => setTnfConfig(prev => ({ ...prev, port: value || 3001 }))}
                  min={1000}
                  max={65535}
                  size="sm"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </HStack>

            <HStack justify="space-between">
              <FormControl w="auto">
                <HStack>
                  <Switch
                    isChecked={tnfConfig.autoReconnect}
                    onChange={(e) => setTnfConfig(prev => ({ ...prev, autoReconnect: e.target.checked }))}
                    size="sm"
                  />
                  <Text fontSize="sm">Auto-reconnect</Text>
                </HStack>
              </FormControl>

              <HStack>
                <Button
                  onClick={tnfRelay.connected ? handleTNFDisconnect : handleTNFConnect}
                  colorScheme={tnfRelay.connected ? 'red' : 'green'}
                  size="sm"
                  isLoading={false}
                >
                  {tnfRelay.connected ? 'Disconnect' : 'Connect'}
                </Button>
              </HStack>
            </HStack>

            {tnfRelay.connected && tnfRelay.lastConnected && (
              <Text fontSize="xs" color="gray.500">
                Last connected: {new Date(tnfRelay.lastConnected).toLocaleString()}
              </Text>
            )}
          </VStack>
        </CardBody>
      </Card>

      <Divider />

      {/* MCP Connection */}
      <Card bg="whiteAlpha.100" borderColor="whiteAlpha.200">
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="bold">Model Context Protocol (MCP)</Text>
              <Badge colorScheme={getStatusColor(mcp.connected)} variant="solid">
                {getStatusText(mcp.connected)}
              </Badge>
            </HStack>
            
            <Text fontSize="sm" color="gray.400">
              Connect to MCP servers for enhanced AI capabilities and tool integration
            </Text>

            <HStack spacing={4}>
              <FormControl flex={2}>
                <FormLabel fontSize="sm">Host</FormLabel>
                <Input
                  value={mcpConfig.host}
                  onChange={(e) => setMcpConfig(prev => ({ ...prev, host: e.target.value }))}
                  placeholder="localhost"
                  size="sm"
                />
              </FormControl>
              
              <FormControl flex={1}>
                <FormLabel fontSize="sm">Port</FormLabel>
                <NumberInput
                  value={mcpConfig.port}
                  onChange={(_, value) => setMcpConfig(prev => ({ ...prev, port: value || 3000 }))}
                  min={1000}
                  max={65535}
                  size="sm"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </HStack>

            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.400">
                Protocol: WebSocket
              </Text>

              <Button
                onClick={mcp.connected ? handleMCPDisconnect : handleMCPConnect}
                colorScheme={mcp.connected ? 'red' : 'blue'}
                size="sm"
              >
                {mcp.connected ? 'Disconnect' : 'Connect'}
              </Button>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      <Divider />

      {/* Native Host Status */}
      <Card bg="whiteAlpha.100" borderColor="whiteAlpha.200">
        <CardBody>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="bold">Native Host</Text>
              <Badge colorScheme={getStatusColor(systemStatus.nativeHost)} variant="solid">
                {getStatusText(systemStatus.nativeHost)}
              </Badge>
            </HStack>
            
            <Text fontSize="sm" color="gray.400">
              Python native host for system-level automation and file operations
            </Text>

            {!systemStatus.nativeHost && (
              <Alert status="info" size="sm" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  Native host provides system-level automation capabilities. 
                  Ensure Python 3 is installed and the host script is available.
                </Text>
              </Alert>
            )}
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  )
}
