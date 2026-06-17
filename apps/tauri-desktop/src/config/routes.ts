import { safeStorage } from '../lib/safeStorage';

export type NavGroupId = 'home' | 'operate' | 'agents' | 'build' | 'insights' | 'bridge' | 'system';

export interface NavGroup {
  id: NavGroupId;
  label: string;
}

export interface DesktopRoute {
  id: string;
  path: string;
  label: string;
  group: NavGroupId;
  badge?: string;
  keywords?: string[];
}

export const ROUTE_STORAGE_KEY = 'tnf.desktop.lastRoute';

export const NAV_GROUPS: NavGroup[] = [
  { id: 'home', label: 'Home' },
  { id: 'operate', label: 'Operate' },
  { id: 'agents', label: 'Agents' },
  { id: 'build', label: 'Build' },
  { id: 'insights', label: 'Insights' },
  { id: 'bridge', label: 'Bridge' },
  { id: 'system', label: 'System' },
];

export const DESKTOP_ROUTES: DesktopRoute[] = [
  { id: 'platform', path: '/platform', label: 'Platform', group: 'home', badge: 'TNF' },
  { id: 'dashboard', path: '/dashboard', label: 'Dashboard', group: 'home' },
  {
    id: 'browser',
    path: '/browser',
    label: 'Browser Control',
    group: 'operate',
    badge: 'FOREFRONT',
    keywords: ['forefront', 'extension', 'webview'],
  },
  { id: 'terminal', path: '/terminal', label: 'Swarm Terminal', group: 'operate' },
  { id: 'oagi', path: '/oagi', label: 'OAGI Hub', group: 'operate' },
  { id: 'antigravity', path: '/antigravity', label: 'Antigravity', group: 'operate' },
  { id: 'agents', path: '/agents', label: 'Agent Hub', group: 'agents' },
  { id: 'a2a', path: '/a2a', label: 'A2A Control', group: 'agents' },
  { id: 'chat', path: '/chat', label: 'Multi-Agent Chat', group: 'agents', keywords: ['chat'] },
  { id: 'knowledge', path: '/knowledge', label: 'Knowledge Hub', group: 'agents' },
  { id: 'workflows', path: '/workflows', label: 'Workflows', group: 'build' },
  { id: 'mcp', path: '/mcp', label: 'MCP Store', group: 'build' },
  { id: 'analytics', path: '/analytics', label: 'Analytics', group: 'insights' },
  { id: 'web-hub', path: '/web-hub', label: 'Web Parity', group: 'bridge', badge: 'WEB' },
  { id: 'settings', path: '/settings', label: 'Settings', group: 'system' },
];

export const KNOWN_ROUTE_PATHS = new Set(DESKTOP_ROUTES.map((route) => route.path));

export const DEFAULT_ROUTE = '/dashboard';

export function isKnownRoute(path: string): boolean {
  return KNOWN_ROUTE_PATHS.has(path);
}

export function getRouteByPath(path: string): DesktopRoute | undefined {
  return DESKTOP_ROUTES.find((route) => route.path === path);
}

export function routesForGroup(groupId: NavGroupId): DesktopRoute[] {
  return DESKTOP_ROUTES.filter((route) => route.group === groupId);
}

function readBootRouteFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const hashRoute = window.location.hash.startsWith('#/') ? window.location.hash.slice(1) : '';
    const params = new URLSearchParams(window.location.search);
    const queryRoute = params.get('route') || '';
    return hashRoute || queryRoute || null;
  } catch {
    return null;
  }
}

export function resolveBootRoute(initialRoute?: string): string {
  const fromUrl = readBootRouteFromUrl();
  if (fromUrl) {
    return fromUrl;
  }

  const persisted = safeStorage.getItem(ROUTE_STORAGE_KEY);
  if (persisted) {
    return persisted;
  }

  return initialRoute || DEFAULT_ROUTE;
}

export function persistRoute(path: string): void {
  if (isKnownRoute(path)) {
    safeStorage.setItem(ROUTE_STORAGE_KEY, path);
  }
}

export function desktopNativeOnlyRoutes(): DesktopRoute[] {
  return DESKTOP_ROUTES.filter((route) =>
    ['/browser', '/terminal', '/oagi', '/antigravity', '/web-hub'].includes(route.path)
  );
}
