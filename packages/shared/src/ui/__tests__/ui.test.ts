import { getThemeClass, getResponsiveClass } from '../index.js';

describe('UI Utilities', () => {
  describe('getThemeClass', () => {
    it('returns the correct theme class', () => {
      expect(getThemeClass('dark')).toBe('theme-dark');
      expect(getThemeClass('light')).toBe('theme-light');
      expect(getThemeClass('custom')).toBe('theme-custom');
    });
  });

  describe('getResponsiveClass', () => {
    it('returns the correct responsive class for valid sizes', () => {
      expect(getResponsiveClass('sm')).toBe('max-w-sm');
      expect(getResponsiveClass('md')).toBe('max-w-md');
      expect(getResponsiveClass('lg')).toBe('max-w-lg');
      expect(getResponsiveClass('xl')).toBe('max-w-xl');
    });

    it('returns the default class for invalid sizes', () => {
      // @ts-ignore - Testing with invalid input
      expect(getResponsiveClass('invalid')).toBe('max-w-md');
    });
  });
});
