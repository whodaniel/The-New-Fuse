import { describe, expect, it } from 'vitest';
import { ROUTE_COMPONENTS } from './routeComponents';
import { DESKTOP_ROUTES, KNOWN_ROUTE_PATHS } from './routes';

describe('route registry ↔ component map parity', () => {
  it('every registry route has a page component', () => {
    const missing = DESKTOP_ROUTES.filter((route) => !ROUTE_COMPONENTS[route.path]).map(
      (route) => route.path
    );
    expect(missing).toEqual([]);
  });

  it('every mapped component corresponds to a known route', () => {
    const orphaned = Object.keys(ROUTE_COMPONENTS).filter((path) => !KNOWN_ROUTE_PATHS.has(path));
    expect(orphaned).toEqual([]);
  });

  it('maps exactly the registry route count', () => {
    expect(Object.keys(ROUTE_COMPONENTS).length).toBe(DESKTOP_ROUTES.length);
  });
});
