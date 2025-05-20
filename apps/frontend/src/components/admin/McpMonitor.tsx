import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Input,
  FormControl,
  FormLabel,
  Switch,
  Badge,
  useToast,
  Heading,
  Text,
  VStack,
  HStack,
  Code,
  Select,
  Divider
} from '@chakra-ui/react';
import { useMcpServers, useMcpClients } from '../../hooks/useMcp.js';

export const McpMonitor: React.FC = () => {
  const toast = useToast();
  const { 
    servers, 
    serverStatus, 
    startServer, 
    stopServer, 
    registerTool,
    registerResource,
    registerPrompt
  } = useMcpServers();
  
  const { 
    clients, 
    clientStatus, 
    connectClient, 
    disconnectClient,
    discoverCapabilities,
    callTool
  } = useMcpClients();

  const [newServerConfig, setNewServerConfig] = useState({
    id: '',
    name: '',
    description: '',
    version: '1.0.0',
    transport: 'sse',
    port: 3000,
    authRequired: false,
    authKey: ''
  });

  const [newClientConfig, setNewClientConfig] = useState({
    id: '',
    serverUrl: '',
    transport: 'sse',
    timeout: 30000,
    authKey: ''
  });

  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [toolParams, setToolParams] = useState<string>('{}');

  return (
    <Box p={4}>
      <Heading size="lg" mb={4}>MCP Monitor</Heading>
      <Text mb={4}>Manage Model Context Protocol servers and clients</Text>

      <Tabs isLazy>
        <TabList>
          <Tab>Servers</Tab>
          <Tab>Clients</Tab>
          <Tab>Test Tools</Tab>
          <Tab>Logs</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Heading size="md">MCP Servers</Heading>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>Name</Th>
                    <Th>Transport</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {servers.map(server => (
                    <Tr key={server.id}>
                      <Td>{server.id}</Td>
                      <Td>{server.name}</Td>
                      <Td>{server.transport}</Td>
                      <Td>
                        <Badge colorScheme={serverStatus[server.id] === 'running' ? 'green' : 'gray'}>
                          {serverStatus[server.id] || 'stopped'}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          {serverStatus[server.id] === 'running' ? (
                            <Button size="sm" colorScheme="red" onClick={() => stopServer(server.id)}>
                              Stop
                            </Button>
                          ) : (
                            <Button size="sm" colorScheme="green" onClick={() => startServer(server.id)}>
                              Start
                            </Button>
                          )}
                          <Button size="sm" onClick={() => setSelectedServer(server.id)}>
                            Details
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>

              {selectedServer && (
                <Box mt={4} p={4} borderWidth={1} borderRadius="md">
                  <Heading size="sm" mb={2}>Server Details: {selectedServer}</Heading>
                  <Tabs size="sm">
                    <TabList>
                      <Tab>Tools</Tab>
                      <Tab>Resources</Tab>
                      <Tab>Prompts</Tab>
                      <Tab>Configuration</Tab>
                    </TabList>
                    <TabPanels>
                      <TabPanel>
                        {/* Tool management UI */}
                      </TabPanel>
                      <TabPanel>
                        {/* Resource management UI */}
                      </TabPanel>
                      <TabPanel>
                        {/* Prompt management UI */}
                      </TabPanel>
                      <TabPanel>
                        {/* Server configuration UI */}
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </Box>
              )}

              <Divider my={4} />

              <Heading size="md" mb={2}>Add New Server</Heading>
              {/* New server form */}
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Heading size="md">MCP Clients</Heading>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>Server URL</Th>
                    <Th>Transport</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {clients.map(client => (
                    <Tr key={client.id}>
                      <Td>{client.id}</Td>
                      <Td>{client.serverUrl}</Td>
                      <Td>{client.transport}</Td>
                      <Td>
                        <Badge colorScheme={clientStatus[client.id] === 'connected' ? 'green' : 'gray'}>
                          {clientStatus[client.id] || 'disconnected'}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          {clientStatus[client.id] === 'connected' ? (
                            <Button size="sm" colorScheme="red" onClick={() => disconnectClient(client.id)}>
                              Disconnect
                            </Button>
                          ) : (
                            <Button size="sm" colorScheme="green" onClick={() => connectClient(client.id)}>
                              Connect
                            </Button>
                          )}
                          <Button size="sm" onClick={() => setSelectedClient(client.id)}>
                            Details
                          </Button>
                          {clientStatus[client.id] === 'connected' && (
                            <Button size="sm" colorScheme="blue" onClick={() => discoverCapabilities(client.id)}>
                              Discover
                            </Button>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>

              {selectedClient && (
                <Box mt={4} p={4} borderWidth={1} borderRadius="md">
                  <Heading size="sm" mb={2}>Client Details: {selectedClient}</Heading>
                  {/* Client details and capabilities */}
                </Box>
              )}

              <Divider my={4} />

              <Heading size="md" mb={2}>Add New Client</Heading>
              {/* New client form */}
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Heading size="md">Test Tool Calls</Heading>
              {/* Tool testing UI */}
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Heading size="md">MCP Logs</Heading>
              {/* Log viewer */}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};
