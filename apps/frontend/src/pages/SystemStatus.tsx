import { API_BASE } from '@/config/api';
import { Activity, AlertTriangle, Clock3, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ProbeState = 'checking' | 'healthy' | 'degraded' | 'unavailable';

type ProbeId = 'gateway' | 'mesh' | 'master-clock' | 'analytics';

type ProbeResult = {
  id: ProbeId;
  label: string;
  description: string;
  state: ProbeState;
  message: string;
  checkedAt?: string;
  latencyMs?: number;
  statusCode?: number;
  endpoint?: string;
  attempts: number;
  details?: string;
};

type ProbeDefinition = {
  id: ProbeId;
  label: string;
  description: string;
  candidates: string[];
  validate: (payload: unknown) => Pick<ProbeResult, 'state' | 'message' | 'details'>;
};

const POLL_INTERVAL_MS = 15000;
const REQUEST_TIMEOUT_MS = 8000;

const normalizePath = (value: string) => value.replace(/\/+$/, '');

const unique = (values: string[]) =>
  Array.from(new Set(values.map((value) => normalizePath(value))));

const unwrapPayload = (payload: unknown): Record<string, any> => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  const obj = payload as Record<string, any>;
  if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
    return obj.data as Record<string, any>;
  }
  return obj;
};

const toLower = (value: unknown) => (typeof value === 'string' ? value.toLowerCase() : '');

const buildHealthCandidates = (apiBase: string) => {
  const primary = normalizePath(apiBase);
  const withoutVersion = primary.replace(/\/v\d+$/, '');
  return unique([
    `${primary}/health`,
    `${withoutVersion}/health`,
    '/api/v1/health',
    '/api/health',
    '/health',
  ]);
};

const buildSystemCandidates = (apiBase: string, route: string) => {
  const primary = normalizePath(apiBase);
  const withoutVersion = primary.replace(/\/v\d+$/, '');
  const suffix = route.startsWith('/') ? route : `/${route}`;
  return unique([
    `${primary}/system${suffix}`,
    `${withoutVersion}/system${suffix}`,
    `/api/v1/system${suffix}`,
    `/api/system${suffix}`,
  ]);
};

const buildAnalyticsBaseCandidates = (apiBase: string): string[] => {
  const primary = normalizePath(apiBase);
  const withoutVersion = primary.replace(/\/v\d+$/, '');
  return unique([
    `${primary}/analytics/default`,
    `${withoutVersion}/analytics/default`,
    '/api/v1/analytics/default',
    '/api/analytics/default',
    '/analytics/default',
  ]);
};

const getDefaultProbes = (apiBase: string): ProbeDefinition[] => [
  {
    id: 'gateway',
    label: 'API Gateway',
    description: 'Core API health endpoint response.',
    candidates: buildHealthCandidates(apiBase),
    validate: (payload) => {
      const data = unwrapPayload(payload);
      const status = toLower(data.status || data.overall);
      if (status === 'healthy' || status === 'ok' || status === 'operational') {
        return { state: 'healthy', message: 'Gateway is responding normally.' };
      }
      if (status === 'degraded') {
        return {
          state: 'degraded',
          message: 'Gateway is reachable but reporting degraded service.',
        };
      }
      return { state: 'healthy', message: 'Gateway endpoint is reachable.' };
    },
  },
  {
    id: 'mesh',
    label: 'Service Mesh',
    description: 'Cross-service health from the system mesh.',
    candidates: buildSystemCandidates(apiBase, '/mesh-health'),
    validate: (payload) => {
      const data = unwrapPayload(payload);
      const serviceMap =
        data.services && typeof data.services === 'object' && !Array.isArray(data.services)
          ? (data.services as Record<string, unknown>)
          : (data as Record<string, unknown>);
      const entries = Object.entries(serviceMap).filter(([key]) => key !== 'timestamp');
      if (!entries.length) {
        return {
          state: 'degraded',
          message: 'Mesh endpoint responded but returned no service data.',
        };
      }
      const healthyCount = entries.filter(([, value]) => Boolean(value)).length;
      if (healthyCount === entries.length) {
        return {
          state: 'healthy',
          message: `${healthyCount}/${entries.length} services are healthy.`,
        };
      }
      return {
        state: 'degraded',
        message: `${healthyCount}/${entries.length} services are healthy.`,
      };
    },
  },
  {
    id: 'master-clock',
    label: 'Master Clock',
    description: 'Orchestration heartbeat and super-cycle telemetry.',
    candidates: buildSystemCandidates(apiBase, '/master-clock'),
    validate: (payload) => {
      const data = unwrapPayload(payload);
      const status = toLower(data.status);
      const orchestrator = data.orchestrator || {};
      const isActive = Boolean(orchestrator.isActive);
      if (status === 'ok' && isActive) {
        return {
          state: 'healthy',
          message: 'Master clock is active and publishing telemetry.',
        };
      }
      if (status === 'degraded' || !isActive) {
        return {
          state: 'degraded',
          message: 'Master clock responded but reports stale or inactive activity.',
        };
      }
      return { state: 'healthy', message: 'Master clock endpoint is reachable.' };
    },
  },
  {
    id: 'analytics',
    label: 'Analytics Readiness',
    description: 'Default analytics overview endpoint readiness.',
    candidates: buildAnalyticsBaseCandidates(apiBase).map(
      (base) => `${base}/overview?timeframe=24h`
    ),
    validate: (payload) => {
      const data = unwrapPayload(payload);
      const overview =
        data.overview && typeof data.overview === 'object' && !Array.isArray(data.overview)
          ? (data.overview as Record<string, unknown>)
          : data;
      const hasShape =
        Object.prototype.hasOwnProperty.call(overview, 'totalAgents') ||
        Object.prototype.hasOwnProperty.call(overview, 'activeAgents') ||
        Object.prototype.hasOwnProperty.call(overview, 'totalInteractions');

      if (hasShape) {
        return {
          state: 'healthy',
          message: 'Analytics overview endpoint is returning structured data.',
        };
      }
      return {
        state: 'degraded',
        message: 'Analytics endpoint responded but returned an unexpected payload shape.',
      };
    },
  },
];

