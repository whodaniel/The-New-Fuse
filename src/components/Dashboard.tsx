import {
  Box,
  Container,
  SimpleGrid,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
} from '@chakra-ui/react';

interface StatData {
  label: string;
  value: string;
  change: string;
}

export function Dashboard() {
  const bgColor = useColorModeValue('white', 'gray.700');
  
  const stats: StatData[] = [
    {
      label: 'Total Users',
      value: '5,000',
      change: '↑ 23%',
    },
    {
      label: 'Active Projects',
      value: '120',
      change: '↑ 15%',
    },
    {
      label: 'Total Revenue',
      value: '$50K',
      change: '↓ 5%',
    },
    {
      label: 'Success Rate',
      value: '88%',
      change: '↑ 10%',
    },
  ];

  return (
    <Container maxW="container.xl" py={8}>
      <Box>
        <Heading size="lg" mb={6}>Dashboard</Heading>
        
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
          {stats.map((stat, index) => (
            <Box key={index} p={4} bg={bgColor} rounded="lg" shadow="base">
              <Stat>
                <StatLabel>{stat.label}</StatLabel>
                <StatNumber>{stat.value}</StatNumber>
                <StatHelpText>{stat.change}</StatHelpText>
              </Stat>
            </Box>
          ))}
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={8} mt={8}>
          <Box p={6} bg={bgColor} rounded="lg" shadow="base">
            <Heading size="md" mb={4}>Recent Activity</Heading>
            <Text color="gray.500">No recent activity</Text>
          </Box>

          <Box p={6} bg={bgColor} rounded="lg" shadow="base">
            <Heading size="md" mb={4}>Quick Actions</Heading>
            <Text color="gray.500">No actions available</Text>
          </Box>
        </SimpleGrid>
      </Box>
    </Container>
  );
}