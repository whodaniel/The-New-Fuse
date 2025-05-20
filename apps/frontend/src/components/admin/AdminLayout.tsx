import React, { ReactNode } from 'react';
import {
  Box,
  Flex,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  useDisclosure,
  IconButton,
  VStack,
  HStack,
  Text,
  Heading,
  Divider,
  useColorModeValue,
  Icon
} from '@chakra-ui/react';
import { 
  FiMenu, 
  FiHome, 
  FiUsers, 
  FiSettings, 
  FiLayers, 
  FiTool, 
  FiMessageSquare,
  FiDatabase,
  FiActivity,
  FiShield
} from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const menuItems = [
    { name: 'Dashboard', icon: FiHome, path: '/admin' },
    { name: 'Users', icon: FiUsers, path: '/admin/users' },
    { name: 'Onboarding', icon: FiLayers, path: '/admin/onboarding' },
    { name: 'Tools', icon: FiTool, path: '/admin/tools' },
    { name: 'Agents', icon: FiMessageSquare, path: '/admin/agents' },
    { name: 'Integrations', icon: FiDatabase, path: '/admin/integrations' },
    { name: 'Analytics', icon: FiActivity, path: '/admin/analytics' },
    { name: 'Security', icon: FiShield, path: '/admin/security' },
    { name: 'Settings', icon: FiSettings, path: '/admin/settings' },
  ];

  return (
    <Box minH="100vh">
      {/* Mobile nav */}
      <Box display={{ base: 'flex', md: 'none' }} alignItems="center" p={4} borderBottomWidth="1px">
        <IconButton
          aria-label="Open menu"
          icon={<FiMenu />}
          onClick={onOpen}
          variant="outline"
        />
        <Text ml={4} fontWeight="bold">Admin Panel</Text>
      </Box>
      
      {/* Sidebar for mobile */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Admin Panel</DrawerHeader>
          <DrawerBody p={0}>
            <VStack align="stretch" spacing={0}>
              {menuItems.map((item) => (
                <Link key={item.path} to={item.path} onClick={onClose}>
                  <Box
                    py={3}
                    px={4}
                    bg={location.pathname === item.path ? 'blue.50' : 'transparent'}
                    color={location.pathname === item.path ? 'blue.500' : 'inherit'}
                    _hover={{ bg: 'gray.100' }}
                  >
                    <HStack spacing={3}>
                      <Icon as={item.icon} />
                      <Text>{item.name}</Text>
                    </HStack>
                  </Box>
                </Link>
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      
      {/* Desktop view */}
      <Flex>
        {/* Sidebar */}
        <Box
          w="250px"
          h="100vh"
          bg={bgColor}
          borderRightWidth="1px"
          borderColor={borderColor}
          position="fixed"
          display={{ base: 'none', md: 'block' }}
          overflowY="auto"
        >
          <Box p={4} borderBottomWidth="1px">
            <Heading size="md">Admin Panel</Heading>
          </Box>
          
          <VStack align="stretch" spacing={0}>
            {menuItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Box
                  py={3}
                  px={4}
                  bg={location.pathname === item.path ? 'blue.50' : 'transparent'}
                  color={location.pathname === item.path ? 'blue.500' : 'inherit'}
                  _hover={{ bg: 'gray.100' }}
                >
                  <HStack spacing={3}>
                    <Icon as={item.icon} />
                    <Text>{item.name}</Text>
                  </HStack>
                </Box>
              </Link>
            ))}
          </VStack>
        </Box>
        
        {/* Main content */}
        <Box
          ml={{ base: 0, md: '250px' }}
          w={{ base: 'full', md: 'calc(100% - 250px)' }}
          p={6}
        >
          {children}
        </Box>
      </Flex>
    </Box>
  );
};
