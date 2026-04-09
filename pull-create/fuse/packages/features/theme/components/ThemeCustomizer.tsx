import React from 'react';
import { useTheme } from '../ThemeContext';

interface ColorOption {
  name: string;
  value: string;
}

const colorOptions: ColorOption[] = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#db2777' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Teal', value: '#0d9488' },
];

export const ThemeCustomizer: React.FC = () => {
  const { theme, setTheme, toggleColorMode } = useTheme();

  const handleColorModeChange = (mode: 'light' | 'dark' | 'system') => {
    setTheme({ mode });
  };

  const handleFontSizeChange = (fontSize: string) => {
    setTheme({ fontSize });
  };

  const handleSpacingChange = (spacing: string) => {
    setTheme({ spacing });
  };

  const handlePrimaryColorChange = (color: string) => {
    setTheme({
      colors: {
        light: {
          ...theme.colors.light,
          primary: color
        },
        dark: {
          ...theme.colors.dark,
          primary: color
        }
      }
    });
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow dark:bg-gray-800">
      {/* Color Mode */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Color Mode</h3>
        <div className="flex space-x-4">
          {(['light', 'dark', 'system'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleColorModeChange(mode)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                theme.mode === mode
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Color */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Primary Color
        </h3>
        <div className="grid grid-cols-7 gap-3">
          {colorOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handlePrimaryColorChange(option.value)}
              className={`w-8 h-8 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 bg-[${option.value}]`}
              title={option.name}
              aria-label={`Set ${option.name} as primary color`}
            />
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <label htmlFor="font-size" className="block text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Font Size
        </label>
        <select
          id="font-size"
          name="font-size"
          value={theme.fontSize}
          onChange={(e) => handleFontSizeChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          aria-label="Select font size"
        >
          <option value="sm">Small</option>
          <option value="base">Medium</option>
          <option value="lg">Large</option>
          <option value="xl">Extra Large</option>
        </select>
      </div>

      {/* Spacing */}
      <div>
        <label htmlFor="spacing" className="block text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Element Spacing
        </label>
        <select
          id="spacing"
          name="spacing"
          value={theme.spacing}
          onChange={(e) => handleSpacingChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          aria-label="Select element spacing"
        >
          <option value="compact">Compact</option>
          <option value="normal">Normal</option>
          <option value="relaxed">Relaxed</option>
        </select>
      </div>
    </div>
  );
};