const getStateClasses = (state: ProbeState) => {
  switch (state) {
    case 'healthy':
      return {
        badge: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/40',
        dot: 'bg-emerald-400',
      };
    case 'degraded':
      return {
        badge: 'bg-amber-500/15 text-amber-200 border-amber-400/40',
        dot: 'bg-amber-300',
      };
    case 'unavailable':
      return {
        badge: 'bg-rose-500/15 text-rose-200 border-rose-400/40',
        dot: 'bg-rose-400',
      };
    default:
      return {
        badge: 'bg-slate-600/30 text-slate-200 border-slate-400/30',
        dot: 'bg-slate-300',
      };
  }
};

const formatCheckedTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Not checked yet';

const initialProbeState = (probe: ProbeDefinition): ProbeResult => ({
  id: probe.id,
  label: probe.label,
  description: probe.description,
  state: 'checking',
  message: 'Checking now...',
  attempts: 0,
});

const shouldContinueFallback = (statusCode: number) =>
  statusCode === 404 ||
  statusCode === 405 ||
  statusCode === 401 ||
  statusCode === 403 ||
  statusCode >= 500;

const makeUnavailableResult = (
  probe: ProbeDefinition,
  attempts: number,
  checkedAt: string,
  statusCode?: number,
  details?: string
): ProbeResult => ({
  id: probe.id,
  label: probe.label,
  description: probe.description,
  state: 'unavailable',
  message: 'Service is currently unavailable. Please try again shortly.',
  attempts,
  checkedAt,
  statusCode,
  details,
});

