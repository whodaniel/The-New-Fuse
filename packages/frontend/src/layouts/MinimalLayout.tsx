import React from 'react';
import { Box, Flex, useColorModeValue, Text, Container } from '@chakra-ui/react';
import { Outlet, Link as RouterLink } from 'react-router-dom';

const MinimalLayout: React.FC = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const headerBgColor = useColorModeValue('white', 'gray.700');
  const headerBorderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Flex direction="column" minH="100vh" bg={bgColor}>
      <Box bg={headerBgColor} px={4} shadow="sm" borderBottomWidth="1px" borderColor={headerBorderColor}>
        <Container maxW="container.xl">
          <Flex h={16} alignItems="center" justifyContent="space-between">
            <RouterLink to="/">
              <Text fontSize="xl" fontWeight="bold" color="brand.500">
                AppLogo
              </Text>
            </RouterLink>
            {/* Minimal layout might not have other nav items, or very few */}
          </Flex>
        </Container>
      </Box>
      <Flex flex={1} direction="column" alignItems="center" justifyContent="center" p={4}>
        <Outlet />
      </Flex>
      <Box py={4} textAlign="center" borderTopWidth="1px" borderColor={headerBorderColor}>
        <Text fontSize="sm" color="gray.500">
          &copy; {new Date().getFullYear()} Your Company. All rights reserved.
        </Text>
      </Box>
    </Flex>
  );
};

export default MinimalLayout;