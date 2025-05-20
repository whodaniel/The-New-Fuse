import {
  Box,
  Container,
  Flex,
  chakra,
  useColorModeValue,
} from '@chakra-ui/react';
import { Navigation } from './Navigation.js';
import { Sidebar } from './Sidebar.js';

export function Layout({ children }: { children: React.ReactNode }) {
  const bgColor = useColorModeValue('gray.50', 'gray.800');

  return (
    <Flex direction="column" minH="100vh" bg={bgColor}>
      <Navigation />
      <Box flex={1}>
        <Container maxW="container.xl" py={8}>
          <Box display="flex" gap={8}>
            <Sidebar />
            <Box flex="1">{children}</Box>
          </Box>
        </Container>
      </Box>
    </Flex>
  );
}