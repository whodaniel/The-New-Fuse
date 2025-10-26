/**
 * Theia IDE Integration Page
 * Provides embedded access to the Theia IDE within TNF platform
 */

import React, { useEffect, useState } from 'react';
import { Box, Alert, AlertIcon, AlertTitle, AlertDescription, Spinner, VStack, HStack, Button, Text } from '@chakra-ui/react';

interface IdeStatus {
  status: 'loading' | 'ready' | 'error';
  message?: string;
}

const TheiaIDE: React.FC = () => {
  const [ideStatus, setIdeStatus] = useState<IdeStatus>({ status: 'loading' });
  const ideUrl = import.meta.env.VITE_THEIA_IDE_URL || 'http://localhost:3007';

  useEffect(() => {
    // Check if IDE is available
    const checkIdeHealth = async () => {
      try {
        const response = await fetch(`${ideUrl}/health`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          setIdeStatus({ status: 'ready' });
        } else {
          setIdeStatus({
            status: 'error',
            message: 'IDE is not responding. Please ensure the IDE service is running.',
          });
        }
      } catch (error) {
        setIdeStatus({
          status: 'error',
          message: `Failed to connect to IDE at ${ideUrl}. Please check if the service is running.`,
        });
      }
    };

    checkIdeHealth();
  }, [ideUrl]);

  const handleRefresh = () => {
    setIdeStatus({ status: 'loading' });
    window.location.reload();
  };

  const handleOpenInNewTab = () => {
    window.open(ideUrl, '_blank', 'noopener,noreferrer');
  };

  if (ideStatus.status === 'loading') {
    return (
      <Box
        w="100%"
        h="calc(100vh - 64px)"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.50"
      >
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text fontSize="lg" color="gray.600">
            Loading Theia IDE...
          </Text>
        </VStack>
      </Box>
    );
  }

  if (ideStatus.status === 'error') {
    return (
      <Box
        w="100%"
        h="calc(100vh - 64px)"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.50"
        p={6}
      >
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          maxW="2xl"
          borderRadius="lg"
          p={8}
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={2} fontSize="2xl">
            IDE Unavailable
          </AlertTitle>
          <AlertDescription maxWidth="lg" mb={4}>
            {ideStatus.message}
          </AlertDescription>
          <HStack spacing={4} mt={4}>
            <Button colorScheme="blue" onClick={handleRefresh}>
              Retry Connection
            </Button>
            <Button variant="outline" onClick={handleOpenInNewTab}>
              Open in New Tab
            </Button>
          </HStack>
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      w="100%"
      h="calc(100vh - 64px)"
      position="relative"
      overflow="hidden"
    >
      {/* IDE Header */}
      <Box
        bg="gray.800"
        color="white"
        px={4}
        py={2}
        borderBottom="1px"
        borderColor="gray.700"
      >
        <HStack justify="space-between">
          <HStack spacing={4}>
            <Text fontSize="lg" fontWeight="bold">
              Theia IDE
            </Text>
            <Text fontSize="sm" color="gray.400">
              v2.0.0 | Theia 1.65.2
            </Text>
          </HStack>
          <HStack spacing={2}>
            <Button
              size="sm"
              variant="ghost"
              colorScheme="whiteAlpha"
              onClick={handleOpenInNewTab}
            >
              Open in New Tab
            </Button>
          </HStack>
        </HStack>
      </Box>

      {/* IDE Iframe */}
      <Box
        as="iframe"
        src={ideUrl}
        w="100%"
        h="calc(100% - 48px)"
        border="none"
        bg="white"
        title="Theia IDE"
      />
    </Box>
  );
};

export default TheiaIDE;
