import { ArrowRight, Crown, Shield, Sparkles } from 'lucide-react';
import React from 'react';
import { PayPalSubscriptionButton } from '../components/billing/PayPalSubscriptionButton';
import { Link } from 'react-router-dom';

const benefits = [
  {
    title: 'Priority Agent Support',
    description: 'Direct hotline to our strategy architects and mission control for onboarding or upgrades.',
    icon: <Sparkles className="w-5 h-5 text-cyan-300" />,
  },
  {
    title: 'Beta Access',
    description: 'Early access to new AI agents, community modules, and live arcade releases.',
    icon: <Crown className="w-5 h-5 text-amber-400" />,
  },
  {
    title: 'Security & Compliance',
    description: 'PayPal-backed recurring billing plus fraud monitoring that keeps the Protocol trusted.',
    icon: <Shield className="w-5 h-5 text-emerald-400" />,
  },
];

export default function Membership() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative overflow-hidden pt-16 pb-24">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-cyan-500/20 to-transparent" />
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.6em] text-cyan-400">PayPal Subscription</p>
              <h1 className="text-4xl font-black leading-tight sm:text-5xl xl:text-6xl">
                TNF Membership<br />
                <span className="text-cyan-300">Live access to AI-ARCADE & the Protocol</span>
              </h1>
              <p className="max-w-2xl text-base text-slate-300 sm:text-lg">
                Membership for The New Fuse is powered by PayPal — the same system used on aivideointel.thenewfuse.com. Subscribe once, stay active
                forever (until you cancel). Once you join, the community apps, agent studio, and mission control unlock instantly.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full border border-cyan-500/60 bg-cyan-500/10 px-4 py-1 text-xs font-black uppercase tracking-widest text-cyan-200">
                  PayPal subscription
                </span>
                <span className="rounded-full border border-white/15 px-4 py-1 text-xs uppercase tracking-[0.3em] text-slate-300">
                  $49 / month · $490 / year
                </span>
              </div>
            </div>
            <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Active Membership</p>
              <h2 className="mt-4 text-2xl font-black text-white">Join the Protocol</h2>
              <p className="mt-3 text-sm text-slate-300">
                Recurring billing is handled via PayPal, so you keep control over the card attached to your thenewfuse.com account.
                Pause or cancel directly from the PayPal dashboard.
              </p>
              <div className="mt-6">
                <PayPalSubscriptionButton />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/80">
                {benefit.icon}
              </div>
              <h3 className="text-base font-black text-white">{benefit.title}</h3>
              <p className="text-slate-400">{benefit.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-cyan-500/40 bg-cyan-500/5 p-6">
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-100">How it works</p>
            <ol className="mt-4 space-y-4 text-sm text-slate-200">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-xs font-black uppercase">
                  1
                </span>
                Subscribe via PayPal using the button above.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-xs font-black uppercase">
                  2
                </span>
                We record the subscription on the server and mark you as <strong>active member</strong> in the community table.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-xs font-black uppercase">
                  3
                </span>
                Unlock all member-only routes in The New Fuse, including AI-ARCADE submissions and Ops dashboards.
              </li>
            </ol>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Need help?</p>
            <p className="mt-4 text-sm text-slate-200">
              Membership questions? Reach our concierge by emailing <a className="text-cyan-300 underline" href="mailto:support@thenewfuse.com">support@thenewfuse.com</a> or jump into
              the live Discord. You can also visit <Link className="text-cyan-300 underline" to="/support">Support</Link> to open a ticket.
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
