import { Badge, Box, Flex, Text } from '@chakra-ui/react';
import React from 'react';
import { GlassCard } from './ui/premium/GlassCard';

export const NetworkTopology: React.FC = () => {
  // Point to the dedicated visualization hub app
  const vizUrl =
    (import.meta.env.VITE_VIZ_HUB_URL as string) ||
    (window.location.hostname === 'localhost' ? 'http://localhost:5173' : '/visualizations/hub');

  return (
    <GlassCard className="p-0 overflow-hidden">
      <Box p={4} borderBottom="1px solid" borderColor="whiteAlpha.100">
        <Flex justify="space-between" align="center">
          <Text fontWeight="bold" fontSize="lg">
            Agent Mesh Topology
          </Text>
          <Badge colorScheme="green" variant="subtle">
            Live Sync
          </Badge>
        </Flex>
        <Text fontSize="xs" color="gray.400" mt={1}>
          Real-time visualization of agent relationships and communication links
        </Text>
      </Box>
      <Box h="600px" w="100%" bg="gray.900">
        <iframe
          src={vizUrl}
          title="TNF Agent Mesh Visualizer"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
        />
      </Box>
    </GlassCard>
  );
};

export default NetworkTopology;
