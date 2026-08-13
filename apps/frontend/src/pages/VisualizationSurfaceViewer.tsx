import { AlertCircle, ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const ALLOWED_EXTENSIONS = ['.html', '.md', '.json', '.txt'];
const SURFACE_PATH_ALIASES: Record<string, string> = {
  '/visualizations/dashboard': '/visualizations/dashboard.html',
};

function deriveTitle(pathname: string) {
  const token = pathname.split('/').pop() || 'surface';
  const base = token.replace(/\.[a-z0-9]+$/i, '');
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function isAllowedSurfacePath(pathname: string) {
  if (!pathname.startsWith('/visualizations/')) return false;
  if (pathname.includes('..')) return false;
  if (pathname.includes('://') || pathname.startsWith('//')) return false;
  const normalized = pathname.toLowerCase();
  return ALLOWED_EXTENSIONS.some((extension) => normalized.endsWith(extension));
}

function normalizeSurfaceSource(rawSrc: string) {
  const trimmed = rawSrc.trim();
  if (!trimmed) return '';

  const [rawPath, rawQuery = ''] = trimmed.split('?');
  const aliasedPath = SURFACE_PATH_ALIASES[rawPath] || rawPath;
  return rawQuery ? `${aliasedPath}?${rawQuery}` : aliasedPath;
}

const VisualizationSurfaceViewer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [reloadTick, setReloadTick] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [failed, setFailed] = useState<boolean>(false);

  const rawSrc = normalizeSurfaceSource(searchParams.get('src') || '');
  const pathname = rawSrc.split('?')[0];
  const validSurface = isAllowedSurfacePath(pathname);
  const safeSrc = validSurface ? rawSrc : '';

  const title =
    (searchParams.get('title') || '').trim() || (validSurface ? deriveTitle(pathname) : 'Surface');
  const section = (searchParams.get('section') || '').trim();

  const frameSrc = useMemo(() => {
    if (!safeSrc) return '';
    if (reloadTick <= 0) return safeSrc;
    const delimiter = safeSrc.includes('?') ? '&' : '?';
    return `${safeSrc}${delimiter}embedRetry=${reloadTick}`;
  }, [safeSrc, reloadTick]);

  useEffect(() => {
    setLoading(true);
    setFailed(false);
  }, [safeSrc, reloadTick]);

  if (!validSurface) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_35%),linear-gradient(150deg,_#020617_0%,_#0b1120_40%,_#111827_100%)] text-slate-100">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            to="/visualizations"
            className="mb-5 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Visualizations
          </Link>
          <div className="rounded-3xl border border-rose-300/20 bg-rose-400/10 p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-rose-100">
              <AlertCircle className="h-4 w-4" />
              Invalid Surface Request
            </div>
            <h1 className="mt-3 text-2xl font-semibold text-white">
              This visualization source is blocked.
            </h1>
            <p className="mt-3 text-sm leading-6 text-rose-100/90">
              The requested path is outside the allowed visualization files or has an unsafe format.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_34%),linear-gradient(150deg,_#020617_0%,_#0b1120_40%,_#111827_100%)] text-slate-100">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/45 p-5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link
                to="/visualizations"
                className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Visualizations
              </Link>
              <h1 className="mt-3 text-2xl font-semibold text-white">{title}</h1>
              <p className="mt-1 text-sm text-slate-300">
                {section ? `${section} · ` : ''}Route-native viewer for legacy visualization assets.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs uppercase tracking-[0.16em] ${
                  failed
                    ? 'border-rose-300/30 bg-rose-400/10 text-rose-100'
                    : loading
                      ? 'border-amber-300/30 bg-amber-400/10 text-amber-100'
                      : 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100'
                }`}
              >
                {failed ? 'Load Failed' : loading ? 'Loading' : 'Loaded'}
              </span>
              <button
                type="button"
                onClick={() => setReloadTick((current) => current + 1)}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-500/10 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-500/20"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reload
              </button>
              <a
                href={safeSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-purple-300/35 bg-purple-500/10 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-purple-100 transition hover:border-purple-200 hover:bg-purple-500/20"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Raw
              </a>
            </div>
          </div>
        </div>

        <div className="relative h-[calc(100vh-180px)] min-h-[520px] overflow-hidden rounded-3xl border border-white/10 bg-slate-950/65">
          {loading ? (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-slate-950/70">
              <div className="rounded-2xl border border-white/10 bg-slate-900/75 px-5 py-3 text-sm text-slate-100">
                Loading surface…
              </div>
            </div>
          ) : null}

          {failed ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/85 p-4">
              <div className="w-full max-w-xl rounded-3xl border border-rose-300/20 bg-rose-400/10 p-6">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-rose-100">
                  <AlertCircle className="h-4 w-4" />
                  Surface Failed To Load
                </div>
                <p className="mt-3 text-sm leading-6 text-rose-100/90">
                  The embedded surface could not be rendered in the viewer. You can retry or open
                  the raw asset directly.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFailed(false);
                      setLoading(true);
                      setReloadTick((current) => current + 1);
                    }}
                    className="rounded-full border border-rose-200/35 bg-rose-500/20 px-4 py-2 text-sm text-rose-50 transition hover:bg-rose-500/30"
                  >
                    Retry In Viewer
                  </button>
                  <a
                    href={safeSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10"
                  >
                    Open Raw Surface
                  </a>
                </div>
              </div>
            </div>
          ) : null}

          <iframe
            key={frameSrc}
            src={frameSrc}
            title={title}
            className="h-full w-full border-none"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setFailed(true);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default VisualizationSurfaceViewer;
