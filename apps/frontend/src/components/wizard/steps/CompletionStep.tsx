import React from 'react';
import { 
  Box, 
  VStack, 
  Heading, 
  Text, 
  Icon, 
  SimpleGrid, 
  Card, 
  CardBody, 
  CardHeader,
  HStack,
  Button,
  Link
} from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import { FiHome, FiSettings, FiUsers, FiCode, FiBook, FiMessageSquare } from 'react-icons/fi';
import { useWizard } from '../WizardProvider.js';

export const CompletionStep: React.FC = () => {
  const { state } = useWizard();
  const isAIAgent = state.session?.userType === 'ai_agent';
  const userName = state.session?.data?.name || 'User';
  
  const humanNextSteps = [
    {
      title: 'Explore Dashboard',
      icon: FiHome,
      description: 'Get familiar with your dashboard and navigation',
      link: '/dashboard'
    },
    {
      title: 'Configure Workspace',
      icon: FiSettings,
      description: 'Customize your workspace settings',
      link: '/workspace/settings'
    },
    {
      title: 'Invite Team Members',
      icon: FiUsers,
      description: 'Collaborate with your team',
      link: '/workspace/members'
    },
    {
      title: 'Create Your First Workflow',
      icon: FiCode,
      description: 'Build an AI workflow with multiple agents',
      link: '/workflows/new'
    },
    {
      title: 'Read Documentation',
      icon: FiBook,
      description: 'Learn more about The New Fuse',
      link: '/docs'
    },
    {
      title: 'Get Help',
      icon: FiMessageSquare,
      description: 'Contact support or join the community',
      link: '/support'
    }
  ];
  
  const agentNextSteps = [
    {
      title: 'API Documentation',
      icon: FiBook,
      description: 'Explore the API documentation',
      link: '/api/docs'
    },
    {
      title: 'Test Integration',
      icon: FiCode,
      description: 'Test your integration with The New Fuse',
      link: '/api/test'
    },
    {
      title: 'Monitor Usage',
      icon: FiHome,
      description: 'Monitor your API usage and performance',
      link: '/api/dashboard'
    },
    {
      title: 'Join Agent Network',
      icon: FiUsers,
      description: 'Connect with other agents in the network',
      link: '/api/network'
    }
  ];
  
  const nextSteps = isAIAgent ? agentNextSteps : humanNextSteps;

  return (
    <Box>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Icon as={CheckCircleIcon} w={16} h={16} color="green.500" mb={4} />
          <Heading as="h2" size="xl" mb={2}>
            {isAIAgent ? 'Integration Complete!' : 'Setup Complete!'}
          </Heading>
          <Text fontSize="lg" color="gray.600">
            {isAIAgent 
              ? `Your agent "${userName}" has been successfully integrated with The New Fuse platform.`
              : `Congratulations, ${userName}! You're all set to start using The New Fuse.`}
          </Text>
        </Box>
        
        <Box>
          <Heading as="h3" size="md" mb={4}>
            Next Steps
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {nextSteps.map((step, index) => (
              <Card key={index} variant="outline">
                <CardHeader pb={0}>
                  <HStack>
                    <Icon as={step.icon} color="blue.500" />
                    <Heading size="sm">{step.title}</Heading>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <Text fontSize="sm" mb={3}>{step.description}</Text>
                  <Link href={step.link}>
                    <Button size="sm" variant="outline">
                      {isAIAgent ? 'View' : 'Get Started'}
                    </Button>
                  </Link>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Box>
        
        <Box bg="blue.50" p={4} borderRadius="md">
          <Text fontSize="sm" color="blue.800">
            {isAIAgent 
              ? 'Your agent is now ready to communicate with The New Fuse platform. You can use the API documentation to learn more about the available endpoints and how to use them.'
              : 'Need help getting started? Check out our documentation or contact our support team for assistance.'}
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};
