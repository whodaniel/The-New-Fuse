import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  VStack,
} from '@chakra-ui/react';
import React from 'react';
import { FiActivity, FiCpu, FiDatabase, FiUsers } from 'react-icons/fi';

/**
 * Metrics Dashboard - System performance and metrics
 */
const MetricsDashboard: React.FC = () => {
  return (
    <Box p={6}>
      <VStack align="start" spacing={6}>
        <Box>
          <Heading size="lg" mb={2}>
            Metrics Dashboard
          </Heading>
          <Text color="gray.600">Monitor system performance and usage metrics</Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6} w="full">
          <Card>
            <CardBody>
              <HStack spacing={4}>
                <Icon as={FiActivity} boxSize={8} color="green.500" />
                <Stat>
                  <StatLabel>Active Users</StatLabel>
                  <StatNumber>1,234</StatNumber>
                  <StatHelpText>+12% from last month</StatHelpText>
                </Stat>
              </HStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <HStack spacing={4}>
                <Icon as={FiCpu} boxSize={8} color="blue.500" />
                <Stat>
                  <StatLabel>CPU Usage</StatLabel>
                  <StatNumber>45%</StatNumber>
                  <StatHelpText>Normal</StatHelpText>
                </Stat>
              </HStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <HStack spacing={4}>
                <Icon as={FiDatabase} boxSize={8} color="purple.500" />
                <Stat>
                  <StatLabel>Database Size</StatLabel>
                  <StatNumber>2.4 GB</StatNumber>
                  <StatHelpText>75% capacity</StatHelpText>
                </Stat>
              </HStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <HStack spacing={4}>
                <Icon as={FiUsers} boxSize={8} color="orange.500" />
                <Stat>
                  <StatLabel>API Requests</StatLabel>
                  <StatNumber>50K</StatNumber>
                  <StatHelpText>Last 24 hours</StatHelpText>
                </Stat>
              </HStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card w="full">
          <CardHeader>
            <Heading size="md">System Health</Heading>
          </CardHeader>
          <CardBody>
            <Text color="gray.600">All systems are operating normally. No issues detected.</Text>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default MetricsDashboard;
