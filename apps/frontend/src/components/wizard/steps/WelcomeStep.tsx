import React from 'react';
import { Box, Heading, Text, Image, VStack, HStack, Icon } from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { useWizard } from '../WizardProvider.js';

export const WelcomeStep: React.FC = () => {
  const { state } = useWizard();
  const isAIAgent = state.session?.userType === 'ai_agent';

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Image 
            src="/assets/images/logo.png" 
            alt="The New Fuse Logo" 
            maxH="100px" 
            mx="auto" 
            mb={4}
          />
          <Heading as="h1" size="xl" mb={2}>
            {isAIAgent 
              ? 'Welcome to The New Fuse Agent Network' 
              : 'Welcome to The New Fuse'}
          </Heading>
          <Text fontSize="lg" color="gray.600">
            {isAIAgent
              ? 'This wizard will guide you through the process of integrating with our AI agent network.'
              : 'This wizard will guide you through the setup process to get you started quickly.'}
          </Text>
        </Box>

        <Box bg="blue.50" p={6} borderRadius="md">
          <Heading as="h2" size="md" mb={4} color="blue.700">
            {isAIAgent ? 'Agent Integration Benefits' : 'Key Features'}
          </Heading>
          
          <VStack align="start" spacing={3}>
            {isAIAgent ? (
              // AI Agent benefits
              <>
                <HStack>
                  <Icon as={CheckCircleIcon} color="green.500" />
                  <Text>Seamless communication with other AI agents</Text>
                </HStack>
                <HStack>
                  <Icon as={CheckCircleIcon} color="green.500" />
                  <Text>Access to powerful tools and capabilities</Text>
                </HStack>
                <HStack>
                  <Icon as={CheckCircleIcon} color="green.500" />
                  <Text>Standardized protocols for agent interaction</Text>
                </HStack>
                <HStack>
                  <Icon as={CheckCircleIcon} color="green.500" />
                  <Text>Secure and reliable message exchange</Text>
                </HStack>
              </>
            ) : (
              // Human user features
              <>
                <HStack>
                  <Icon as={CheckCircleIcon} color="green.500" />
                  <Text>Create and manage AI agent workflows</Text>
                </HStack>
                <HStack>
                  <Icon as={CheckCircleIcon} color="green.500" />
                  <Text>Seamless integration with development environments</Text>
                </HStack>
                <HStack>
                  <Icon as={CheckCircleIcon} color="green.500" />
                  <Text>Powerful tools for AI agent collaboration</Text>
                </HStack>
                <HStack>
                  <Icon as={CheckCircleIcon} color="green.500" />
                  <Text>Intuitive interface for managing complex AI systems</Text>
                </HStack>
              </>
            )}
          </VStack>
        </Box>

        <Box>
          <Heading as="h2" size="md" mb={3}>
            {isAIAgent ? 'Integration Process' : 'Getting Started'}
          </Heading>
          <Text>
            {isAIAgent
              ? 'This wizard will guide you through the following steps to integrate with The New Fuse platform:'
              : 'This wizard will guide you through the following steps to set up your account:'}
          </Text>
          <VStack align="start" mt={3} spacing={2} pl={4}>
            {isAIAgent ? (
              // AI Agent steps
              <>
                <Text>1. Configure your agent profile</Text>
                <Text>2. Define your agent capabilities</Text>
                <Text>3. Set up communication channels</Text>
                <Text>4. Complete integration</Text>
              </>
            ) : (
              // Human user steps
              <>
                <Text>1. Set up your user profile</Text>
                <Text>2. Configure your AI preferences</Text>
                <Text>3. Create your first workspace</Text>
                <Text>4. Select tools and integrations</Text>
                <Text>5. Meet your AI assistant</Text>
              </>
            )}
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};
