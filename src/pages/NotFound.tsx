import {
  Box,
  Heading,
  Text,
  Button,
  Container,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

export function NotFound() {
  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.800')}>
      <Container maxW="container.md" py={20}>
        <VStack spacing={8} align="center">
          <Heading size="2xl">404</Heading>
          <Text fontSize="xl" textAlign="center">
            The page you're looking for doesn't exist.
          </Text>
          <Button
            as={RouterLink}
            to="/"
            colorScheme="brand"
            size="lg"
          >
            Go back home
          </Button>
        </VStack>
      </Container>
    </Box>
  );
}