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
  /** External URL for web-parity links that open in the browser */
  externalUrl?: string;
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
  {
    id: 'google-hub',
    path: '/google-hub',
    label: 'Google & Spark Hub',
    group: 'operate',
    badge: 'SYNC',
    keywords: ['google', 'tasks', 'spark', 'aistudio', 'gemini'],
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
  {
    id: 'ai-command-center',
    path: '/ai-command-center',
    label: 'Command Center',
    group: 'bridge',
    badge: 'WEB',
    externalUrl: 'https://thenewfuse.com/ai-command-center',
  },
  {
    id: 'workspace-overview',
    path: '/workspace-overview',
    label: 'Workspace',
    group: 'bridge',
    badge: 'WEB',
    externalUrl: 'https://thenewfuse.com/workspace/overview',
  },
  {
    id: 'live-view',
    path: '/live-view',
    label: 'Live View',
    group: 'bridge',
    badge: 'WEB',
    externalUrl: 'https://thenewfuse.com/live-view',
  },
  {
    id: 'timeline',
    path: '/timeline',
    label: 'Timeline',
    group: 'bridge',
    badge: 'WEB',
    externalUrl: 'https://thenewfuse.com/timeline',
  },
  { id: 'settings', path: '/settings', label: 'Settings', group: 'system' },
];

export const KNOWN_ROUTE_PATHS = new Set(DESKTOP_ROUTES.map((route) => route.path));

export const DEFAULT_ROUTE = '/dashboard';

/**
 * Hash deep-links may carry query (`#/workflows?id=…&source=local-ai`).
 * Route matching must use the path only; the page reads the query itself.
 */
export function splitHashPathAndQuery(raw: string): { path: string; search: string } {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return { path: '', search: '' };
  const q = trimmed.indexOf('?');
  if (q < 0) return { path: trimmed, search: '' };
  return { path: trimmed.slice(0, q), search: trimmed.slice(q + 1) };
}

export function resolveLegacyRedirect(path: string): string {
  const { path: clean } = splitHashPathAndQuery(path);
  return LEGACY_ROUTE_REDIRECTS[clean] || clean;
}

export function isKnownRoute(path: string): boolean {
  const resolved = resolveLegacyRedirect(path);
  return KNOWN_ROUTE_PATHS.has(resolved);
}

export function getRouteByPath(path: string): DesktopRoute | undefined {
  const resolved = resolveLegacyRedirect(path);
  return DESKTOP_ROUTES.find((route) => route.path === resolved);
}

export function routesForGroup(groupId: NavGroupId): DesktopRoute[] {
  return DESKTOP_ROUTES.filter((route) => route.group === groupId && !route.navHidden);
}

function readBootRouteFromUrl(): { path: string; search: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const hashRoute = window.location.hash.startsWith('#/') ? window.location.hash.slice(1) : '';
    if (hashRoute) return splitHashPathAndQuery(hashRoute);
    const params = new URLSearchParams(window.location.search);
    const queryRoute = params.get('route') || '';
    return queryRoute ? splitHashPathAndQuery(queryRoute) : null;
  } catch {
    return null;
  }
}

/** Preserve `?…` when normalizing the hash so local-ai deep links survive boot. */
export function formatHashRoute(path: string, search = ''): string {
  const clean = resolveLegacyRedirect(path);
  return search ? `#${clean}?${search}` : `#${clean}`;
}

export function resolveBootRoute(initialRoute?: string): string {
  const fromUrl = readBootRouteFromUrl();
  if (fromUrl?.path) {
    // An explicit deep link is authoritative even when it is unknown so the
    // router can render its recovery screen instead of silently opening home.
    return resolveLegacyRedirect(fromUrl.path);
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
