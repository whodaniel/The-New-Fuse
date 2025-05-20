import {
  Box,
  Container,
  Heading,
  VStack,
  Divider,
  useColorMode,
  FormControl,
  FormLabel,
  Switch,
  Flex,
} from '@chakra-ui/react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { ThemeCustomizer } from '../components/ThemeCustomizer.js';
import { ColorPicker } from '../components/ColorPicker.js';

interface SettingsTab {
  name: string;
  path: string;
  component: React.ComponentType;
}

export function Settings() {
  const { colorMode, toggleColorMode } = useColorMode();
  const location = useLocation();

  const tabs: SettingsTab[] = [
    { name: 'User', path: '', component: UserSettings },
    { name: 'Security', path: 'security', component: SecuritySettings },
    { name: 'Notifications', path: 'notifications', component: NotificationSettings },
    { name: 'Theme', path: 'theme', component: ThemeCustomizer }
  ];

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={8} align="stretch">
        <Box>
          <Heading size="lg" mb={4}>Settings</Heading>
          <Divider />
        </Box>

        <Flex gap={6} direction={{ base: 'column', md: 'row' }}>
          <Box w={{ base: 'full', md: '64' }} bg="white" rounded="lg" shadow="sm" p={4}>
            <nav>
              <VStack spacing={2} align="stretch">
                {tabs.map(tab => (
                  <Link 
                    key={tab.path} 
                    to={tab.path}
                    className={`block px-4 py-2 rounded hover:bg-gray-100 ${
                      location.pathname.endsWith(tab.path) ? 'bg-gray-100' : ''
                    }`}
                  >
                    {tab.name}
                  </Link>
                ))}
              </VStack>
            </nav>
          </Box>

          <Box flex="1" bg="white" rounded="lg" shadow="sm" p={6}>
            <Routes>
              {tabs.map(tab => (
                <Route
                  key={tab.path}
                  path={tab.path}
                  element={<tab.component />}
                />
              ))}
            </Routes>
          </Box>
        </Flex>

        <Box>
          <FormControl display="flex" alignItems="center" mb={4}>
            <FormLabel htmlFor="dark-mode" mb="0">Dark Mode</FormLabel>
            <Switch
              id="dark-mode"
              isChecked={colorMode === 'dark'}
              onChange={toggleColorMode}
            />
          </FormControl>
          <Divider />
        </Box>

        <Box>
          <Heading size="md" mb={4}>Theme</Heading>
          <ThemeCustomizer />
        </Box>

        <Box>
          <Heading size="md" mb={4}>Colors</Heading>
          <ColorPicker />
        </Box>
      </VStack>
    </Container>
  );
}

function UserSettings() {
  return <Box>User Settings</Box>;
}

function SecuritySettings() {
  return <Box>Security Settings</Box>;
}

function NotificationSettings() {
  return <Box>Notification Settings</Box>;
}