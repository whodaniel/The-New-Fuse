import React from 'react';
import { Box, Button, Text } from '@chakra-ui/react';
import { RefreshCw, Settings, Moon, Sun, Bug, Keyboard, HelpCircle, LayoutDashboard, Globe, Sparkles, Wrench, Monitor, Clock, Code, HardDrive, Shield, Zap } from 'lucide-react';

interface PopupContainerProps {
  isMainApp?: boolean;
  initialDarkMode?: boolean;
  onThemeChange?: (dark: boolean) => void;
  containerStyle?: React.CSSProperties;
}

export const PopupContainer: React.FC<PopupContainerProps> = ({
  isMainApp = false,
  initialDarkMode = false,
  onThemeChange,
  containerStyle = {},
}) => {
  const [darkMode, setDarkMode] = React.useState(initialDarkMode);

  const handleThemeChange = (newDarkMode: boolean) => {
    setDarkMode(newDarkMode);
    onThemeChange?.(newDarkMode);
  };

  return (
    <Box
      width="100%"
      height="100%"
      bg={darkMode ? 'gray.800' : 'white'}
      color={darkMode ? 'white' : 'gray.800'}
      p={4}
      {...containerStyle}
    >
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
        <Text fontSize="lg" fontWeight="bold">
          {isMainApp ? 'Main App Integration' : 'Chrome Extension'}
        </Text>
        <Button
          size="sm"
          onClick={() => handleThemeChange(!darkMode)}
          leftIcon={darkMode ? <Sun size={16} /> : <Moon size={16} />}
        >
          {darkMode ? 'Light' : 'Dark'}
        </Button>
      </Box>

      {/* Quick Actions */}
      <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2} mb={4}>
        <Button size="sm" leftIcon={<LayoutDashboard size={16} />}>
          Dashboard
        </Button>
        <Button size="sm" leftIcon={<Code size={16} />}>
          Code
        </Button>
        <Button size="sm" leftIcon={<Monitor size={16} />}>
          Debug
        </Button>
        <Button size="sm" leftIcon={<Settings size={16} />}>
          Settings
        </Button>
      </Box>

      {/* Status */}
      <Box p={3} bg={darkMode ? 'gray.700' : 'gray.100'} borderRadius="md">
        <Text fontSize="sm" fontWeight="medium" mb={2}>System Status</Text>
        <Box display="flex" alignItems="center" gap={2}>
          <Box w={2} h={2} bg="green.500" borderRadius="full" />
          <Text fontSize="xs">Extension active</Text>
        </Box>
      </Box>
    </Box>
  );
};
