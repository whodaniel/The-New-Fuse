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
const FiArrowLeftFixed = FiArrowLeft as any;
const FiChevronRightFixed = FiChevronRight as any;

import AgentFlowViewer from './components/AgentFlowViewer';

function App() {
  const [view, setView] = useState('dashboard'); // dashboard | agent-flow

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
                  {view === 'agent-flow' ? 'Agent Flow' : view}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
          )}
        </Container>
      </Box>

      <Container maxW="container.xl">
        {view === 'dashboard' ? (
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
                  <Badge colorScheme="purple">Static</Badge>
                </Flex>
              </CardHeader>
              <CardBody>
                <Heading size="md" mb={2}>
                  Service Map
                </Heading>
                <Text color="gray.600">
                  Hierarchical treemap of all microservices and their resource usage.
                </Text>
              </CardBody>
              <CardFooter>
                <Button colorScheme="blue" variant="outline" width="full">
                  Explore
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
                  Workflow Monitor
                </Heading>
                <Text color="gray.600">
                  Track status and performance of active autonomous workflows.
                </Text>
              </CardBody>
              <CardFooter>
                <Button colorScheme="blue" variant="outline" width="full">
                  Monitor
                </Button>
              </CardFooter>
            </Card>
          </SimpleGrid>
        ) : (
          view === 'agent-flow' && <AgentFlowViewer />
        )}
      </Container>
    </Box>
  );
}

export default App;
