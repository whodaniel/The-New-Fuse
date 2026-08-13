import { useAuth } from '@/hooks/useAuth';
import {
  getAuthSessionSnapshot,
  subscribeAuthSession,
  validateAuthSession,
  type AuthConnectionState,
  type AuthSessionSnapshot,
} from '@/services/authSession';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function labelFor(state: AuthConnectionState): string {
  switch (state) {
    case 'authenticated':
      return 'Connected';
    case 'checking':
      return 'Checking…';
    case 'expired':
      return 'Session expired';
    case 'offline':
      return 'API offline';
    case 'unauthenticated':
      return 'Sign-in required';
    default:
      return 'Auth unknown';
  }
}

function toneFor(state: AuthConnectionState): string {
  switch (state) {
    case 'authenticated':
      return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200';
    case 'checking':
      return 'border-sky-500/40 bg-sky-500/10 text-sky-200';
    case 'expired':
      return 'border-amber-500/40 bg-amber-500/15 text-amber-100';
    case 'offline':
      return 'border-rose-500/40 bg-rose-500/15 text-rose-100';
    case 'unauthenticated':
      return 'border-slate-500/40 bg-slate-800/80 text-slate-200';
    default:
      return 'border-slate-600 bg-slate-900 text-slate-300';
  }
}

/**
 * Proactive auth telemetry chip — pings /api/auth/session and reflects connection state.
 */
export default function AuthConnectionChip({ compact = false }: { compact?: boolean }) {
  const { isAuthenticated, user } = useAuth();
  const [session, setSession] = useState<AuthSessionSnapshot>(() => getAuthSessionSnapshot());

  useEffect(() => {
    const unsub = subscribeAuthSession(setSession);
    void validateAuthSession();
    const timer = window.setInterval(() => {
      void validateAuthSession();
    }, 60_000);
    return () => {
      unsub();
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    // Re-validate when AuthProvider user flips.
    void validateAuthSession();
  }, [isAuthenticated, user?.id]);

  const state = session.state;
  const label = labelFor(state);
  const detail =
    state === 'authenticated'
      ? session.user?.email || user?.email || session.user?.name || 'Signed in'
      : session.lastError || (compact ? label : 'Token validated via /api/auth/session');

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${toneFor(state)}`}
      title={detail}
      role="status"
      aria-live="polite"
    >
      <span
        className={`h-2 w-2 rounded-full ${
          state === 'authenticated'
            ? 'bg-emerald-400'
            : state === 'checking'
              ? 'bg-sky-400 animate-pulse'
              : state === 'expired'
                ? 'bg-amber-400'
                : state === 'offline'
                  ? 'bg-rose-400'
                  : 'bg-slate-400'
        }`}
      />
      <span className="font-medium">{label}</span>
      {!compact && state === 'authenticated' ? (
        <span className="max-w-[160px] truncate opacity-80">{detail}</span>
      ) : null}
      {(state === 'unauthenticated' || state === 'expired') && (
        <Link to="/auth/login" className="underline underline-offset-2 hover:opacity-90">
          Connect
        </Link>
      )}
      {state === 'offline' || state === 'expired' ? (
        <button
          type="button"
          className="underline underline-offset-2 hover:opacity-90"
          onClick={() => void validateAuthSession()}
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
