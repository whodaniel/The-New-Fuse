import {
  Box,
  VStack,
  FormControl,
  FormLabel,
  Select,
  Switch,
  useColorMode,
  } from '@chakra-ui/react'; // Assuming ThemeContext.js is actually ThemeContext.tsx
  import { useTheme } from '../contexts/ThemeContext';
import { useState, useCallback } from 'react';
import type { ThemeConfig } from '../utils/themeValidation';

type ThemeMode = 'light' | 'dark' | 'system';
type FontSize = 'sm' | 'md' | 'lg' | 'xl';

interface ThemeCustomizerProps {
  initialConfig: ThemeConfig;
  onChange: (config: ThemeConfig) => void;
}

export function ThemeCustomizer({
  initialConfig,
  onChange,
}: ThemeCustomizerProps) {
  const { theme, updateTheme, colorMode: contextColorMode, toggleColorMode } = useTheme(); // Use updateTheme from context
  const { setColorMode } = useColorMode(); // Chakra's hook for direct color mode change
  const [config, setConfig] = useState<ThemeConfig>(initialConfig);

  const handleThemeChange = useCallback(
    (mode: ThemeMode) => {
      const newConfig = {
        ...config,
        colorMode: mode,
      };
      setConfig(newConfig);
      // setColorMode(mode); // Chakra's hook can be called by ThemeProvider
      updateTheme({ colorMode: mode }); // Update global theme
      onChange(newConfig);
    },
    [config, onChange, updateTheme]
  );

  const handleFontSizeChange = useCallback(
    (size: FontSize) => {
      const newConfig = {
        ...config,
        fontSize: size,
      };
      setConfig(newConfig);
      updateTheme({ fontSize: size }); // Update global theme
      onChange(newConfig);
    },
    [config, onChange, updateTheme]
  );

  const handleReducedMotionChange = useCallback(
    (value: boolean) => {
      const newConfig = {
        ...config,
        reducedMotion: value,
      };
      setConfig(newConfig);
      updateTheme({ reducedMotion: value }); // Update global theme
      onChange(newConfig);
    },
    [config, onChange, updateTheme]
  );

  const handleHighContrastChange = useCallback(
    (value: boolean) => {
      const newConfig = {
        ...config,
        highContrast: value,
      };
      setConfig(newConfig);
      updateTheme({ highContrast: value }); // Update global theme
      onChange(newConfig);
    },
    [config, onChange, updateTheme]
  );

  return (
    <Box
      p={4}
      borderRadius="md"
      boxShadow="sm"
      bg={contextColorMode === 'dark' ? 'gray.700' : 'white'} // Use colorMode from context
    >
      <VStack spacing={4} align="stretch">
        <FormControl id="theme-mode">
          <FormLabel htmlFor="theme-mode-select">Theme Mode</FormLabel>
          <Select
            id="theme-mode-select"
            value={config.colorMode}
            onChange={(e) => handleThemeChange(e.target.value as ThemeConfig['colorMode'])}
            aria-label="Select theme mode"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </Select>
        </FormControl>

        <FormControl id="font-size">
          <FormLabel htmlFor="font-size-select">Font Size</FormLabel>
          <Select
            id="font-size-select"
            value={config.fontSize}
            onChange={(e) => handleFontSizeChange(e.target.value as ThemeConfig['fontSize'])}
            aria-label="Select font size"
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
            <option value="xl">Extra Large</option>
          </Select>
        </FormControl>

        <FormControl id="reduced-motion" display="flex" alignItems="center">
          <FormLabel htmlFor="reduced-motion-switch" mb="0">
            Reduced Motion
          </FormLabel>
          <Switch
            id="reduced-motion-switch"
            isChecked={config.reducedMotion}
            onChange={(e) => handleReducedMotionChange(e.target.checked)}
            aria-label="Toggle reduced motion"
          />
        </FormControl>

        <FormControl id="high-contrast" display="flex" alignItems="center">
          <FormLabel htmlFor="high-contrast-switch" mb="0">
            High Contrast
          </FormLabel>
          <Switch
            id="high-contrast-switch"
            isChecked={config.highContrast}
            onChange={(e) => handleHighContrastChange(e.target.checked)}
            aria-label="Toggle high contrast"
          />
        </FormControl>
      </VStack>
    </Box>
  );
}