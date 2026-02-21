import { Box, VStack, Link, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export function Sidebar() {
  const location = useLocation();
  const activeBg = useColorModeValue('gray.100', 'gray.700');
  
  const NAV_ITEMS: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Analytics', href: '/analytics' },
    { label: 'Projects', href: '/projects' },
    { label: 'Settings', href: '/settings' },
  ];

  return (
    <Box
      as="nav"
      pos="sticky"
      top="4"
      w="64"
      h="calc(100vh - 2rem)"
      overflowY="auto"
      px={4}
      py={4}
    >
      <VStack spacing={2} align="stretch">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            as={RouterLink}
            to={item.href}
            px={4}
            py={2}
            rounded="md"
            display="flex"
            alignItems="center"
            bg={location.pathname === item.href ? activeBg : 'transparent'}
            _hover={{ bg: activeBg }}
          >
            {item.icon && <Box mr={3}>{item.icon}</Box>}
            {item.label}
          </Link>
        ))}
      </VStack>
    </Box>
  );
}