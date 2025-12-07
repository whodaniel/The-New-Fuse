import {
  Badge,
  Box,
  Card,
  CardBody,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import React from 'react';
import { FiAlertTriangle, FiCheckCircle, FiLock, FiShield } from 'react-icons/fi';

/**
 * Security Dashboard - Displays security status and metrics
 */
const SecurityDashboard: React.FC = () => {
  return (
    <Box p={6}>
      <VStack align="start" spacing={6}>
        <Box>
          <Heading size="lg" mb={2}>
            Security Dashboard
          </Heading>
          <Text color="gray.600">Monitor and manage platform security</Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6} w="full">
          <Card>
            <CardBody>
              <HStack spacing={4}>
                <Icon as={FiShield} boxSize={8} color="green.500" />
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold">
                    Secure
                  </Text>
                  <Text color="gray.600" fontSize="sm">
                    System Status
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <HStack spacing={4}>
                <Icon as={FiLock} boxSize={8} color="blue.500" />
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold">
                    256-bit
                  </Text>
                  <Text color="gray.600" fontSize="sm">
                    Encryption
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <HStack spacing={4}>
                <Icon as={FiAlertTriangle} boxSize={8} color="yellow.500" />
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold">
                    0
                  </Text>
                  <Text color="gray.600" fontSize="sm">
                    Active Threats
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <HStack spacing={4}>
                <Icon as={FiCheckCircle} boxSize={8} color="green.500" />
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold">
                    100%
                  </Text>
                  <Text color="gray.600" fontSize="sm">
                    Compliance
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card w="full">
          <CardBody>
            <VStack align="start" spacing={4}>
              <Heading size="md">Security Overview</Heading>
              <Text color="gray.600">
                All systems are operating normally. No security incidents detected in the last 24
                hours.
              </Text>
              <HStack spacing={2}>
                <Badge colorScheme="green">All Clear</Badge>
                <Badge colorScheme="blue">Monitoring Active</Badge>
                <Badge colorScheme="purple">Firewall Enabled</Badge>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default SecurityDashboard;
