import React from 'react';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { GreeterAgent } from '../GreeterAgent.js';
import { useWizard } from '../WizardProvider.js';

export const GreeterAgentStep: React.FC = () => {
  const { state } = useWizard();
  const userName = state.session?.data?.name || 'there';

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading as="h2" size="md" mb={2}>
            Meet Your AI Assistant
          </Heading>
          <Text mb={4}>
            This is your AI assistant for The New Fuse platform. You can ask questions, get help, and learn more about the platform.
          </Text>
        </Box>
        
        <GreeterAgent 
          initialMessage={`Hello ${userName}! I'm your AI assistant for The New Fuse platform. I can help you get started and answer any questions you might have. What would you like to know about The New Fuse?`}
          agentName="Fuse Assistant"
        />
        
        <Box>
          <Text fontSize="sm" color="gray.600">
            This assistant uses Retrieval Augmented Generation (RAG) to provide accurate and helpful information about The New Fuse platform. It has access to the latest documentation and can help you with any questions you might have.
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};
