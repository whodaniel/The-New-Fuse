import React from 'react';
import { Box, Container, Flex } from '@chakra-ui/react';
import { Navigation } from './Navigation.tsx'; 
import { Footer } from './Footer.tsx';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <Flex direction="column" minH="100vh">
      <Navigation />
      <Box flex="1">
        <Container maxW="container.xl" py={8}>
          {children}
        </Container>
      </Box>
      <Footer />
    </Flex>
  );
}