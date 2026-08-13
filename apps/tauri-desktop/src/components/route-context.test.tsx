import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RouteProvider, useRoute } from '../components/route-context';
import { ROUTE_STORAGE_KEY } from '../config/routes';

vi.mock('../lib/safeStorage', () => {
  const store = new Map<string, string>();
  return {
    safeStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      __clear: () => store.clear(),
    },
  };
});

import { safeStorage } from '../lib/safeStorage';

const wrapper =
  (initialRoute?: string) =>
  ({ children }: { children: React.ReactNode }) =>
    React.createElement(RouteProvider, { initialRoute }, children);

// Captured event listeners so tests can dispatch a synthetic hashchange.
let listeners: Record<string, Array<(...args: unknown[]) => void>>;

function fireHashChange(hash: string) {
  (window as unknown as { location: { hash: string } }).location.hash = hash;
  for (const handler of listeners.hashchange || []) {
    handler();
  }
}

describe('RouteProvider', () => {
  beforeEach(() => {
    (safeStorage as { __clear?: () => void }).__clear?.();
    listeners = {};
    vi.stubGlobal('window', {
      location: { hash: '', search: '' },
      history: { replaceState: vi.fn() },
      addEventListener: (type: string, handler: (...args: unknown[]) => void) => {
        (listeners[type] ||= []).push(handler);
      },
      removeEventListener: (type: string, handler: (...args: unknown[]) => void) => {
        listeners[type] = (listeners[type] || []).filter((h) => h !== handler);
      },
    });
  });

  it('navigates and persists known routes', () => {
    const { result } = renderHook(() => useRoute(), { wrapper: wrapper('/dashboard') });

    act(() => result.current.navigate('/chat'));
    expect(result.current.currentRoute).toBe('/chat');
    expect(safeStorage.getItem(ROUTE_STORAGE_KEY)).toBe('/chat');
  });

  it('goBack restores previous route', () => {
    const { result } = renderHook(() => useRoute(), { wrapper: wrapper('/dashboard') });

    act(() => result.current.navigate('/agents'));
    act(() => result.current.navigate('/chat'));
    act(() => result.current.goBack());

    expect(result.current.currentRoute).toBe('/agents');
    expect(result.current.history).toEqual(['/dashboard', '/agents']);
  });

  it('does not shrink history stack below boot route', () => {
    const { result } = renderHook(() => useRoute(), { wrapper: wrapper('/dashboard') });

    act(() => result.current.goBack());
    expect(result.current.currentRoute).toBe('/dashboard');
    expect(result.current.history).toEqual(['/dashboard']);
  });

  it('exposes isKnownRoute helper', () => {
    const { result } = renderHook(() => useRoute(), { wrapper: wrapper() });
    expect(result.current.isKnownRoute('/mcp')).toBe(true);
    expect(result.current.isKnownRoute('/nope')).toBe(false);
  });

  it('follows a known deep-link hashchange and persists it', () => {
    const { result } = renderHook(() => useRoute(), { wrapper: wrapper('/dashboard') });

    act(() => fireHashChange('#/analytics'));

    expect(result.current.currentRoute).toBe('/analytics');
    expect(result.current.history).toEqual(['/dashboard', '/analytics']);
    expect(safeStorage.getItem(ROUTE_STORAGE_KEY)).toBe('/analytics');
  });

  it('follows an unknown hashchange for view/URL consistency but does not persist it', () => {
    const { result } = renderHook(() => useRoute(), { wrapper: wrapper('/dashboard') });

    act(() => fireHashChange('#/not-a-real-route'));

    expect(result.current.currentRoute).toBe('/not-a-real-route');
    expect(result.current.isKnownRoute(result.current.currentRoute)).toBe(false);
    // Bad deep links must not be restored on relaunch.
    expect(safeStorage.getItem(ROUTE_STORAGE_KEY)).toBeNull();
  });

  it('ignores a hashchange that matches the current route (no duplicate history)', () => {
    const { result } = renderHook(() => useRoute(), { wrapper: wrapper('/dashboard') });

    act(() => fireHashChange('#/dashboard'));

    expect(result.current.currentRoute).toBe('/dashboard');
    expect(result.current.history).toEqual(['/dashboard']);
  });
});
