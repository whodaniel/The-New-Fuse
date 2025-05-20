import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with system theme', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe('system');
  });

  it('should load theme from localStorage if available', () => {
    localStorage.setItem('ui-theme', 'dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe('dark');
  });

  it('should update theme when setTheme is called', () => {
    const { result } = renderHook(() => useTheme());
    
    act(() => {
      result.current[1]('dark');
    });

    expect(result.current[0]).toBe('dark');
    expect(localStorage.getItem('ui-theme')).toBe('dark');
  });

  it('should use custom storage key if provided', () => {
    const { result } = renderHook(() => useTheme('custom-theme-key'));
    
    act(() => {
      result.current[1]('dark');
    });

    expect(localStorage.getItem('custom-theme-key')).toBe('dark');
  });

  it('should apply theme to document root', () => {
    const { result } = renderHook(() => useTheme());
    const root = window.document.documentElement;

    act(() => {
      result.current[1]('dark');
    });
    expect(root.classList.contains('dark')).toBe(true);

    act(() => {
      result.current[1]('light');
    });
    expect(root.classList.contains('light')).toBe(true);
    expect(root.classList.contains('dark')).toBe(false);
  });
});

export {};
