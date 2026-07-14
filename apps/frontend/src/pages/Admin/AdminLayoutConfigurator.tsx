import { GlassCard, PremiumButton } from '@/components/ui';
import { authFetch } from '@/utils/authToken';
import { LayoutDashboard, RefreshCw, Shield } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const ADMIN_QUICK_LINKS = [
  { label: 'Control Panel', href: '/admin/control-panel' },
  { label: 'User Management', href: '/admin/user-management' },
  { label: 'System Health', href: '/admin/system-health' },
  { label: 'Audit Logs', href: '/admin/audit-logs' },
  { label: 'Feature Flags', href: '/admin/feature-flags' },
  { label: 'Configuration', href: '/admin/configuration' },
  { label: 'Agent Management', href: '/admin/agent-management' },
  { label: 'Workspace Management', href: '/admin/workspaces' },
] as const;

type SystemHealthSummary = {
  status?: string;
  uptime?: string;
  version?: string;
};

export default function AdminLayoutConfigurator() {
  const [health, setHealth] = useState<SystemHealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch('/api/system/health');
      if (!response.ok) {
        throw new Error(`Health check failed (${response.status})`);
      }
      const payload = await response.json();
      setHealth({
        status: payload?.status || payload?.health?.status,
        uptime: payload?.uptime || payload?.health?.uptime,
        version: payload?.version || payload?.build?.version,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load system health');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="w-7 h-7 text-purple-400" />
            Admin Layout Console
          </h1>
          <p className="text-muted-foreground mt-1">
            Super-admin navigation hub and live system shell status.
          </p>
        </div>
        <PremiumButton variant="outline" onClick={loadHealth} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </PremiumButton>
      </div>

      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          System shell
        </h2>
        {error ? (
          <p className="text-red-300 text-sm">{error}</p>
        ) : loading ? (
          <p className="text-muted-foreground text-sm">Checking system health…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="text-white font-medium">{health?.status || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Uptime</p>
              <p className="text-white font-medium">{health?.uptime || '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Version</p>
              <p className="text-white font-medium">{health?.version || '—'}</p>
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Admin surfaces</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ADMIN_QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
