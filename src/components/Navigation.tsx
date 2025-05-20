import { 
  Box, 
  Button,
  Flex,
  IconButton,
  useColorMode,
  Container,
  chakra,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';

interface NavItem {
  label: string;
  href: string;
}

export function Navigation() {
  const { colorMode, toggleColorMode } = useColorMode();

  const NAV_ITEMS: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Projects', href: '/projects' },
    { label: 'Settings', href: '/settings' },
  ];

  return (
    <Box as="nav" py={4} borderBottom="1px" borderColor="gray.200">
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center">
          <Flex gap={4} display={{ base: 'none', md: 'flex' }}>
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.href}
                as={Link}
                to={item.href}
                variant="ghost"
                colorScheme="brand"
              >
                {item.label}
              </Button>
            ))}
          </Flex>

          <Flex gap={4} alignItems="center">
            <IconButton
              aria-label="Toggle color mode"
              onClick={toggleColorMode}
              variant="ghost"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            />
            
            <Flex gap={4}>
              <Button 
                as={Link} 
                to="/login"
                variant="ghost"
              >
                Sign in
              </Button>
              <Button
                as={Link}
                to="/register"
                colorScheme="brand"
              >
                Sign up
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}