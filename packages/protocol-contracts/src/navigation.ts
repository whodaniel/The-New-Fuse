import { z } from 'zod';

/**
 * TNF Surface Navigation Contract
 *
 * Single source of truth for route IDs, paths, and nav groupings across:
 *   - apps/frontend (web UI, port 3000)
 *   - apps/tauri-desktop (TNF Desktop, macOS .dmg/.app)
 *   - thenewfuse.com / app.thenewfuse.com (production)
 *
 * Lightweight add-on to @the-new-fuse/protocol-contracts. Apps re-export these
 * primitives from their local config/route files so lifecycle stays canonical.
 */

export const NavGroupIdSchema = z.enum([
  'home',
  'operate',
  'agents',
  'build',
  'insights',
  'bridge',
  'system',
  'marketing',
]);

export type NavGroupId = z.infer<typeof NavGroupIdSchema>;

export const SurfaceSchema = z.enum(['web', 'desktop', 'prod', 'all']);

export type TnfSurface = z.infer<typeof SurfaceSchema>;

export const DesktopRouteSchema = z.object({
  id: z.string(),
  path: z.string(),
  label: z.string(),
  group: NavGroupIdSchema,
  surfaces: z.array(SurfaceSchema).default(['all']),
  badge: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  deprecated: z.boolean().optional(),
});

export type DesktopRoute = z.infer<typeof DesktopRouteSchema>;

export const NavGroupSchema = z.object({
  id: NavGroupIdSchema,
  label: z.string(),
});

export type NavGroup = z.infer<typeof NavGroupSchema>;

export const ROUTE_STORAGE_KEY = 'tnf.desktop.lastRoute';

export const NAV_GROUPS: readonly NavGroup[] = [
  { id: 'home', label: 'Home' },
  { id: 'operate', label: 'Operate' },
  { id: 'agents', label: 'Agents' },
  { id: 'build', label: 'Build' },
  { id: 'insights', label: 'Insights' },
  { id: 'bridge', label: 'Bridge' },
  { id: 'system', label: 'System' },
  { id: 'marketing', label: 'Marketing' },
] as const;

/**
 * Canonical route registry. Mirrors apps/tauri-desktop/src/config/routes.ts
 * by design. Web-only routes live in apps/frontend/src/config/routeCatalog.ts
 * but any path that ships in BOTH surfaces must be listed here.
 */
export const DESKTOP_ROUTES: readonly DesktopRoute[] = [
  { id: 'platform', path: '/platform', label: 'Platform', group: 'home', surfaces: ['desktop'] },
  { id: 'dashboard', path: '/dashboard', label: 'Dashboard', group: 'home', surfaces: ['all'] },
  {
    id: 'browser',
    path: '/browser',
    label: 'Browser Control',
    group: 'operate',
    surfaces: ['desktop'],
    badge: 'FOREFRONT',
    keywords: ['forefront', 'extension', 'webview'],
  },
  {
    id: 'terminal',
    path: '/terminal',
    label: 'Swarm Terminal',
    group: 'operate',
    surfaces: ['desktop'],
  },
  {
    id: 'oagi',
    path: '/oagi',
    label: 'OAGI Hub',
    group: 'operate',
    surfaces: ['desktop'],
  },
  {
    id: 'antigravity',
    path: '/antigravity',
    label: 'Antigravity',
    group: 'operate',
    surfaces: ['desktop'],
  },
  {
    id: 'voice',
    path: '/voice',
    label: 'Voice Bridge',
    group: 'operate',
    surfaces: ['desktop'],
    badge: 'LIVE',
    keywords: ['mic', 'tts', 'speaker', 'beam', 'listen'],
  },
  {
    id: 'library',
    path: '/library',
    label: 'Virtual Library',
    group: 'operate',
    surfaces: ['desktop'],
    badge: '3D',
    keywords: ['library', 'story', 'timeline', '3d', 'offline'],
  },
  {
    id: 'agents',
    path: '/agents',
    label: 'Agent Hub',
    group: 'agents',
    surfaces: ['all'],
  },
  {
    id: 'a2a',
    path: '/a2a',
    label: 'A2A Control',
    group: 'agents',
    surfaces: ['desktop'],
  },
  {
    id: 'chat',
    path: '/chat',
    label: 'Multi-Agent Chat',
    group: 'agents',
    surfaces: ['all'],
    keywords: ['chat'],
  },
  {
    id: 'knowledge',
    path: '/knowledge',
    label: 'Knowledge Hub',
    group: 'agents',
    surfaces: ['desktop'],
  },
  {
    id: 'workflows',
    path: '/workflows',
    label: 'Workflows',
    group: 'build',
    surfaces: ['all'],
  },
  {
    id: 'mcp',
    path: '/mcp',
    label: 'MCP Store',
    group: 'build',
    surfaces: ['all'],
  },
  {
    id: 'analytics',
    path: '/analytics',
    label: 'Analytics',
    group: 'insights',
    surfaces: ['all'],
  },
  {
    id: 'web-hub',
    path: '/web-hub',
    label: 'Web Parity',
    group: 'bridge',
    surfaces: ['desktop'],
    badge: 'WEB',
  },
  {
    id: 'settings',
    path: '/settings',
    label: 'Settings',
    group: 'system',
    surfaces: ['all'],
  },
] as const;

export const KNOWN_ROUTE_PATHS: ReadonlySet<string> = new Set(
  DESKTOP_ROUTES.map((route) => route.path)
);

export const DEFAULT_ROUTE = '/dashboard';

export function isKnownRoute(path: string): boolean {
  return KNOWN_ROUTE_PATHS.has(path);
}

export function getRouteByPath(path: string): DesktopRoute | undefined {
  return DESKTOP_ROUTES.find((route) => route.path === path);
}

export function routesForGroup(group: NavGroupId): DesktopRoute[] {
  return DESKTOP_ROUTES.filter((route) => route.group === group);
}

export function filterBySurface(surface: TnfSurface): DesktopRoute[] {
  if (surface === 'all') return [...DESKTOP_ROUTES];
  return DESKTOP_ROUTES.filter((r) => r.surfaces.includes(surface) || r.surfaces.includes('all'));
}

/**
 * Drift detector: emits paths that exist in the legacy local registry but not
 * in the canonical DESKTOP_ROUTES. Used by pnpm --filter checks.
 */
export function detectDrift(localPaths: readonly string[]): {
  missing: string[];
  deprecated: string[];
} {
  const canonical = new Set(KNOWN_ROUTE_PATHS);
  const missing = localPaths.filter((p) => !canonical.has(p));
  const deprecated = [...KNOWN_ROUTE_PATHS].filter((p) => !localPaths.includes(p));
  return { missing, deprecated };
}
