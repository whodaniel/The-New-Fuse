import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Grid,
  GridItem,
  Image,
  Badge
} from '@chakra-ui/react';

export default function Landing() {
  return (
    <Box>
      {/* Navigation */}
      <Box as="nav" bg="white" shadow="sm" py={4}>
        <Container maxW="7xl">
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
              <Image boxSize="40px" src="/logo.png" alt="The New Fuse" fallback={<Box w="40px" h="40px" bg="blue.500" borderRadius="md" />} />
              <Heading size="lg" color="blue.600">The New Fuse</Heading>
            </HStack>
            
            <HStack spacing={6} display={{ base: "none", md: "flex" }}>
              <Link to="/#features">
                <Text color="gray.600" _hover={{ color: "blue.600" }} transition="colors">Features</Text>
              </Link>
              <Link to="/agents">
                <Text color="gray.600" _hover={{ color: "blue.600" }} transition="colors">AI Agents</Text>
              </Link>
              <Link to="/workflows">
                <Text color="gray.600" _hover={{ color: "blue.600" }} transition="colors">Workflows</Text>
              </Link>
              <Link to="/analytics">
                <Text color="gray.600" _hover={{ color: "blue.600" }} transition="colors">Analytics</Text>
              </Link>
            </HStack>
            
            <HStack spacing={3}>
              <Button as={Link} to="/login" variant="outline" colorScheme="gray">
                Sign In
              </Button>
              <Button as={Link} to="/register" colorScheme="blue">
                Get Started Free
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box bg="gray.50" py={20}>
        <Container maxW="6xl" textAlign="center">
          <Badge colorScheme="blue" fontSize="sm" px={3} py={1} borderRadius="full" mb={6}>
            🚀 AI-Powered Collaboration Platform
          </Badge>
          
          <VStack spacing={6}>
            <Heading
              size="3xl"
              fontWeight="bold"
              lineHeight="shorter"
              color="gray.900"
            >
              Unify, Orchestrate, and Scale
              <br />
              <Text as="span" color="blue.500">AI Agents & Workflows</Text>
            </Heading>
            
            <Text
              fontSize="xl"
              color="gray.600"
              maxW="3xl"
              lineHeight="tall"
            >
              Seamlessly connect and coordinate multiple AI agents for complex, multi-step workflows. 
              Built for scale, reliability, and compliance—trusted by leading organizations.
            </Text>
            
            <HStack spacing={4}>
              <Button as={Link} to="/register" size="lg" colorScheme="blue">
                Start Free Trial
              </Button>
              <Button as={Link} to="/login" size="lg" variant="outline">
                Sign In
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box id="features" py={20}>
        <Container maxW="6xl">
          <VStack spacing={12}>
            <VStack spacing={4} textAlign="center">
              <Heading size="xl" color="gray.900">
                Everything You Need for AI Collaboration
              </Heading>
              <Text fontSize="lg" color="gray.600">
                Powerful features designed to streamline AI agent orchestration and workflow management
              </Text>
            </VStack>
            
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={8}>
              <GridItem>
                <VStack spacing={4} p={6} bg="white" borderRadius="lg" shadow="md">
                  <Box fontSize="4xl">🤖</Box>
                  <Heading size="md">Agent Collaboration</Heading>
                  <Text textAlign="center" color="gray.600">
                    Seamlessly connect and coordinate multiple AI agents for complex, multi-step workflows with intelligent task distribution.
                  </Text>
                </VStack>
              </GridItem>
              
              <GridItem>
                <VStack spacing={4} p={6} bg="white" borderRadius="lg" shadow="md">
                  <Box fontSize="4xl">🔒</Box>
                  <Heading size="md">Secure Integrations</Heading>
                  <Text textAlign="center" color="gray.600">
                    Integrate with APIs, databases, and cloud services using robust security controls and enterprise-grade permissions.
                  </Text>
                </VStack>
              </GridItem>
              
              <GridItem>
                <VStack spacing={4} p={6} bg="white" borderRadius="lg" shadow="md">
                  <Box fontSize="4xl">🔧</Box>
                  <Heading size="md">Extensible Platform</Heading>
                  <Text textAlign="center" color="gray.600">
                    Plug in new agents, tools, and modules with a modular architecture designed for rapid innovation and customization.
                  </Text>
                </VStack>
              </GridItem>
              
              <GridItem>
                <VStack spacing={4} p={6} bg="white" borderRadius="lg" shadow="md">
                  <Box fontSize="4xl">📊</Box>
                  <Heading size="md">Real-Time Monitoring</Heading>
                  <Text textAlign="center" color="gray.600">
                    Visualize agent activity, workflow status, and system health with advanced dashboards and intelligent alerts.
                  </Text>
                </VStack>
              </GridItem>
              
              <GridItem>
                <VStack spacing={4} p={6} bg="white" borderRadius="lg" shadow="md">
                  <Box fontSize="4xl">⚡</Box>
                  <Heading size="md">AI-Powered Automation</Heading>
                  <Text textAlign="center" color="gray.600">
                    Leverage advanced AI to automate complex processes, optimize workflows, and make intelligent decisions at scale.
                  </Text>
                </VStack>
              </GridItem>
              
              <GridItem>
                <VStack spacing={4} p={6} bg="white" borderRadius="lg" shadow="md">
                  <Box fontSize="4xl">🏢</Box>
                  <Heading size="md">Enterprise-Ready</Heading>
                  <Text textAlign="center" color="gray.600">
                    Built for scale, reliability, and compliance. Trusted by leading organizations for mission-critical AI operations.
                  </Text>
                </VStack>
              </GridItem>
            </Grid>
          </VStack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box bg="blue.600" py={20}>
        <Container maxW="4xl" textAlign="center">
          <VStack spacing={6} color="white">
            <Heading size="xl">
              Ready to Transform Your AI Workflows?
            </Heading>
            <Text fontSize="lg">
              Join thousands of organizations already using The New Fuse to orchestrate their AI operations.
            </Text>
            <HStack spacing={4}>
              <Button as={Link} to="/register" size="lg" bg="white" color="blue.600" _hover={{ bg: "gray.100" }}>
                Start Your Free Trial
              </Button>
              <Button as={Link} to="/login" size="lg" variant="outline" borderColor="white" color="white" _hover={{ bg: "white", color: "blue.600" }}>
                Contact Sales
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Footer */}
      <Box bg="gray.900" py={12}>
        <Container maxW="6xl">
          <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={8}>
            <GridItem colSpan={{ base: 1, md: 2 }}>
              <VStack align="start" spacing={4}>
                <HStack>
                  <Image boxSize="32px" src="/logo.png" alt="The New Fuse" fallback={<Box w="32px" h="32px" bg="blue.500" borderRadius="md" />} />
                  <Heading size="md" color="white">The New Fuse</Heading>
                </HStack>
                <Text color="gray.400">
                  Orchestrate, automate, and scale AI-driven workflows with world-class agent collaboration.
                </Text>
              </VStack>
            </GridItem>
            
            <GridItem>
              <VStack align="start" spacing={3}>
                <Heading size="sm" color="white">Product</Heading>
                <Link to="/dashboard"><Text color="gray.400" _hover={{ color: "white" }}>Dashboard</Text></Link>
                <Link to="/agents"><Text color="gray.400" _hover={{ color: "white" }}>AI Agents</Text></Link>
                <Link to="/workflows"><Text color="gray.400" _hover={{ color: "white" }}>Workflows</Text></Link>
                <Link to="/analytics"><Text color="gray.400" _hover={{ color: "white" }}>Analytics</Text></Link>
                <Link to="/settings"><Text color="gray.400" _hover={{ color: "white" }}>Settings</Text></Link>
              </VStack>
            </GridItem>
            
            <GridItem>
              <VStack align="start" spacing={3}>
                <Heading size="sm" color="white">Support</Heading>
                <Text color="gray.400">Help Center</Text>
                <Text color="gray.400">Documentation</Text>
                <Link to="/legal/privacy"><Text color="gray.400" _hover={{ color: "white" }}>Privacy Policy</Text></Link>
                <Link to="/legal/terms"><Text color="gray.400" _hover={{ color: "white" }}>Terms of Service</Text></Link>
              </VStack>
            </GridItem>
          </Grid>
          
          <Box pt={8} mt={8} borderTop="1px" borderColor="gray.700" textAlign="center">
            <Text color="gray.400">© 2024 The New Fuse. All rights reserved.</Text>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
