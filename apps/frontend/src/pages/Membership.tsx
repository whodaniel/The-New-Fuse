import { ArrowRight, Crown, Shield, Sparkles } from 'lucide-react';
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
                Membership billing is paused during public beta. Hosted platform access is free
                while we validate orchestration, relay reliability, and the open-runtime install
                path.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full border border-cyan-500/60 bg-cyan-500/10 px-4 py-1 text-xs font-black uppercase tracking-widest text-cyan-200">
                  Beta — Free Access
                </span>
                <span className="rounded-full border border-white/15 px-4 py-1 text-xs uppercase tracking-[0.3em] text-slate-300">
                  Paid tiers coming soon
                </span>
              </div>
            </div>
            <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-transparent/5 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Active Membership</p>
              <h2 className="mt-4 text-2xl font-black text-white">Join the Protocol</h2>
              <p className="mt-3 text-sm text-slate-300">
                PayPal remains the default recurring billing path for thenewfuse.com. Stripe can run
                in parallel as an additional checkout rail for agentic billing workflows.
              </p>
              <div className="mt-6">
                <PayPalSubscriptionButton />
              </div>
              {stripeMembershipCheckoutUrl && (
                <a
                  href={stripeMembershipCheckoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-white/20 bg-transparent/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-transparent/15"
                >
                  Checkout with Stripe
                </a>
              )}
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
