import { useState } from 'react';

import {
  Badge,
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Container,
  Flex,
  Heading,
  Icon,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { FiActivity, FiArrowLeft, FiChevronRight, FiCpu, FiLayers } from 'react-icons/fi';

// Temporary type fix for react-icons in strict mode
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FiArrowLeftFixed = FiArrowLeft as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FiChevronRightFixed = FiChevronRight as any;

import AgentFlowViewer from './components/AgentFlowViewer.js';
import ServiceMapViewer from './components/ServiceMapViewer.js';
import SystemKnowledgeMap from './components/SystemKnowledgeMap.js';

function App() {
  const [view, setView] = useState('dashboard'); // dashboard | agent-flow | knowledge-map | service-map

  const renderView = () => {
    switch (view) {
      case 'agent-flow':
        return <AgentFlowViewer />;
      case 'knowledge-map':
        return <SystemKnowledgeMap />;
      case 'service-map':
        return <ServiceMapViewer />;
      default:
        return (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
            <Card _hover={{ transform: 'translateY(-5px)', shadow: 'lg' }} transition="all 0.2s">
              <CardHeader pb={0}>
                <Flex align="center" justify="space-between">
                  <Icon as={FiActivity} boxSize={8} color="green.500" />
                  <Badge colorScheme="green">Live</Badge>
                </Flex>
              </CardHeader>
              <CardBody>
                <Heading size="md" mb={2}>
                  Agent Flow
                </Heading>
                <Text color="gray.600">
                  Real-time network graph of agent communication and message passing.
                </Text>
              </CardBody>
              <CardFooter>
                <Button colorScheme="blue" width="full" onClick={() => setView('agent-flow')}>
                  View Live Graph
                </Button>
              </CardFooter>
            </Card>

            <Card _hover={{ transform: 'translateY(-5px)', shadow: 'lg' }} transition="all 0.2s">
              <CardHeader pb={0}>
                <Flex align="center" justify="space-between">
                  <Icon as={FiLayers} boxSize={8} color="purple.500" />
                  <Badge colorScheme="purple">Active</Badge>
                </Flex>
              </CardHeader>
              <CardBody>
                <Heading size="md" mb={2}>
                  Knowledge Map
                </Heading>
                <Text color="gray.600">
                  Ontological map of system concepts, anchors, and primitives.
                </Text>
              </CardBody>
              <CardFooter>
                <Button colorScheme="purple" width="full" onClick={() => setView('knowledge-map')}>
                  Explore Ontology
                </Button>
              </CardFooter>
            </Card>

            <Card _hover={{ transform: 'translateY(-5px)', shadow: 'lg' }} transition="all 0.2s">
              <CardHeader pb={0}>
                <Flex align="center" justify="space-between">
                  <Icon as={FiCpu} boxSize={8} color="orange.500" />
                  <Badge colorScheme="orange">Beta</Badge>
                </Flex>
              </CardHeader>
              <CardBody>
                <Heading size="md" mb={2}>
                  Service Map
                </Heading>
                <Text color="gray.600">
                  Hierarchical view of all microservices and their resource usage.
                </Text>
              </CardBody>
              <CardFooter>
                <Button
                  colorScheme="orange"
                  variant="outline"
                  width="full"
                  onClick={() => setView('service-map')}
                >
                  Monitor Services
                </Button>
              </CardFooter>
            </Card>
          </SimpleGrid>
        );
    }
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <Box bgGradient="linear(to-r, blue.600, purple.600)" color="white" py={8} mb={8}>
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <Box>
              <Heading as="h1" size="xl" mb={2}>
                Visualization Hub
              </Heading>
              <Text fontSize="lg" opacity={0.9}>
                Central intelligence for The New Fuse agent ecosystem
              </Text>
            </Box>
            {view !== 'dashboard' && (
              <Button
                leftIcon={<FiArrowLeftFixed />}
                onClick={() => setView('dashboard')}
                variant="solid"
                bg="whiteAlpha.300"
                _hover={{ bg: 'whiteAlpha.400' }}
                color="white"
              >
                Back to Dashboard
              </Button>
            )}
          </Flex>

          {view !== 'dashboard' && (
            <Breadcrumb
              spacing="8px"
              separator={<FiChevronRightFixed color="gray.300" />}
              mt={4}
              fontSize="sm"
            >
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => setView('dashboard')} cursor="pointer">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem isCurrentPage>
                <BreadcrumbLink color="white" fontWeight="bold">
                  {view.replace('-', ' ').toUpperCase()}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
          )}
        </Container>
      </Box>

      <Container maxW="container.xl">{renderView()}</Container>
    </Box>
  );
}

export default App;
