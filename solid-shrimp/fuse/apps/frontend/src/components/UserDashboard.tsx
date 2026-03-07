'use client';
import { GlassCard as Card } from '@/components/ui/premium/GlassCard';
import { useEffect, useMemo, useState } from 'react';

interface UserApp {
  id: string;
  name: string;
  downloads: number;
  earnings: number;
}

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export function UserDashboard() {
  const [apps, setApps] = useState<UserApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadApps = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await fetch('/api/apps/my');
        if (!response.ok) throw new Error(`Dashboard data unavailable (${response.status})`);

        const payload = await response.json();
        const rows = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
        if (!mounted) return;

        setApps(
          rows.map((app: any, idx: number) => ({
            id: String(app?.id || `app-${idx}`),
            name: String(app?.name || 'Unnamed App'),
            downloads: toNumber(app?.downloads),
            earnings: toNumber(app?.earnings),
          }))
        );
      } catch (error: any) {
        if (!mounted) return;
        setApps([]);
        setLoadError(error?.message || 'Dashboard data unavailable');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadApps();
    return () => {
      mounted = false;
    };
  }, []);

  const earnings = useMemo(() => apps.reduce((sum, app) => sum + app.earnings, 0), [apps]);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4 text-white">Your Dashboard</h2>
      {loadError && (
        <div className="mb-4 rounded border border-amber-300 bg-amber-100/80 px-3 py-2 text-sm text-amber-900">
          {loadError}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Total Earnings" gradient="green" className="text-center">
          <p className="text-4xl font-bold text-white">${earnings.toLocaleString()}</p>
        </Card>
        {loading && (
          <Card title="Applications" gradient="blue">
            <p className="text-gray-300">Loading your apps...</p>
          </Card>
        )}
        {!loading &&
          apps.map((app) => (
            <Card key={app.id} title={app.name} gradient="blue">
              <div className="space-y-2">
                <p className="text-gray-300">Downloads: {app.downloads.toLocaleString()}</p>
                <p className="text-gray-300">Earnings: ${app.earnings.toLocaleString()}</p>
              </div>
            </Card>
          ))}
        {!loading && !loadError && apps.length === 0 && (
          <Card title="Applications" gradient="blue">
            <p className="text-gray-300">No applications are linked to this account yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
