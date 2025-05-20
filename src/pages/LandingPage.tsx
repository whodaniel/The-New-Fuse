import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button.js';
import { Container, VStack, SimpleGrid, Box, Text } from '@chakra-ui/react';
import { FeatureCard } from '../components/FeatureCard.js';

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function LandingPage() {
  const features: Feature[] = [
    {
      title: 'Intelligent Communication',
      description: 'Seamless interaction between AI agents and systems',
      icon: <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">🤖</div>
    },
    {
      title: 'Enhanced Collaboration',
      description: 'Connect and coordinate multiple AI systems effortlessly',
      icon: <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">🔄</div>
    },
    {
      title: 'Real-time Integration',
      description: 'Instant updates and synchronization across your AI network',
      icon: <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">⚡</div>
    }
  ];

  return (
    <Box as="main">
      <Container maxW="container.xl" py={16}>
        {/* Hero Section */}
        <VStack gap={8} textAlign="center">
          <Text fontSize="4xl" fontWeight="bold">
            Welcome to The New Fuse
          </Text>
          <Text fontSize="xl" color="gray.600">
            Connect, coordinate, and enhance your AI systems with our intelligent communication platform.
          </Text>
          <Link to="/register">
            <Button size="lg" colorScheme="brand">
              Start Your Journey
            </Button>
          </Link>
        </VStack>

        {/* Features Section */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={10} mt={20}>
          {features.map((feature, index) => (
            <Box key={index} p={5} shadow="md" borderRadius="lg">
              <VStack gap={4} align="center">
                <feature.icon className="h-12 w-12 text-primary" />
                <Text fontWeight="bold" fontSize="xl">
                  {feature.title}
                </Text>
                <Text color="gray.600">
                  {feature.description}
                </Text>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}