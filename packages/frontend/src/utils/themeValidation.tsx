import { ColorScheme, ThemeConfig } from '../types/theme.js'; // Corrected import path and added ThemeConfig

// Assuming ColorConfig and FontConfig are part of ThemeConfig structure
// If ThemeConfig is defined as { colors: ColorConfig, fonts: FontConfig, ... }
// We can use indexed access types if they are properties of ThemeConfig.
// For example, if ThemeConfig has a 'colors' property of a specific type:
// type ColorConfig = ThemeConfig['colors'];
// type FontConfig = ThemeConfig['fonts'];
// For now, let's assume they are structured and ThemeConfig provides them.
// If ColorScheme is the type for themeConfig.colors, we can use that.

export function validateColorScheme(colors: Partial<ColorScheme>): boolean {
  const requiredColors: Array<keyof ColorScheme> = [
    'primary',
    'secondary',
    'background',
    'text',
    'error',
    'warning',
    'success'
  ];
  
  // Ensure that colors is an object before proceeding
  if (typeof colors !== 'object' || colors === null) {
    return false;
  }

  return requiredColors.every(colorKey => {
    const value = colors[colorKey];
    // Ensure value is a string before testing with regex
    return typeof value === 'string' && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);
  });
}

const validateColor = (colorValue: string | undefined, colorName: string): string[] => {
  const errors: string[] = [];
  if (typeof colorValue !== 'string' || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colorValue)) {
    errors.push(`Invalid or missing color value for ${colorName}: ${colorValue}`);
  }
  return errors;
};

export const validateThemeConfig = (themeConfig: ThemeConfig): string[] => {
  let errors: string[] = [];

  // Validate colors if they exist on themeConfig
  // Assuming colors are nested under a `colors` property within the extended ChakraThemeConfig
  if (themeConfig.colors) {
    const colorScheme = themeConfig.colors as Partial<ColorScheme>; // Cast to ColorScheme
    const colorKeys = Object.keys(colorScheme) as Array<keyof ColorScheme>;
    for (const colorName of colorKeys) {
      errors.push(...validateColor(colorScheme[colorName], String(colorName))); // Ensure colorName is a string
    }
  }
  
  // Validate fonts if they exist on themeConfig
  // Assuming fonts are nested under a `fonts` property within the extended ChakraThemeConfig
  if (themeConfig.fonts) {
    const fontStyle = themeConfig.fonts as Partial<{[key: string]: string}>; // Cast to appropriate font type
    const fontKeys = Object.keys(fontStyle);
    for (const fontName of fontKeys) {
      const fontValue = fontStyle[fontName];
      if (typeof fontValue !== 'string' || fontValue.trim() === '') {
        errors.push(`Invalid or missing font value for ${fontName}: ${fontValue}`);
      }
    }
  }

  // Add other ThemeConfig property validations here if needed
  // For example, validating fontSize, colorScheme, etc.
  if (!['sm', 'md', 'lg'].includes(themeConfig.fontSize)) {
    errors.push(`Invalid fontSize: ${themeConfig.fontSize}. Must be 'sm', 'md', or 'lg'.`);
  }

  if (!['light', 'dark', 'system'].includes(themeConfig.colorScheme)) {
    errors.push(`Invalid colorScheme: ${themeConfig.colorScheme}. Must be 'light', 'dark', or 'system'.`);
  }

  return errors;
};