import React from 'react';
import { Box, Select, ColorPicker, Switch, VStack } from '@chakra-ui/react';
import { useTheme } from './ThemeContext.js';

export const ThemeCustomizer: React.React.FC<{}> = () => {
  const { currentTheme, setTheme, customizeTheme } = useTheme();

  const handleColorChange = (color: string, type: 'primary' | 'secondary') => {
    customizeTheme({
      colors: {
        [type]: color
      }
    });
  };

  const handleFontChange = (fontFamily: string) => {
    customizeTheme({
      fonts: {
        body: fontFamily
      }
    });
  };

  return (
    <VStack spacing={4} p={4}>
      <Select
        value={currentTheme}
        onChange={(e) => setTheme(e.target.value)}
      >
        <option value="base">Light Theme</option>
        <option value="dark">Dark Theme</option>
        <option value="custom">Custom Theme</option>
      </Select>

      <ColorPicker
        label="Primary Color"
        onChange={(color) => handleColorChange(color, 'primary')}
      />

      <ColorPicker
        label="Secondary Color"
        onChange={(color) => handleColorChange(color, 'secondary')}
      />

      <Select
        placeholder="Select Font Family"
        onChange={(e) => handleFontChange(e.target.value)}
      >
        <option value="Inter">Inter</option>
        <option value="Roboto">Roboto</option>
        <option value="Open Sans">Open Sans</option>
      </Select>

      <Switch
        label="High Contrast"
        onChange={(e) => customizeTheme({ contrast: e.target.checked })}
      />
    </VStack>
  );
};