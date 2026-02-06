import React from 'react';
import { useTheme } from './ThemeContext';

export const ThemeCustomizer: React.FC<{}> = () => {
  const { currentTheme, setTheme, customizeTheme } = useTheme();

  const handleColorChange = (color: string, type: 'primary' | 'secondary') => {
    customizeTheme({
      colors: {
        [type]: color,
      },
    });
  };

  const handleFontChange = (fontFamily: string) => {
    customizeTheme({
      fonts: {
        body: fontFamily,
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <select value={currentTheme} onChange={(e) => setTheme(e.target.value)} className="input">
        <option value="base">Light Theme</option>
        <option value="dark">Dark Theme</option>
        <option value="custom">Custom Theme</option>
      </select>

      <div>
        <label className="block text-sm font-medium mb-1">Primary Color</label>
        <input
          type="color"
          onChange={(e) => handleColorChange(e.target.value, 'primary')}
          className="w-full h-10 rounded border border-gray-300"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Secondary Color</label>
        <input
          type="color"
          onChange={(e) => handleColorChange(e.target.value, 'secondary')}
          className="w-full h-10 rounded border border-gray-300"
        />
      </div>

      <select onChange={(e) => handleFontChange(e.target.value)} className="input" defaultValue="">
        <option value="" disabled>
          Select Font Family
        </option>
        <option value="Inter">Inter</option>
        <option value="Roboto">Roboto</option>
        <option value="Open Sans">Open Sans</option>
      </select>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          onChange={(e) => customizeTheme({ contrast: e.target.checked })}
          className="w-4 h-4"
        />
        <span>High Contrast</span>
      </label>
    </div>
  );
};
