/** Origins the local UI boot stack is expected to bind. */
export const LOCAL_UI_ORIGIN = 'http://localhost:1420';
export const LOCAL_WEB_APP_ORIGIN = 'http://localhost:5173';
export const LOCAL_BROWSER_CONTROL_ORIGIN = 'http://127.0.0.1:1421';

export const LOCAL_SEMANTIC_PATHS = {
  hub: '/visualizations/semantic/index.html',
  explorer: '/visualizations/semantic/unified_graph_explorer.html',
  wordcount: '/visualizations/semantic/wordcount_report.html',
} as const;

const LOOPBACK_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

export function isLoopbackHttpOrigin(origin: string): boolean {
  return LOOPBACK_ORIGIN.test(String(origin || '').replace(/\/$/, ''));
}

/**
 * Absolute URL for a static visualization served from the process that is
 * currently hosting the desktop UI. Falls back to :1420 (tnf boot local UI).
 */
export function localStaticSurfaceUrl(path: string, origin?: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  const candidate = (
    origin || (typeof window !== 'undefined' ? window.location.origin : '')
  ).replace(/\/$/, '');
  const base = isLoopbackHttpOrigin(candidate) ? candidate : LOCAL_UI_ORIGIN;
  return `${base}${suffix}`;
}
