import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, Button, VStack, HStack, Code, Alert, AlertIcon, Progress, Badge } from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';

interface AIAgentOnboardingProps {
  agentId?: string;
  onComplete: (agentData: any) => void;
}

export const AIAgentOnboarding: React.FC<AIAgentOnboardingProps> = ({ agentId, onComplete }) => {
  const [step, setStep] = useState<'detection' | 'registration' | 'capabilities' | 'communication' | 'complete'>('detection');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentData, setAgentData] = useState<any>({
    id: agentId || `agent-${Date.now()}`,
    capabilities: [],
    communicationChannels: [],
    registrationComplete: false
  });
  const [capabilityTests, setCapabilityTests] = useState<{
    name: string;
    status: 'pending' | 'running' | 'success' | 'failed';
    result?: any;
  }[]>([
    { name: 'file-management', status: 'pending' },
    { name: 'process-management', status: 'pending' },
    { name: 'web-interaction', status: 'pending' },
    { name: 'code-analysis', status: 'pending' },
    { name: 'api-integration', status: 'pending' }
  ]);

  useEffect(() => {
    // Simulate automatic detection
    const timer = setTimeout(() => {
      setStep('registration');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleRegistration = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setAgentData(prev => ({
        ...prev,
        registrationComplete: true
      }));
      
      setStep('capabilities');
    } catch (err) {
      setError('Failed to register agent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const runCapabilityTests = async () => {
    setLoading(true);
    setError(null);

    try {
      // Run tests sequentially
      for (let i = 0; i < capabilityTests.length; i++) {
        // Update status to running
        setCapabilityTests(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: 'running' };
          return updated;
        });

        // Simulate test execution
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update with result (randomly success or failure for demo)
        const success = Math.random() > 0.3;
        setCapabilityTests(prev => {
          const updated = [...prev];
          updated[i] = { 
            ...updated[i], 
            status: success ? 'success' : 'failed',
            result: success ? { score: Math.floor(Math.random() * 100) } : { error: 'Test failed' }
          };
          return updated;
        });

        // If successful, add to agent capabilities
        if (success) {
          setAgentData(prev => ({
            ...prev,
            capabilities: [...prev.capabilities, capabilityTests[i].name]
          }));
        }
      }

      setStep('communication');
    } catch (err) {
      setError('Failed to run capability tests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setupCommunication = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setAgentData(prev => ({
        ...prev,
        communicationChannels: ['http', 'websocket', 'event-stream'],
        communicationSetupComplete: true
      }));
      
      setStep('complete');
    } catch (err) {
      setError('Failed to setup communication channels. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const finalizeOnboarding = () => {
    onComplete(agentData);
  };

  return (
    <Box maxW="800px" mx="auto" p={6}>
      <Heading mb={6}>AI Agent Onboarding</Heading>
      
      <Progress value={(
        step === 'detection' ? 20 :
        step === 'registration' ? 40 :
        step === 'capabilities' ? 60 :
        step === 'communication' ? 80 :
        100
      )} mb={8} />

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {step === 'detection' && (
        <Box>
          <Heading size="md" mb={4}>Detecting Agent Type</Heading>
          <Text mb={4}>Analyzing connection patterns and headers...</Text>
          <Progress size="sm" isIndeterminate />
        </Box>
      )}

      {step === 'registration' && (
        <Box>
          <Heading size="md" mb={4}>Agent Registration</Heading>
          <Text mb={4}>Register your AI agent with The New Fuse platform.</Text>
          
          <VStack align="start" spacing={4} mb={6}>
            <Box>
              <Text fontWeight="bold">Agent ID</Text>
              <Code p={2}>{agentData.id}</Code>
            </Box>
            
            <Box>
              <Text fontWeight="bold">Registration Endpoint</Text>
              <Code p={2}>/api/onboarding/ai-agent-registration</Code>
            </Box>
            
            <Box>
              <Text fontWeight="bold">Required Headers</Text>
              <Code p={2} display="block" whiteSpace="pre">
{`Content-Type: application/json
X-Agent-ID: ${agentData.id}
X-Agent-Type: ai_agent`}
              </Code>
            </Box>
          </VStack>
          
          <Button 
            colorScheme="blue" 
            onClick={handleRegistration}
            isLoading={loading}
          >
            Complete Registration
          </Button>
        </Box>
      )}

      {step === 'capabilities' && (
        <Box>
          <Heading size="md" mb={4}>Capability Assessment</Heading>
          <Text mb={4}>Let's test your agent's capabilities to determine what tools it can use.</Text>
          
          <VStack align="start" spacing={4} mb={6}>
            {capabilityTests.map((test, index) => (
              <HStack key={index} w="100%" justify="space-between">
                <Text>{test.name}</Text>
                <HStack>
                  {test.status === 'pending' && <Badge>Pending</Badge>}
                  {test.status === 'running' && <Badge colorScheme="blue">Running</Badge>}
                  {test.status === 'success' && (
                    <HStack>
                      <Badge colorScheme="green">Success</Badge>
                      <CheckCircleIcon color="green.500" />
                    </HStack>
                  )}
                  {test.status === 'failed' && (
                    <HStack>
                      <Badge colorScheme="red">Failed</Badge>
                      <WarningIcon color="red.500" />
                    </HStack>
                  )}
                </HStack>
              </HStack>
            ))}
          </VStack>
          
          <Button 
            colorScheme="blue" 
            onClick={runCapabilityTests}
            isLoading={loading}
            isDisabled={capabilityTests.some(test => test.status === 'running')}
          >
            Run Capability Tests
          </Button>
        </Box>
      )}

      {step === 'communication' && (
        <Box>
          <Heading size="md" mb={4}>Communication Setup</Heading>
          <Text mb={4}>Set up communication channels between your agent and The New Fuse platform.</Text>
          
          <VStack align="start" spacing={4} mb={6}>
            <Box>
              <Text fontWeight="bold">Available Channels</Text>
              <HStack mt={2}>
                <Badge colorScheme="green">HTTP</Badge>
                <Badge colorScheme="blue">WebSocket</Badge>
                <Badge colorScheme="purple">Event Stream</Badge>
              </HStack>
            </Box>
            
            <Box>
              <Text fontWeight="bold">Communication Endpoints</Text>
              <Code p={2} display="block" whiteSpace="pre">
{`HTTP: /api/agents/${agentData.id}/messages
WebSocket: ws://your-domain.com/api/agents/${agentData.id}/ws
Event Stream: /api/agents/${agentData.id}/events`}
              </Code>
            </Box>
            
            <Box>
              <Text fontWeight="bold">Authentication</Text>
              <Text>Use the agent token provided during registration for all communications.</Text>
            </Box>
          </VStack>
          
          <Button 
            colorScheme="blue" 
            onClick={setupCommunication}
            isLoading={loading}
          >
            Setup Communication Channels
          </Button>
        </Box>
      )}

      {step === 'complete' && (
        <Box>
          <Heading size="md" mb={4}>Onboarding Complete</Heading>
          <Text mb={4}>Your AI agent has been successfully onboarded to The New Fuse platform.</Text>
          
          <VStack align="start" spacing={4} mb={6}>
            <Box>
              <Text fontWeight="bold">Agent ID</Text>
              <Code p={2}>{agentData.id}</Code>
            </Box>
            
            <Box>
              <Text fontWeight="bold">Capabilities</Text>
              <HStack mt={2} flexWrap="wrap">
                {agentData.capabilities.map((cap, idx) => (
                  <Badge key={idx} colorScheme="green" m={1}>{cap}</Badge>
                ))}
              </HStack>
            </Box>
            
            <Box>
              <Text fontWeight="bold">Communication Channels</Text>
              <HStack mt={2}>
                {agentData.communicationChannels.map((channel, idx) => (
                  <Badge key={idx} colorScheme="blue">{channel}</Badge>
                ))}
              </HStack>
            </Box>
          </VStack>
          
          <Button 
            colorScheme="green" 
            onClick={finalizeOnboarding}
          >
            Start Using The New Fuse
          </Button>
        </Box>
      )}
    </Box>
  );
};
