import { authFetch } from '@/utils/authToken';
import { ArrowRight, Crown, Shield, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PayPalSubscriptionButton } from '../components/billing/PayPalSubscriptionButton';

const benefits = [
  {
    title: 'Priority Agent Support',
    description:
      'Direct hotline to our strategy architects and mission control for onboarding or upgrades.',
    icon: <Sparkles className="w-5 h-5 text-cyan-300" />,
  },
  {
    title: 'Beta Access',
    description: 'Early access to new AI agents, community modules, and live arcade releases.',
    icon: <Crown className="w-5 h-5 text-amber-400" />,
  },
  {
    title: 'Security & Compliance',
    description:
      'Dual-rail billing (PayPal + Stripe) with fraud monitoring that keeps the Protocol trusted.',
    icon: <Shield className="w-5 h-5 text-emerald-400" />,
  },
];

export default function Membership() {
  const stripeMembershipCheckoutUrl = (
    import.meta.env.VITE_STRIPE_MEMBERSHIP_CHECKOUT_URL || ''
  ).trim();
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const createStripeCheckout = async () => {
    setStripeLoading(true);
    setStripeError(null);
    try {
      const response = await authFetch('/api/billing/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: import.meta.env.VITE_STRIPE_MEMBERSHIP_PRICE_ID || undefined,
          mode: 'subscription',
          successUrl: `${window.location.origin}/membership?checkout=success`,
          cancelUrl: `${window.location.origin}/membership?checkout=cancel`,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create Stripe checkout session');
      }
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      setStripeError(err instanceof Error ? err.message : 'Stripe checkout failed');
    } finally {
      setStripeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative overflow-hidden pt-16 pb-24">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-cyan-500/20 to-transparent" />
        <div className="mx-auto max-w-6xl px-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.6em] text-cyan-400">Membership Billing</p>
              <h1 className="text-4xl font-black leading-tight sm:text-5xl xl:text-6xl">
                TNF Membership
                <br />
                <span className="text-cyan-300">Live access to AI-ARCADE & the Protocol</span>
              </h1>
              <p className="max-w-2xl text-base text-slate-300 sm:text-lg">
                Dual-rail billing is live. Subscribe with PayPal or Stripe to unlock Pro tier access
                to AI-ARCADE and the Protocol.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full border border-white/20 bg-white/5 px-4 py-1 text-xs font-black uppercase tracking-widest text-white">
                  Live — Pro Tier Available
                </span>
              </div>
            </div>
            <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-transparent/5 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Active Membership</p>
              <h2 className="mt-4 text-2xl font-black text-white">Join the Protocol</h2>
              <p className="mt-3 text-sm text-slate-300">
                Choose your checkout rail below. PayPal is the default recurring billing path;
                Stripe is available for agentic billing workflows.
              </p>
              <div className="mt-6 space-y-3">
                <PayPalSubscriptionButton />
                <button
                  onClick={createStripeCheckout}
                  disabled={stripeLoading}
                  className="w-full inline-flex items-center justify-center rounded-md border border-white/20 bg-transparent/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                  {stripeLoading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating Stripe session…
                    </span>
                  ) : (
                    'Checkout with Stripe'
                  )}
                </button>
                {stripeError && <p className="text-red-400 text-xs mt-2">{stripeError}</p>}
                {stripeMembershipCheckoutUrl && (
                  <a
                    href={stripeMembershipCheckoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex w-full items-center justify-center rounded-md border border-white/20 bg-transparent/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    Open Stripe Customer Portal
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-3 pb-24">
        <div className="grid gap-4 sm:grid-cols-3">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="flex flex-col gap-3 rounded-md border border-white/10 bg-transparent/5 p-4 text-sm text-slate-200"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-900/80">
                {benefit.icon}
              </div>
              <h3 className="text-base font-black text-white">{benefit.title}</h3>
              <p className="text-slate-400">{benefit.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-cyan-500/40 bg-cyan-500/5 p-4">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-100">How it works</p>
            <ol className="mt-4 space-y-4 text-sm text-slate-200">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-xs font-black uppercase">
                  1
                </span>
                Subscribe with PayPal or Stripe using the controls above.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-xs font-black uppercase">
                  2
                </span>
                We record the subscription on the server and mark you as{' '}
                <strong>active member</strong> in the community table.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-xs font-black uppercase">
                  3
                </span>
                Unlock all member-only routes in The New Fuse, including AI-ARCADE submissions and
                Ops dashboards.
              </li>
            </ol>
          </div>
          <div className="rounded-md border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Need help?</p>
            <p className="mt-4 text-sm text-slate-200">
              Membership questions? Reach our concierge by emailing{' '}
              <a className="text-cyan-300 underline" href="mailto:support@thenewfuse.com">
                support@thenewfuse.com
              </a>{' '}
              or jump into the live Discord. You can also visit{' '}
              <Link className="text-cyan-300 underline" to="/docs">
                Support
              </Link>{' '}
              to open a ticket.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-cyan-200"
            >
              Scroll to Subscribe <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
