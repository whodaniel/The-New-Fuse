import {
  Badge,
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import React from 'react';
import { useParams } from 'react-router-dom';

interface MemoryInspectorProps {
  agentId?: string;
}

/**
 * Memory Inspector - View agent memory and context
 */
const MemoryInspector: React.FC<MemoryInspectorProps> = ({ agentId: propAgentId }) => {
  const { agentId: paramAgentId } = useParams();
  const agentId = propAgentId || paramAgentId || 'default';

  return (
    <Box p={6}>
      <VStack align="start" spacing={6}>
        <Box>
          <Heading size="lg" mb={2}>
            Memory Inspector
          </Heading>
          <Text color="gray.600">Agent ID: {agentId}</Text>
        </Box>

        <Card w="full">
          <CardHeader>
            <Heading size="md">Memory Context</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="start" spacing={4}>
              <Text color="gray.600">No memory entries found for this agent.</Text>
              <HStack>
                <Badge colorScheme="blue">Short-term Memory</Badge>
                <Badge colorScheme="purple">Long-term Memory</Badge>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default MemoryInspector;
