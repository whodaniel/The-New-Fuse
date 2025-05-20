import React from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Card,
  CardBody,
  Text,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { useAuth } from '../hooks/useAuth.js';

export function Dashboard() {
  const { user } = useAuth();
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const statBgColor = useColorModeValue('white', 'gray.700');

  const stats = [
    { label: 'Total Projects', value: '12', trend: '+3 from last month' },
    { label: 'Active Tasks', value: '48', trend: '6 due today' },
    { label: 'Team Members', value: '8', trend: '2 online' },
    { label: 'Completion Rate', value: '94%', trend: '+2.3% this week' },
  ];

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="container.xl" py={8}>
        <Grid gap={8}>
          <GridItem>
            <Heading size="lg" mb={2}>Welcome back, {user?.name || 'User'}</Heading>
          </GridItem>

          <GridItem>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
              {stats.map((stat, index) => (
                <Card key={index} bg={statBgColor} rounded="lg" shadow="base">
                  <CardBody>
                    <Stat>
                      <StatLabel>{stat.label}</StatLabel>
                      <StatNumber>{stat.value}</StatNumber>
                      <Text fontSize="sm" color="gray.500">{stat.trend}</Text>
                    </Stat>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </GridItem>

          <GridItem>
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={8}>
              <Box p={6} bg={statBgColor} rounded="lg" shadow="base">
                <Heading size="md" mb={4}>Recent Activity</Heading>
                {/* Add activity feed component */}
              </Box>

              <Box p={6} bg={statBgColor} rounded="lg" shadow="base">
                <Heading size="md" mb={4}>Quick Actions</Heading>
                {/* Add quick actions component */}
              </Box>
            </SimpleGrid>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
}