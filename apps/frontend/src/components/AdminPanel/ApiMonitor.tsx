import React from 'react';
import {
  Box,
  Grid,
  LineChart,
  StatGroup,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading
} from '@chakra-ui/react';
import { useApiMetrics } from '../../hooks/useApiMetrics.js';

export const ApiMonitor: React.FC = () => {
  const { metrics, endpoints, errors, loading } = useApiMetrics();

  if (loading) return <Box>Loading metrics...</Box>;

  return (
    <Box>
      <StatGroup mb={6}>
        <Stat>
          <StatLabel>Total Requests</StatLabel>
          <StatNumber>{metrics.totalRequests}</StatNumber>
          <StatHelpText>Last 24 hours</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Error Rate</StatLabel>
          <StatNumber>{metrics.errorRate}%</StatNumber>
          <StatHelpText>Overall</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Avg Response Time</StatLabel>
          <StatNumber>{metrics.avgResponseTime}ms</StatNumber>
          <StatHelpText>All endpoints</StatHelpText>
        </Stat>
      </StatGroup>

      <Grid templateColumns="1fr 1fr" gap={6} mb={6}>
        <Box p={4} borderRadius="md" boxShadow="sm">
          <Heading size="sm" mb={4}>Request Volume</Heading>
          <LineChart
            data={metrics.requestsOverTime}
            xKey="timestamp"
            yKey="count"
            height={200}
          />
        </Box>
        <Box p={4} borderRadius="md" boxShadow="sm">
          <Heading size="sm" mb={4}>Response Times</Heading>
          <LineChart
            data={metrics.responseTimesOverTime}
            xKey="timestamp"
            yKey="value"
            height={200}
          />
        </Box>
      </Grid>

      <Box>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Endpoint</Th>
              <Th>Method</Th>
              <Th>Requests</Th>
              <Th>Avg Time</Th>
              <Th>Error Rate</Th>
            </Tr>
          </Thead>
          <Tbody>
            {endpoints.map(endpoint => (
              <Tr key={`${endpoint.method}-${endpoint.path}`}>
                <Td>{endpoint.path}</Td>
                <Td>{endpoint.method}</Td>
                <Td>{endpoint.requests}</Td>
                <Td>{endpoint.avgTime}ms</Td>
                <Td>{endpoint.errorRate}%</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};
