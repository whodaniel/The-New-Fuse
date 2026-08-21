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
  /** Known route but omitted from primary sidebar (summoned / deep-link only). */
  navHidden?: boolean;
}

export const ROUTE_STORAGE_KEY = 'tnf.desktop.lastRoute';

/** Legacy hashes from older desktop IA — resolve before boot / navigate. */
export const LEGACY_ROUTE_REDIRECTS: Record<string, string> = {
  '/browser': '/computer-use',
  '/oagi': '/computer-use',
  '/antigravity': '/agents',
};

export const NAV_GROUPS: NavGroup[] = [
  { id: 'home', label: 'Home' },
  { id: 'operate', label: 'Operate' },
  { id: 'agents', label: 'Agents' },
  { id: 'build', label: 'Build' },
  { id: 'insights', label: 'Insights' },
  { id: 'bridge', label: 'Bridge' },
  { id: 'system', label: 'System' },
];

/** Groups shown only after "More" unless the active route lives inside them. */
export const SECONDARY_NAV_GROUPS: NavGroupId[] = ['build', 'insights', 'bridge'];

export function isSecondaryNavGroup(groupId: NavGroupId): boolean {
  return SECONDARY_NAV_GROUPS.includes(groupId);
}

export const DESKTOP_ROUTES: DesktopRoute[] = [
  { id: 'platform', path: '/platform', label: 'Platform', group: 'home', badge: 'TNF' },
  {
    id: 'mission',
    path: '/mission',
    label: 'Mission Control',
    group: 'home',
    badge: 'LIVE',
    keywords: ['goals', 'cron', 'schedule', 'terminal', 'mirror', 'windows'],
  },
  { id: 'dashboard', path: '/dashboard', label: 'Dashboard', group: 'home' },
  {
    id: 'voice',
    path: '/voice',
    label: 'Voice Bridge',
    group: 'operate',
    badge: 'LIVE',
    keywords: ['mic', 'tts', 'speaker', 'beam', 'listen', 'stt'],
  },
  { id: 'terminal', path: '/terminal', label: 'Swarm Terminal', group: 'operate' },
  {
    id: 'library',
    path: '/library',
    label: 'Virtual Library',
    group: 'operate',
    badge: '3D',
    keywords: ['library', 'story', 'timeline', '3d', 'offline'],
  },
  { id: 'agents', path: '/agents', label: 'Agent Hub', group: 'agents' },
  { id: 'a2a', path: '/a2a', label: 'A2A Control', group: 'agents' },
  { id: 'chat', path: '/chat', label: 'Multi-Agent Chat', group: 'agents', keywords: ['chat'] },
  { id: 'knowledge', path: '/knowledge', label: 'Knowledge Hub', group: 'agents' },
  {
    id: 'computer-use',
    path: '/computer-use',
    label: 'Computer Use',
    group: 'agents',
    badge: 'TOOLS',
    keywords: ['browser', 'oagi', 'screen', 'forefront', 'extension', 'webview'],
    navHidden: true,
  },
  { id: 'workflows', path: '/workflows', label: 'Workflows', group: 'build' },
  { id: 'mcp', path: '/mcp', label: 'MCP Store', group: 'build' },
  { id: 'analytics', path: '/analytics', label: 'Analytics', group: 'insights' },
  { id: 'web-hub', path: '/web-hub', label: 'Web Parity', group: 'bridge', badge: 'WEB' },
  { id: 'settings', path: '/settings', label: 'Settings', group: 'system' },
];

export const KNOWN_ROUTE_PATHS = new Set(DESKTOP_ROUTES.map((route) => route.path));

export const DEFAULT_ROUTE = '/dashboard';

export function resolveLegacyRedirect(path: string): string {
  return LEGACY_ROUTE_REDIRECTS[path] || path;
}

export function isKnownRoute(path: string): boolean {
  const resolved = resolveLegacyRedirect(path);
  return KNOWN_ROUTE_PATHS.has(resolved) || KNOWN_ROUTE_PATHS.has(path);
}

export function getRouteByPath(path: string): DesktopRoute | undefined {
  const resolved = resolveLegacyRedirect(path);
  return DESKTOP_ROUTES.find((route) => route.path === resolved || route.path === path);
}

export function routesForGroup(groupId: NavGroupId): DesktopRoute[] {
  return DESKTOP_ROUTES.filter((route) => route.group === groupId && !route.navHidden);
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
    // An explicit deep link is authoritative even when it is unknown so the
    // router can render its recovery screen instead of silently opening home.
    return resolveLegacyRedirect(fromUrl);
  }

  const persisted = safeStorage.getItem(ROUTE_STORAGE_KEY);
  if (persisted) {
    const redirected = resolveLegacyRedirect(persisted);
    if (KNOWN_ROUTE_PATHS.has(redirected)) {
      return redirected;
    }
  }

  if (initialRoute) {
    const redirected = resolveLegacyRedirect(initialRoute);
    if (KNOWN_ROUTE_PATHS.has(redirected)) {
      return redirected;
    }
  }

  return DEFAULT_ROUTE;
}

export function persistRoute(path: string): void {
  const redirected = resolveLegacyRedirect(path);
  if (KNOWN_ROUTE_PATHS.has(redirected)) {
    safeStorage.setItem(ROUTE_STORAGE_KEY, redirected);
  }
}

export function desktopNativeOnlyRoutes(): DesktopRoute[] {
  return DESKTOP_ROUTES.filter((route) =>
    ['/computer-use', '/terminal', '/voice', '/library', '/web-hub'].includes(route.path)
  );
}
