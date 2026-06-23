import { GlassCard, PremiumButton } from '@/components/ui';
import { authFetch } from '@/utils/authToken';
import { CreditCard, Crown, RefreshCw, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type MembershipData = {
  active: boolean;
  tier: string;
  billingPeriod?: string;
  currentPeriodEnd?: string;
  status?: string;
};

export default function BillingPage() {
  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMembership = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch('/api/billing/membership/me');
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError('Sign in to view billing details.');
          setMembership(null);
          return;
        }
        throw new Error(`Billing service unavailable (${response.status})`);
      }
      const payload = await response.json();
      const data = payload?.data ?? payload;
      setMembership({
        active: Boolean(data?.active),
        tier: String(data?.tier || 'STARTER'),
        billingPeriod: data?.billingPeriod,
        currentPeriodEnd: data?.currentPeriodEnd,
        status: data?.status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load billing data');
      setMembership(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembership();
  }, [loadMembership]);

  const tierLabel = membership?.tier || 'STARTER';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-blue-400" />
            Billing & Membership
          </h1>
          <p className="text-muted-foreground mt-1">
            View your plan, renewal window, and upgrade options.
          </p>
        </div>
        <PremiumButton variant="outline" onClick={loadMembership} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </PremiumButton>
      </div>

      {error && (
        <GlassCard className="p-4 border border-red-500/30 text-red-200">{error}</GlassCard>
      )}

      <GlassCard className="p-6">
        {loading ? (
          <p className="text-muted-foreground">Loading membership…</p>
        ) : membership ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current plan</p>
                <p className="text-xl font-bold text-white">{tierLabel}</p>
              </div>
              <span
                className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${
                  membership.active
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {membership.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {membership.billingPeriod && (
              <p className="text-sm text-muted-foreground">
                Billing cycle: <span className="text-white">{membership.billingPeriod}</span>
              </p>
            )}
            {membership.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground">
                Renews:{' '}
                <span className="text-white">
                  {new Date(membership.currentPeriodEnd).toLocaleDateString()}
                </span>
              </p>
            )}
            {membership.status && (
              <p className="text-sm text-muted-foreground">
                Status: <span className="text-white">{membership.status}</span>
              </p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">No membership record found.</p>
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          Upgrade or change plan
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Manage subscriptions, payment methods, and enterprise billing from the membership portal.
        </p>
        <Link
          to="/membership"
          className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-md font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 transition-colors"
        >
          Open membership portal
        </Link>
      </GlassCard>
    </div>
  );
}