export default function SystemStatus() {
  const probes = useMemo(() => getDefaultProbes(API_BASE), []);
  const [results, setResults] = useState<Record<ProbeId, ProbeResult>>(() =>
    probes.reduce(
      (acc, probe) => {
        acc[probe.id] = initialProbeState(probe);
        return acc;
      },
      {} as Record<ProbeId, ProbeResult>
    )
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const runProbe = useCallback(async (probe: ProbeDefinition): Promise<ProbeResult> => {
    let attemptCount = 0;
    let lastStatusCode = 0;
    let lastError = '';

    for (const endpoint of probe.candidates) {
      attemptCount += 1;
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const startedAt = performance.now();

      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          signal: controller.signal,
        });
        const latencyMs = Math.max(1, Math.round(performance.now() - startedAt));
        lastStatusCode = response.status;
        const checkedAt = new Date().toISOString();

        if (!response.ok) {
          if (shouldContinueFallback(response.status)) {
            continue;
          }

          return {
            id: probe.id,
            label: probe.label,
            description: probe.description,
            state: 'degraded',
            message: 'Service is reachable but currently returning errors.',
            attempts: attemptCount,
            statusCode: response.status,
            latencyMs,
            endpoint,
            checkedAt,
            details: `HTTP ${response.status}`,
          };
        }

        let payload: unknown = {};
        try {
          payload = await response.json();
        } catch {
          return {
            id: probe.id,
            label: probe.label,
            description: probe.description,
            state: 'degraded',
            message: 'Service responded with unreadable payload.',
            attempts: attemptCount,
            latencyMs,
            endpoint,
            checkedAt,
          };
        }

        const validated = probe.validate(payload);
        return {
          id: probe.id,
          label: probe.label,
          description: probe.description,
          state: validated.state,
          message: validated.message,
          attempts: attemptCount,
          latencyMs,
          endpoint,
          checkedAt,
          details: validated.details,
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Network request failed';
      } finally {
        window.clearTimeout(timer);
      }
    }

    return makeUnavailableResult(
      probe,
      attemptCount,
      new Date().toISOString(),
      lastStatusCode || undefined,
      lastError || undefined
    );
  }, []);

  const runChecks = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsRefreshing(true);
    setResults((current) =>
      probes.reduce(
        (acc, probe) => {
          const previous = current[probe.id] || initialProbeState(probe);
          acc[probe.id] = { ...previous, state: 'checking', message: 'Checking now...' };
          return acc;
        },
        {} as Record<ProbeId, ProbeResult>
      )
    );

    try {
      const settled = await Promise.all(probes.map((probe) => runProbe(probe)));
      setResults(
        settled.reduce(
          (acc, result) => {
            acc[result.id] = result;
            return acc;
          },
          {} as Record<ProbeId, ProbeResult>
        )
      );
      setLastUpdatedAt(new Date().toISOString());
    } finally {
      inFlightRef.current = false;
      setIsRefreshing(false);
    }
  }, [probes, runProbe]);

  useEffect(() => {
    void runChecks();
    const interval = window.setInterval(() => {
      void runChecks();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [runChecks]);

  const orderedResults = useMemo(() => probes.map((probe) => results[probe.id]), [probes, results]);

  const overallState: ProbeState = useMemo(() => {
    const states = orderedResults.map((result) => result?.state).filter(Boolean);
    if (!states.length || states.includes('checking')) return 'checking';
    if (states.includes('unavailable')) return 'unavailable';
    if (states.includes('degraded')) return 'degraded';
    return 'healthy';
  }, [orderedResults]);

  const overallMessage =
    overallState === 'healthy'
      ? 'All systems operational'
      : overallState === 'degraded'
        ? 'Some services are degraded'
        : overallState === 'unavailable'
          ? 'Multiple services unavailable'
          : 'Running health checks';

  const overallClasses = getStateClasses(overallState);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e293b_0%,_#020617_55%)] text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">System Status</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">The New Fuse Status</h1>
              <p className="mt-2 text-sm text-slate-300">
                Live service checks refresh every {Math.round(POLL_INTERVAL_MS / 1000)} seconds.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${overallClasses.badge}`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${overallClasses.dot}`} />
                {overallMessage}
              </span>
              <button
                type="button"
                onClick={() => void runChecks()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-400/30 bg-slate-800/80 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700/80 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh now'}
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" />
              Last checked: {formatCheckedTime(lastUpdatedAt ?? undefined)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Public path: /status
            </span>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {orderedResults.map((result) => {
            if (!result) return null;
            const stateClasses = getStateClasses(result.state);
            return (
              <article
                key={result.id}
                className="rounded-xl border border-white/10 bg-slate-900/65 p-5 backdrop-blur"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{result.label}</h2>
                    <p className="mt-1 text-sm text-slate-400">{result.description}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${stateClasses.badge}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${stateClasses.dot}`} />
                    {result.state}
                  </span>
                </div>

                <p className="mt-4 text-sm text-slate-200">{result.message}</p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400">
                  <span>Checked: {formatCheckedTime(result.checkedAt)}</span>
                  <span>Latency: {result.latencyMs ? `${result.latencyMs}ms` : 'n/a'}</span>
                  <span>Attempts: {result.attempts}</span>
                  <span>Endpoint resolved: {result.endpoint ? 'yes' : 'no'}</span>
                </div>

                <details className="mt-4 rounded-md border border-slate-600/40 bg-slate-800/45 p-3 text-xs text-slate-300">
                  <summary className="cursor-pointer select-none text-slate-200">
                    Technical details
                  </summary>
                  <div className="mt-2 space-y-1">
                    <p>Endpoint: {result.endpoint || 'Not resolved'}</p>
                    <p>Info: {result.details || 'No extra details available.'}</p>
                  </div>
                </details>
              </article>
            );
          })}
        </section>

        <footer className="mt-6 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              If this page stays degraded or unavailable for more than a few minutes, contact
              support at{' '}
              <a href="/support" className="underline">
                /support
              </a>
              .
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
