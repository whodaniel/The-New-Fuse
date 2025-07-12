/**
 * Local AI Agents Manager Component
 * Provides UI for detecting, registering, and managing local AI agents
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  SimpleGrid,
  Icon,
  Tooltip,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { 
  FiCpu, 
  FiRefreshCw, 
  FiPlus, 
  FiCheck, 
  FiX, 
  FiMonitor,
  FiSettings,
  FiEye,
  FiActivity
} from 'react-icons/fi';

interface LocalAIProvider {
  name: string;
  description: string;
  capabilities: string[];
  command: string;
  apiEndpoint?: string;
  available?: boolean;
}

interface LocalAIAgent {
  id: string;
  name: string;
  type: string;
  status: string;
  provider: string;
  capabilities: any[];
  description: string;
  createdAt: string;
  available?: boolean;
}

export const LocalAIAgentsManager: React.FC = () => {
  const [providers, setProviders] = useState<LocalAIProvider[]>([]);
  const [agents, setAgents] = useState<LocalAIAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<LocalAIAgent | null>(null);
  
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    loadAgents();
  }, []);

  const detectLocalAIs = async () => {
    setDetecting(true);
    try {
      const response = await fetch('/api/local-ai/detect');
      const data = await response.json();
      
      if (data.success) {
        setProviders(data.providers);
        toast({
          title: 'Detection Complete',
          description: `Found ${data.count} local AI providers`,
          status: 'success',
          duration: 3000,
        });
      } else {
        throw new Error('Detection failed');
      }
    } catch (error) {
      toast({
        title: 'Detection Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setDetecting(false);
    }
  };

  const registerLocalAIs = async () => {
    setRegistering(true);
    try {
      const response = await fetch('/api/local-ai/register', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        await loadAgents();
        toast({
          title: 'Registration Complete',
          description: data.message,
          status: 'success',
          duration: 3000,
        });
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      toast({
        title: 'Registration Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setRegistering(false);
    }
  };

  const loadAgents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/local-ai/agents');
      const data = await response.json();
      
      if (data.success) {
        setAgents(data.agents);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAgents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/local-ai/refresh', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        await loadAgents();
        toast({
          title: 'Refresh Complete',
          description: 'Local AI agents updated',
          status: 'success',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const checkAgentStatus = async (agent: LocalAIAgent) => {
    try {
      const response = await fetch(`/api/local-ai/agents/${agent.id}/status`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedAgent({ ...agent, available: data.agent.available });
        onOpen();
      }
    } catch (error) {
      console.error('Failed to check agent status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'green';
      case 'idle': return 'yellow';
      case 'busy': return 'blue';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'Claude Code CLI': return FiMonitor;
      case 'Gemini CLI': return FiCpu;
      case 'Ollama': return FiActivity;
      default: return FiCpu;
    }
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Text fontSize="2xl" fontWeight="bold" mb={2}>
            Local AI Agents Manager
          </Text>
          <Text color="gray.600">
            Detect, register, and manage local AI providers as agents
          </Text>
        </Box>

        {/* Actions */}
        <HStack spacing={4}>
          <Button
            leftIcon={<FiCpu />}
            onClick={detectLocalAIs}
            isLoading={detecting}
            loadingText="Detecting..."
            colorScheme="blue"
          >
            Detect Local AIs
          </Button>
          
          <Button
            leftIcon={<FiPlus />}
            onClick={registerLocalAIs}
            isLoading={registering}
            loadingText="Registering..."
            colorScheme="green"
            isDisabled={providers.length === 0}
          >
            Register as Agents
          </Button>
          
          <Button
            leftIcon={<FiRefreshCw />}
            onClick={refreshAgents}
            isLoading={loading}
            variant="outline"
          >
            Refresh
          </Button>
        </HStack>

        {/* Detection Results */}
        {providers.length > 0 && (
          <Box>
            <Text fontSize="lg" fontWeight="semibold" mb={4}>
              Detected Local AI Providers ({providers.length})
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {providers.map((provider, index) => (
                <Card key={index} size="sm">
                  <CardBody>
                    <VStack align="start" spacing={2}>
                      <HStack>
                        <Icon as={getProviderIcon(provider.name)} color="blue.500" />
                        <Text fontWeight="semibold">{provider.name}</Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.600">
                        {provider.description}
                      </Text>
                      <HStack wrap="wrap">
                        {provider.capabilities.slice(0, 3).map((cap, i) => (
                          <Badge key={i} size="sm" colorScheme="blue">
                            {cap}
                          </Badge>
                        ))}
                        {provider.capabilities.length > 3 && (
                          <Badge size="sm" variant="outline">
                            +{provider.capabilities.length - 3} more
                          </Badge>
                        )}
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </Box>
        )}

        <Divider />

        {/* Registered Agents */}
        <Box>
          <HStack justify="space-between" mb={4}>
            <Text fontSize="lg" fontWeight="semibold">
              Registered Local AI Agents ({agents.length})
            </Text>
            {loading && <Spinner size="sm" />}
          </HStack>

          {agents.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              <AlertTitle>No Local AI Agents Found</AlertTitle>
              <AlertDescription>
                Click "Detect Local AIs" and then "Register as Agents" to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
              {agents.map((agent) => (
                <Card key={agent.id}>
                  <CardBody>
                    <VStack align="start" spacing={3}>
                      <HStack justify="space-between" w="full">
                        <HStack>
                          <Icon as={getProviderIcon(agent.provider)} color="blue.500" />
                          <Text fontWeight="semibold">{agent.name}</Text>
                        </HStack>
                        <Badge colorScheme={getStatusColor(agent.status)}>
                          {agent.status}
                        </Badge>
                      </HStack>

                      <Text fontSize="sm" color="gray.600">
                        {agent.description}
                      </Text>

                      <HStack>
                        <Text fontSize="xs" color="gray.500">Provider:</Text>
                        <Badge size="sm" variant="outline">{agent.provider}</Badge>
                      </HStack>

                      <HStack wrap="wrap">
                        {agent.capabilities?.slice(0, 2).map((cap, i) => (
                          <Badge key={i} size="sm" colorScheme="green">
                            {cap.name}
                          </Badge>
                        ))}
                        {agent.capabilities?.length > 2 && (
                          <Badge size="sm" variant="outline">
                            +{agent.capabilities.length - 2} more
                          </Badge>
                        )}
                      </HStack>

                      <HStack spacing={2} pt={2}>
                        <Tooltip label="Check Status">
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<FiEye />}
                            onClick={() => checkAgentStatus(agent)}
                          >
                            Status
                          </Button>
                        </Tooltip>
                        
                        <Tooltip label="Configure Agent">
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<FiSettings />}
                            isDisabled
                          >
                            Configure
                          </Button>
                        </Tooltip>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Box>
      </VStack>

      {/* Agent Status Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Agent Status</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedAgent && (
              <VStack align="start" spacing={4}>
                <HStack>
                  <Icon as={getProviderIcon(selectedAgent.provider)} size="lg" />
                  <Box>
                    <Text fontWeight="semibold">{selectedAgent.name}</Text>
                    <Text fontSize="sm" color="gray.600">{selectedAgent.provider}</Text>
                  </Box>
                </HStack>

                <HStack>
                  <Text fontWeight="medium">Status:</Text>
                  <Badge colorScheme={getStatusColor(selectedAgent.status)}>
                    {selectedAgent.status}
                  </Badge>
                </HStack>

                <HStack>
                  <Text fontWeight="medium">Available:</Text>
                  <Icon 
                    as={selectedAgent.available ? FiCheck : FiX}
                    color={selectedAgent.available ? 'green.500' : 'red.500'}
                  />
                  <Text color={selectedAgent.available ? 'green.500' : 'red.500'}>
                    {selectedAgent.available ? 'Yes' : 'No'}
                  </Text>
                </HStack>

                <Box>
                  <Text fontWeight="medium" mb={2}>Capabilities:</Text>
                  <HStack wrap="wrap">
                    {selectedAgent.capabilities?.map((cap, i) => (
                      <Badge key={i} colorScheme="blue">
                        {cap.name}
                      </Badge>
                    ))}
                  </HStack>
                </Box>

                <Box>
                  <Text fontWeight="medium">Created:</Text>
                  <Text fontSize="sm" color="gray.600">
                    {new Date(selectedAgent.createdAt).toLocaleString()}
                  </Text>
                </Box>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default LocalAIAgentsManager;