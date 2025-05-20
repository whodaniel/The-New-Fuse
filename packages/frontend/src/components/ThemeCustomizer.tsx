import React from 'react';
import {
  Box,
  VStack,
  Text,
  Select,
  Switch,
  useColorMode,
  FormControl,
  FormLabel,
  Heading,
} from '@chakra-ui/react';
import { useTheme, ThemeConfig } from '../contexts/ThemeContext.js';

export function ThemeCustomizer() {
  const { themeConfig, setThemeConfig } = useTheme();
  const { colorMode, setColorMode } = useColorMode();

  const toggleReducedMotion = () => {
    setThemeConfig((prev: ThemeConfig) => ({
      ...prev,
      reducedMotion: !prev.reducedMotion
    }));
  };

  const toggleHighContrast = () => {
    setThemeConfig((prev: ThemeConfig) => ({
      ...prev,
      highContrast: !prev.highContrast
    }));
  };

  return (
    <Box
      p={4}
      borderRadius="md"
      boxShadow="md"
      bg={colorMode === 'dark' ? 'gray.700' : 'white'}
    >
      <Heading size="md" mb={4}>Theme Customizer</Heading>
      <VStack gap={4} align="stretch">
        <FormControl>
          <FormLabel htmlFor="color-mode-select">Color Mode</FormLabel>
          <Select
            id="color-mode-select"
            aria-label="Color Mode"
            value={colorMode}
            onChange={(e) => setColorMode(e.target.value as 'light' | 'dark' | 'system')}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel htmlFor="font-size-select">Font Size</FormLabel>
          <Select
            id="font-size-select"
            aria-label="Font Size"
            value={themeConfig.fontSize}
            onChange={(e) => setThemeConfig({
              ...themeConfig,
              fontSize: e.target.value as ThemeConfig['fontSize']
            })}
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </Select>
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="reduced-motion-switch" mb="0">
            Reduce Motion
          </FormLabel>
          <Switch
            id="reduced-motion-switch"
            isChecked={themeConfig.reducedMotion}
            onChange={toggleReducedMotion}
          />
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="high-contrast-switch" mb="0">
            High Contrast
          </FormLabel>
          <Switch
            id="high-contrast-switch"
            isChecked={themeConfig.highContrast}
            onChange={toggleHighContrast}
          />
        </FormControl>
      </VStack>
    </Box>
  );
}
