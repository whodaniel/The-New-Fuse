import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
('use client');

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
      <h2 className="mb-4 text-2xl font-bold">Your Dashboard</h2>
      {loadError && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {loadError}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">${earnings.toLocaleString()}</p>
          </CardContent>
        </Card>

        {loading && (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Loading your apps...
            </CardContent>
          </Card>
        )}

        {!loading &&
          apps.map((app) => (
            <Card key={app.id}>
              <CardHeader>
                <CardTitle>{app.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Downloads: {app.downloads.toLocaleString()}</p>
                <p>Earnings: ${app.earnings.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}

        {!loading && apps.length === 0 && !loadError && (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              No applications are linked to this account yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
