import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  Compass,
  GitBranch,
  LayoutDashboard,
  Library,
  Lock,
  Settings2,
  Users,
} from 'lucide-react';

export default function MarketplacePublicPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px]" />
          <div className="absolute top-16 right-1/4 h-72 w-72 rounded-full bg-blue-500/20 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-20 lg:py-24">
          <div className="flex items-center gap-4 mb-6">
            <img
              src="/assets/brand/logo-monogram-neon.png"
              alt="The New Fuse"
              className="h-12 w-12 rounded-xl object-cover shadow-lg"
            />
            <span className="text-xs uppercase tracking-[0.2em] text-cyan-300">
              The New Fuse Platform
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight">
            One Platform.
            <br />
            <span className="bg-linear-to-r from-cyan-300 via-blue-300 to-sky-400 bg-clip-text text-transparent">
              Clear Public Experience.
            </span>
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-slate-300 leading-relaxed">
            This page is a public orientation layer for The New Fuse. It explains where to go, what
            each surface does, and how users move through the product. It is intentionally not a
            store or item marketplace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 px-5 py-3 font-bold hover:bg-slate-100 transition-colors"
            >
              Open Dashboard <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/docs"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 font-semibold hover:bg-white/10 transition-colors"
            >
              Read Docs
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">Public Surfaces</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <LayoutDashboard className="h-5 w-5 text-cyan-300" />
            <h3 className="mt-3 text-lg font-bold">Dashboard</h3>
            <p className="mt-2 text-sm text-slate-300">
              Operational center for active work, current sessions, and high-signal status.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <Bot className="h-5 w-5 text-blue-300" />
            <h3 className="mt-3 text-lg font-bold">Agents</h3>
            <p className="mt-2 text-sm text-slate-300">
              Configure and run agent flows, orchestration patterns, and collaboration topology.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <GitBranch className="h-5 w-5 text-sky-300" />
            <h3 className="mt-3 text-lg font-bold">Workflows</h3>
            <p className="mt-2 text-sm text-slate-300">
              Build repeatable automations and connect execution logic across product surfaces.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">Where To Go Next</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              href: '/agents',
              title: 'Agents',
              description: 'Create, manage, and coordinate agents.',
              icon: Users,
            },
            {
              href: '/workflows',
              title: 'Workflows',
              description: 'Design automation pipelines and execution chains.',
              icon: GitBranch,
            },
            {
              href: '/knowledge-hub',
              title: 'Knowledge Hub',
              description: 'Reference docs, shared context, and artifacts.',
              icon: Library,
            },
            {
              href: '/mcp-hub',
              title: 'MCP Hub',
              description: 'Manage context protocol integrations and connectivity.',
              icon: Compass,
            },
          ].map(({ href, title, description, icon: Icon }, index) => (
            <motion.a
              key={href}
              href={href}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-colors"
            >
              <Icon className="h-5 w-5 text-cyan-300" />
              <h3 className="mt-3 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm text-slate-300">{description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">
                Open {title}
                <ArrowRight className="w-4 h-4" />
              </span>
            </motion.a>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-amber-300" />
              <h3 className="text-lg font-bold">Backend Controls Are Separate</h3>
            </div>
            <p className="mt-2 text-sm text-slate-300">
              Publishing and moderation controls are restricted to admin interfaces and are not part
              of this public page.
            </p>
            <a
              href="/admin/marketplace"
              className="mt-4 inline-flex items-center gap-2 text-sm text-amber-300"
            >
              Admin Controls
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-3">
              <Settings2 className="h-5 w-5 text-cyan-300" />
              <h3 className="text-lg font-bold">Public Orientation Layer</h3>
            </div>
            <p className="mt-2 text-sm text-slate-300">
              This route remains available for compatibility but now acts as a product map, not a
              marketplace.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
