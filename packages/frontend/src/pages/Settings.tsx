import React from 'react';
import {
  Box,
  Container,
  Heading,
  Divider as ChakraDivider,
  VStack,
  useColorMode,
} from '@chakra-ui/react';
import { ThemeProvider as ChakraThemeProvider } from '@chakra-ui/react';
import { ThemeCustomizer } from '../components/ThemeCustomizer.js';

export function Settings() {
  const { colorMode } = useColorMode();

  return (
    <Box minH="100vh" bg={colorMode === 'light' ? 'gray.50' : 'gray.800'}>
      <Container maxW="container.lg" py={8}>
        <VStack gap={8} align="stretch">
          <Heading size="lg">Settings</Heading>
          <ChakraDivider />
          <ThemeCustomizer />
        </VStack>
      </Container>
    </Box>
  );
}

export default Settings;
