import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  useToast
} from '@chakra-ui/react'
import type { RootState } from '../store/store'
import { ConnectionTab } from './tabs/ConnectionTab'
import { ElementsTab } from './tabs/ElementsTab'
import { ChatTab } from './tabs/ChatTab'
import { LocalServicesTab } from './tabs/LocalServicesTab'

export const CommandCenter: React.FC = () => {
  const dispatch = useDispatch()
  const toast = useToast()
  
  const { tnfRelay, mcp, systemStatus } = useSelector((state: RootState) => state.connections)
  const { statuses: portStatuses } = useSelector((state: RootState) => state.ports)

  useEffect(() => {
    // Set up IPC event listeners for real-time updates
    if (window.api) {
      // Listen for system events
      window.api.onSystemEvent((event: string, data: any) => {
        switch (event) {
          case 'tnf-relay-connected':
            toast({
              title: 'TNF Relay Connected',
              description: 'Successfully connected to TNF Relay',
              status: 'success',
              duration: 3000,
              isClosable: true,
            })
            break
          case 'tnf-relay-disconnected':
            toast({
              title: 'TNF Relay Disconnected',
              description: 'Lost connection to TNF Relay',
              status: 'warning',
              duration: 3000,
              isClosable: true,
            })
            break
          case 'element-detected':
            toast({
              title: 'Element Detected',
              description: `${data.elementType} element detected with ${data.confidence}% confidence`,
              status: 'info',
              duration: 2000,
              isClosable: true,
            })
            break
          case 'port-statuses-updated':
            // Update port statuses in store
            break
        }
      })
    }

    // Initial status fetch
    fetchSystemStatus()
    
    // Set up periodic status updates
    const statusInterval = setInterval(fetchSystemStatus, 30000) // Every 30 seconds
    
    return () => {
      clearInterval(statusInterval)
      if (window.api) {
        window.api.offSystemEvent(() => {})
      }
    }
  }, [dispatch, toast])

  const fetchSystemStatus = async () => {
    try {
      if (window.api) {
        const response = await window.api.systemStatus()
        if (response.success && response.data) {
          // Update store with system status
          // dispatch(updateSystemStatus(response.data))
        }
      }
    } catch {
    }
  }

  const getConnectionSummary = () => {
    const connections = [
      { name: 'TNF Relay', connected: tnfRelay.connected },
      { name: 'MCP', connected: mcp.connected },
      { name: 'Native Host', connected: systemStatus.nativeHost }
    ]
    
    const connectedCount = connections.filter(c => c.connected).length
    return { total: connections.length, connected: connectedCount, connections }
  }

  const getPortSummary = () => {
    const openPorts = portStatuses.filter(port => port.isOpen).length
    return { total: portStatuses.length, open: openPorts }
  }

  const connectionSummary = getConnectionSummary()
  const portSummary = getPortSummary()

  return (
    <Container maxW="100%" p={4} bg="transparent">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading 
            size="lg" 
            bgGradient="linear(to-r, brand.300, brand.500)"
            bgClip="text"
            fontWeight="bold"
          >
            TNF Browser Hub
          </Heading>
          <Text color="gray.300" mt={2}>
            Hybrid AI-Powered Browser Automation System
          </Text>
        </Box>

        {/* Status Overview */}
        <HStack justify="space-around" p={4} bg="whiteAlpha.100" borderRadius="lg" border="1px solid" borderColor="whiteAlpha.200">
          <VStack>
            <Text fontSize="2xl" fontWeight="bold" color={connectionSummary.connected === connectionSummary.total ? 'green.400' : 'yellow.400'}>
              {connectionSummary.connected}/{connectionSummary.total}
            </Text>
            <Text fontSize="sm" color="gray.400">Connections</Text>
          </VStack>
          
          <VStack>
            <Text fontSize="2xl" fontWeight="bold" color={portSummary.open > 0 ? 'green.400' : 'red.400'}>
              {portSummary.open}/{portSummary.total}
            </Text>
            <Text fontSize="sm" color="gray.400">Services</Text>
          </VStack>
          
          <VStack>
            <Text fontSize="2xl" fontWeight="bold" color={systemStatus.initialized ? 'green.400' : 'gray.400'}>
              {systemStatus.initialized ? '✓' : '○'}
            </Text>
            <Text fontSize="sm" color="gray.400">System</Text>
          </VStack>
        </HStack>

        {/* Main Tabs */}
        <Tabs variant="soft-rounded" colorScheme="brand">
          <TabList justifyContent="center" gap={2}>
            <Tab 
              _selected={{ 
                bg: 'brand.500', 
                color: 'white',
                boxShadow: '0 0 20px rgba(0, 135, 255, 0.3)'
              }}
            >
              Connections
            </Tab>
            <Tab 
              _selected={{ 
                bg: 'brand.500', 
                color: 'white',
                boxShadow: '0 0 20px rgba(0, 135, 255, 0.3)'
              }}
            >
              Elements
            </Tab>
            <Tab 
              _selected={{ 
                bg: 'brand.500', 
                color: 'white',
                boxShadow: '0 0 20px rgba(0, 135, 255, 0.3)'
              }}
            >
              Chat
            </Tab>
            <Tab 
              _selected={{ 
                bg: 'brand.500', 
                color: 'white',
                boxShadow: '0 0 20px rgba(0, 135, 255, 0.3)'
              }}
            >
              Services
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <ConnectionTab />
            </TabPanel>
            <TabPanel>
              <ElementsTab />
            </TabPanel>
            <TabPanel>
              <ChatTab />
            </TabPanel>
            <TabPanel>
              <LocalServicesTab />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  )
}
