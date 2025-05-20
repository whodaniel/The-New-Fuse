import React from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  IconButton,
  Link,
  Stack,
  useDisclosure,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export function Navigation() {
  const { isOpen, onToggle } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const { isAuthenticated } = useAuth();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const navItems = isAuthenticated
    ? [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Settings', href: '/settings' },
      ]
    : [
        { label: 'Features', href: '/#features' },
        { label: 'Pricing', href: '/#pricing' },
      ];

  return (
    <Box
      as="nav"
      position="sticky"
      top={0}
      zIndex={10}
      bg={bgColor}
      borderBottom={1}
      borderStyle="solid"
      borderColor={borderColor}
    >
      <Container maxW="container.xl">
        <Flex py={4} align="center" justify="space-between">
          <Flex align="center">
            <Link as={RouterLink} to="/" fontSize="xl" fontWeight="bold">
              The New Fuse
            </Link>
          </Flex>

          <IconButton
            display={{ base: 'flex', md: 'none' }}
            onClick={onToggle}
            aria-label="Toggle Navigation"
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />} // Changed _icon to icon
            variant="ghost"
          />

          <Stack
            direction={{ base: 'column', md: 'row' }}
            display={{ base: isOpen ? 'flex' : 'none', md: 'flex' }}
            width={{ base: 'full', md: 'auto' }}
            alignItems="center"
            mt={{ base: 4, md: 0 }}
            gap={8}
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                as={RouterLink}
                to={item.href}
                color="brand.500"
                fontWeight="semibold"
              >
                {item.label}
              </Link>
            ))}

            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />} // Changed _icon to icon
              variant="ghost"
              onClick={toggleColorMode}
            />

            <Stack direction="row" gap={4}>
              <Button as={RouterLink} to="/login" variant="ghost">
                Sign In
              </Button>
              <Button as={RouterLink} to="/register" colorScheme="brand">
                Sign Up
              </Button>
            </Stack>
          </Stack>
        </Flex>
      </Container>
    </Box>
  );
}