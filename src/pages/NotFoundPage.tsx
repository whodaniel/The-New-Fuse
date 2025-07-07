import React from 'react';
import { Box, Heading, Text, Button, Flex, Icon, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FiHome, FiAlertTriangle } from 'react-icons/fi'; // Example icons

export function NotFoundPage() {
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const accentColor = useColorModeValue('brand.500', 'brand.300');

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg={bgColor}
      direction="column"
      textAlign="center"
      p={6}
    >
      <Icon as={FiAlertTriangle} w={20} h={20} color={accentColor} mb={6} />
      <Heading as="h1" size="2xl" mb={3}>
        404 - Page Not Found
      </Heading>
      <Text fontSize="xl" color={textColor} mb={8}>
        Oops! The page you're looking for doesn't seem to exist.
      </Text>
      <Button
        as={RouterLink}
        to="/"
        colorScheme="brand"
        leftIcon={<Icon as={FiHome} />}
        size="lg"
      >
        Go to Homepage
      </Button>
    </Flex>
  );
}

export default NotFoundPage;