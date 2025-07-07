import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Button, 
  Text, 
  Box, 
  Container, 
  Heading, 
  VStack, 
  HStack, 
  Grid, 
  GridItem, 
  Icon, 
  Stack, 
  Flex, 
  Spacer,
  useColorModeValue,
  Badge,
  SimpleGrid
} from '@chakra-ui/react';
import { FaRocket, FaUsers, FaCog, FaChartLine, FaBrain, FaShieldAlt } from 'react-icons/fa';

export const Landing: React.FC = () => {
  const bgGradient = useColorModeValue('linear(to-br, blue.50, purple.50)', 'linear(to-br, gray.900, purple.900)');
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <Box minH="100vh" bgGradient={bgGradient}>
      {/* Navigation Header */}
      <Box as="nav" w="full" px={8} py={6} borderBottom="1px" borderColor="gray.200">
        <Container maxW="7xl">
          <Flex align="center" justify="space-between">
            <HStack spacing={3}>
              <Box w={10} h={10} bg="blue.500" rounded="lg" display="flex" alignItems="center" justifyContent="center">
                <Icon as={FaBrain} color="white" boxSize={5} />
              </Box>
              <Heading size="lg" color={textColor} fontWeight="bold">
                The New Fuse
              </Heading>
            </HStack>
            
            <HStack spacing={6}>
              <Link to="#features">
                <Text color={subTextColor} _hover={{ color: textColor }} cursor="pointer">Features</Text>
              </Link>
              <Link to="/agents">
                <Text color={subTextColor} _hover={{ color: textColor }} cursor="pointer">AI Agents</Text>
              </Link>
              <Link to="/workflows">
                <Text color={subTextColor} _hover={{ color: textColor }} cursor="pointer">Workflows</Text>
              </Link>
              <Link to="/analytics">
                <Text color={subTextColor} _hover={{ color: textColor }} cursor="pointer">Analytics</Text>
              </Link>
              <Link to="/login">
                <Text color={subTextColor} _hover={{ color: textColor }} cursor="pointer">Sign In</Text>
              </Link>
              <Link to="/register">
                <Button colorScheme="blue" size="md" rounded="lg">
                  Get Started Free
                </Button>
              </Link>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container maxW="7xl" py={{ base: 20, md: 28 }}>
        <VStack spacing={8} textAlign="center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge colorScheme="blue" px={4} py={2} rounded="full" fontSize="sm" mb={6}>
              🚀 AI-Powered Collaboration Platform
            </Badge>
            <Heading 
              size="2xl" 
              color={textColor} 
              lineHeight="shorter"
              maxW="4xl"
              mx="auto"
            >
              Unify, Orchestrate, and Scale
              <Text as="span" color="blue.500" display="block">
                AI Agents & Workflows
              </Text>
            </Heading>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Text 
              fontSize={{ base: 'lg', md: 'xl' }} 
              color={subTextColor} 
              maxW="2xl" 
              mx="auto"
              lineHeight="tall"
            >
              Seamlessly connect and coordinate multiple AI agents for complex, multi-step workflows. 
              Built for scale, reliability, and compliance—trusted by leading organizations.
            </Text>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Stack direction={{ base: 'column', sm: 'row' }} spacing={4} pt={4}>
              <Link to="/register">
                <Button 
                  size="lg" 
                  colorScheme="blue" 
                  px={8} 
                  py={6} 
                  fontSize="lg"
                  rounded="xl"
                  _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
                  transition="all 0.2s"
                >
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/login">
                <Button 
                  size="lg" 
                  variant="outline" 
                  px={8} 
                  py={6} 
                  fontSize="lg"
                  rounded="xl"
                  _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                  transition="all 0.2s"
                >
                  Sign In
                </Button>
              </Link>
            </Stack>
          </motion.div>
        </VStack>
      </Container>

      {/* Features Section */}
      <Box id="features" py={20} bg={useColorModeValue('white', 'gray.800')}>
        <Container maxW="7xl">
          <VStack spacing={16}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <VStack spacing={4} textAlign="center">
                <Heading size="xl" color={textColor}>
                  Everything You Need for AI Collaboration
                </Heading>
                <Text fontSize="lg" color={subTextColor} maxW="2xl">
                  Powerful features designed to streamline AI agent orchestration and workflow management
                </Text>
              </VStack>
            </motion.div>
            
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} w="full">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <VStack 
                    spacing={4} 
                    p={8} 
                    bg={useColorModeValue('gray.50', 'gray.700')} 
                    rounded="2xl"
                    border="1px"
                    borderColor={useColorModeValue('gray.200', 'gray.600')}
                    _hover={{ 
                      transform: 'translateY(-4px)', 
                      shadow: 'xl',
                      borderColor: 'blue.300'
                    }}
                    transition="all 0.2s"
                    cursor="pointer"
                    align="start"
                  >
                    <Box p={3} bg="blue.500" rounded="xl">
                      <Icon as={feature.icon} boxSize={6} color="white" />
                    </Box>
                    <VStack align="start" spacing={2}>
                      <Heading size="md" color={textColor}>
                        {feature.title}
                      </Heading>
                      <Text color={subTextColor} lineHeight="relaxed">
                        {feature.description}
                      </Text>
                    </VStack>
                  </VStack>
                </motion.div>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Call to Action Section */}
      <Box py={20} bg="blue.500" color="white" textAlign="center">
        <Container maxW="4xl">
          <VStack spacing={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Heading size="xl" mb={4}>
                Ready to Transform Your AI Workflows?
              </Heading>
              <Text fontSize="lg" opacity={0.9} maxW="2xl">
                Join thousands of organizations already using The New Fuse to orchestrate their AI operations.
              </Text>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Stack direction={{ base: 'column', sm: 'row' }} spacing={4}>
                <Link to="/register">
                  <Button 
                    size="lg" 
                    bg="white" 
                    color="blue.500" 
                    px={8} 
                    py={6} 
                    fontSize="lg"
                    rounded="xl"
                    _hover={{ bg: 'gray.100', transform: 'translateY(-2px)' }}
                    transition="all 0.2s"
                  >
                    Start Your Free Trial
                  </Button>
                </Link>
                <Link to="/login">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    borderColor="white" 
                    color="white"
                    px={8} 
                    py={6} 
                    fontSize="lg"
                    rounded="xl"
                    _hover={{ bg: 'whiteAlpha.200', transform: 'translateY(-2px)' }}
                    transition="all 0.2s"
                  >
                    Contact Sales
                  </Button>
                </Link>
              </Stack>
            </motion.div>
          </VStack>
        </Container>
      </Box>

      {/* Footer */}
      <Box as="footer" bg={useColorModeValue('gray.50', 'gray.900')} borderTop="1px" borderColor={useColorModeValue('gray.200', 'gray.700')}>
        <Container maxW="7xl" py={12}>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={8}>
            <GridItem>
              <VStack align="start" spacing={4}>
                <HStack>
                  <Box w={8} h={8} bg="blue.500" rounded="lg" display="flex" alignItems="center" justifyContent="center">
                    <Icon as={FaBrain} color="white" boxSize={4} />
                  </Box>
                  <Heading size="md" color={textColor}>
                    The New Fuse
                  </Heading>
                </HStack>
                <Text color={subTextColor} fontSize="sm">
                  Orchestrate, automate, and scale AI-driven workflows with world-class agent collaboration.
                </Text>
              </VStack>
            </GridItem>
            
            <GridItem>
              <VStack align="start" spacing={3}>
                <Heading size="sm" color={textColor} mb={2}>Product</Heading>
                <Link to="/dashboard"><Text color={subTextColor} fontSize="sm" _hover={{ color: textColor }}>Dashboard</Text></Link>
                <Link to="/agents"><Text color={subTextColor} fontSize="sm" _hover={{ color: textColor }}>AI Agents</Text></Link>
                <Link to="/workflows"><Text color={subTextColor} fontSize="sm" _hover={{ color: textColor }}>Workflows</Text></Link>
                <Link to="/analytics"><Text color={subTextColor} fontSize="sm" _hover={{ color: textColor }}>Analytics</Text></Link>
                <Link to="/settings"><Text color={subTextColor} fontSize="sm" _hover={{ color: textColor }}>Settings</Text></Link>
              </VStack>
            </GridItem>
            
            <GridItem>
              <VStack align="start" spacing={3}>
                <Heading size="sm" color={textColor} mb={2}>Company</Heading>
                <Text color={subTextColor} fontSize="sm" _hover={{ color: textColor }} cursor="pointer">About</Text>
                <Text color={subTextColor} fontSize="sm" _hover={{ color: textColor }} cursor="pointer">Careers</Text>
                <Text color={subTextColor} fontSize="sm" _hover={{ color: textColor }} cursor="pointer">Blog</Text>
                <Text color={subTextColor} fontSize="sm" _hover={{ color: textColor }} cursor="pointer">Contact</Text>
              </VStack>
            </GridItem>
            
            <GridItem>
              <VStack align="start" spacing={3}>
                <Heading size="sm" color={textColor} mb={2}>Support</Heading>
                <Text color={subTextColor} fontSize="sm" _hover={{ color: textColor }} cursor="pointer">Help Center</Text>
                <Text color={subTextColor} fontSize="sm" _hover={{ color: textColor }} cursor="pointer">Documentation</Text>
                <Link to="/legal/privacy"><Text color={subTextColor} fontSize="sm" _hover={{ color: textColor }}>Privacy Policy</Text></Link>
                <Link to="/legal/terms"><Text color={subTextColor} fontSize="sm" _hover={{ color: textColor }}>Terms of Service</Text></Link>
              </VStack>
            </GridItem>
          </Grid>
          
          <Box borderTop="1px" borderColor={useColorModeValue('gray.200', 'gray.700')} mt={8} pt={8}>
            <Text textAlign="center" color={subTextColor} fontSize="sm">
              © 2024 The New Fuse. All rights reserved.
            </Text>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

const features = [
  {
    title: 'Agent Collaboration',
    description: 'Seamlessly connect and coordinate multiple AI agents for complex, multi-step workflows with intelligent task distribution.',
    icon: FaUsers,
  },
  {
    title: 'Secure Integrations',
    description: 'Integrate with APIs, databases, and cloud services using robust security controls and enterprise-grade permissions.',
    icon: FaShieldAlt,
  },
  {
    title: 'Extensible Platform',
    description: 'Plug in new agents, tools, and modules with a modular architecture designed for rapid innovation and customization.',
    icon: FaCog,
  },
  {
    title: 'Real-Time Monitoring',
    description: 'Visualize agent activity, workflow status, and system health with advanced dashboards and intelligent alerts.',
    icon: FaChartLine,
  },
  {
    title: 'AI-Powered Automation',
    description: 'Leverage advanced AI to automate complex processes, optimize workflows, and make intelligent decisions at scale.',
    icon: FaBrain,
  },
  {
    title: 'Enterprise-Ready',
    description: 'Built for scale, reliability, and compliance. Trusted by leading organizations for mission-critical AI operations.',
    icon: FaRocket,
  },
];

export default Landing;