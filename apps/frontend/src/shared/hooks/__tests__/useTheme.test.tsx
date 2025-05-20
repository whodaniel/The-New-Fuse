import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../useTheme.js';
import { vi } from 'vitest';

describe('useTheme', () => {
  const mockMatchMedia = vi.fn();

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Mock matchMedia
    window.matchMedia = mockMatchMedia;
  });

  it('should initialize with system theme', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe('system');
  });

  it('should load theme from localStorage if available', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    localStorage.setItem('ui-theme', 'dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe('dark');
  });

  it('should update theme when setTheme is called', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useTheme());
    
    act(() => {
      result.current[1]('dark');
    });

    expect(result.current[0]).toBe('dark');
    expect(localStorage.getItem('ui-theme')).toBe('dark');
  });

  it('should respond to system theme changes', () => {
    const listeners = new Set<(e: any) => void>();
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: (event: string, callback: (e: any) => void) => {
        listeners.add(callback);
      },
      removeEventListener: (event: string, callback: (e: any) => void) => {
        listeners.delete(callback);
      },
    });

    const { result } = renderHook(() => useTheme());
    
    // Simulate system theme change
    act(() => {
      listeners.forEach(listener => 
        listener({ matches: true })
      );
    });

    const root = window.document.documentElement;
    expect(root.classList.contains('dark')).toBe(true);
  });

  it('should use custom storage key if provided', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useTheme('custom-theme-key'));
    
    act(() => {
      result.current[1]('dark');
    });

    expect(localStorage.getItem('custom-theme-key')).toBe('dark');
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListener = vi.fn();
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener,
    });

    const { unmount } = renderHook(() => useTheme());
    unmount();

    expect(removeEventListener).toHaveBeenCalled();
  });

  it('should apply theme to document root', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

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
