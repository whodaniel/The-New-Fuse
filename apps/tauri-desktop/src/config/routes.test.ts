import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_ROUTE,
  DESKTOP_ROUTES,
  ROUTE_STORAGE_KEY,
  desktopNativeOnlyRoutes,
  getRouteByPath,
  isKnownRoute,
  persistRoute,
  resolveBootRoute,
  routesForGroup,
} from './routes';

vi.mock('../lib/safeStorage', () => {
  const store = new Map<string, string>();
  return {
    safeStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      __clear: () => store.clear(),
    },
  };
});

import { safeStorage } from '../lib/safeStorage';

describe('routes registry', () => {
  it('registers 15 unique desktop routes', () => {
    expect(DESKTOP_ROUTES).toHaveLength(15);
    const paths = DESKTOP_ROUTES.map((route) => route.path);
    expect(new Set(paths).size).toBe(15);
  });

  it('classifies known vs unknown paths', () => {
    expect(isKnownRoute('/dashboard')).toBe(true);
    expect(isKnownRoute('/not-a-route')).toBe(false);
  });

  it('resolves route metadata by path', () => {
    expect(getRouteByPath('/chat')?.label).toBe('Multi-Agent Chat');
    expect(getRouteByPath('/missing')).toBeUndefined();
  });

  it('groups routes for sidebar sections', () => {
    const operate = routesForGroup('operate');
    expect(operate.map((r) => r.path)).toEqual(['/browser', '/terminal', '/oagi', '/antigravity']);
  });

  it('lists desktop-native bridge routes', () => {
    const native = desktopNativeOnlyRoutes().map((r) => r.path);
    expect(native).toContain('/browser');
    expect(native).toContain('/web-hub');
    expect(native).not.toContain('/chat');
  });
});

describe('route persistence', () => {
  beforeEach(() => {
    (safeStorage as { __clear?: () => void }).__clear?.();
    vi.stubGlobal('window', {
      location: { hash: '', search: '' },
    });
  });

  it('persists only known routes', () => {
    persistRoute('/agents');
    expect(resolveBootRoute()).toBe('/agents');
    persistRoute('/bogus');
    expect(resolveBootRoute()).toBe('/agents');
  });

  it('falls back to default when nothing persisted', () => {
    expect(resolveBootRoute()).toBe(DEFAULT_ROUTE);
  });

  it('prefers URL hash over persisted route', () => {
    persistRoute('/settings');
    vi.stubGlobal('window', {
      location: { hash: '#/terminal', search: '' },
    });
    expect(resolveBootRoute()).toBe('/terminal');
  });

  it('uses storage key constant', () => {
    expect(ROUTE_STORAGE_KEY).toBe('tnf.desktop.lastRoute');
  });
});
