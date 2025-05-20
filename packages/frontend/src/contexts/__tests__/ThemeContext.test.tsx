import React from 'react';
import { render, screen, renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext.js';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('ThemeContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
    // Reset document classes
    document.documentElement.classList.remove('light', 'dark');
  });
  it('provides theme configuration', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.themeConfig).toEqual(
      expect.objectContaining({
        colorScheme: expect.any(String),
        fontSize: expect.any(String),
        highContrast: expect.any(Boolean),
        reducedMotion: expect.any(Boolean),
      })
    );
  });

  it('updates theme configuration', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setThemeConfig({
        ...result.current.themeConfig,
        colorScheme: 'dark',
      });
    });

    expect(result.current.themeConfig.colorScheme).toBe('dark');
  });

  it('throws error when used outside provider', () => {
    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme must be used within a ThemeProvider'
    );
  });

  test('switches theme without page reload', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    act(() => {
      (result.current as any).setTheme('dark');
    });
    expect((result.current as any).currentTheme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  test('applies high contrast mode correctly', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    act(() => {
      (result.current as any).customizeTheme({ colors: { primary: '#000000' } });
    });
    expect((result.current as any).themeOptions?.colors?.primary).toBe('#000000');
  });
});