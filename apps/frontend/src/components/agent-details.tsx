import React from 'react';
import { VStack, HStack, Text, Box, } from '@chakra-ui/layout';
import { Avatar } from '@chakra-ui/avatar';
import { Progress } from '@chakra-ui/progress';
const AgentDetails = ({ name, status, avatar, performance, capabilities, model, }) => {
    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'active':
                return 'green.500';
            case 'idle':
                return 'yellow.500';
            case 'offline':
                return 'gray.500';
            default:
                return 'gray.500';
        }
    };
    const getPerformanceColor = (performance) => {
        if (performance >= 80)
            return 'green';
        if (performance >= 60)
            return 'yellow';
        return 'red';
    };
    return (<VStack gap={4} alignItems="stretch">
      <HStack gap={4}>
        <Avatar size="lg" name={name} src={avatar}/>
        <VStack alignItems="flex-start" gap={1}>
          <Text fontWeight="bold" fontSize="lg">
            {name}
          </Text>
          <Text color={getStatusColor(status)} fontSize="sm">
            {status}
          </Text>
        </VStack>
      </HStack>

      <Box>
        <Text fontSize="sm" mb={1}>
          Performance
        </Text>
        <Progress value={performance} colorScheme={getPerformanceColor(performance)} size="sm" borderRadius="full"/>
      </Box>

      <Box>
        <Text fontSize="sm" mb={2}>
          Capabilities
        </Text>
        <HStack flexWrap="wrap" gap={2}>
          {capabilities.map((capability) => (<Text key={capability} fontSize="xs" bg="gray.100" px={2} py={1} borderRadius="full">
              {capability}
            </Text>))}
        </HStack>
      </Box>

      <Box>
        <Text fontSize="sm" mb={1}>
          Model
        </Text>
        <Text fontSize="xs" color="gray.600">
          {model}
        </Text>
      </Box>
    </VStack>);
};
export default AgentDetails;
//# sourceMappingURL=agent-details.js.map