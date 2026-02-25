import { motion, useInView } from 'framer-motion';
import {
  Bot,
  BrainCircuit,
  Chrome,
  Cpu,
  ExternalLink,
  Layers,
  MousePointer2,
  ShieldCheck,
  Workflow,
  Zap,
} from 'lucide-react';
import { useRef } from 'react';

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: any;
  title: string;
  description: string;
  delay: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="group relative rounded-2xl border border-slate-800 bg-slate-900/40 p-8 transition-all hover:border-cyan-500/50 hover:bg-slate-900/60"
    >
      <div className="absolute -inset-px rounded-2xl bg-linear-to-b from-cyan-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-slate-100">{title}</h3>
        <p className="text-sm leading-relaxed text-slate-400">{description}</p>
      </div>
    </motion.div>
  );
};

export default function ConnectExtensionPage() {
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });

  const features = [
    {
      icon: Cpu,
      title: 'Agentic Orchestration',
      description:
        "Seamlessly relay knowledge between your browser and the TNF Agentic Framework. Turn every website into a node in your AI's brain.",
      delay: 0.1,
    },
    {
      icon: MousePointer2,
      title: 'Human-Simulator Tech',
      description:
        'Advanced mouse and keyboard simulation allows agents to browse naturally, bypassing bot detection and interacting with complex SPAs.',
      delay: 0.2,
    },
    {
      icon: BrainCircuit,
      title: 'Semantic Scraping',
      description:
        'Go beyond HTML. Our expansion tree technology extracts deep semantic context, making every page readable for Large Language Models.',
      delay: 0.3,
    },
    {
      icon: Layers,
      title: 'Multi-Agent Sync',
      description:
        'Deduped relay channels ensure multiple agents can collaborate on the same page without feedback loops or interference.',
      delay: 0.4,
    },
    {
      icon: Zap,
      title: 'Floating Command Hub',
      description:
        'A rich, glassmorphic UI that lives on top of any site. Control your agents, switch channels, and view AI logs in real-time.',
      delay: 0.5,
    },
    {
      icon: ShieldCheck,
      title: 'Security & Sandbox',
      description:
        'Enterprise-grade isolation for your browsing sessions. Secured relay ensures your data only flows where you want it.',
      delay: 0.6,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-slate-100 selection:bg-cyan-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8">
        {/* Hero Section */}
        <section ref={heroRef} className="mb-32 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isHeroInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/5 px-4 py-1.5 text-sm font-semibold text-cyan-400"
          >
            <Chrome className="h-4 w-4" />
            <span>The New Fuse Chrome Extension</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-6 text-5xl font-extrabold tracking-tight sm:text-7xl"
          >
            The Ultimate{' '}
            <span className="bg-linear-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Agentic Bridge
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mx-auto mb-12 max-w-2xl text-lg text-slate-400"
          >
            TNF Connect elevates your browser into a powerhouse of agentic intelligence. Orchestrate
            complex workflows, extract structured knowledge, and enable autonomous agents to
            navigate the web just like you do.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <button className="group relative flex items-center gap-2 h-14 px-8 rounded-xl bg-cyan-500 font-bold text-slate-950 transition-all hover:scale-105 hover:bg-cyan-400 active:scale-95">
              <span>Add to Chrome</span>
              <Chrome className="h-5 w-5" />
            </button>
            <button className="flex items-center gap-2 h-14 px-8 rounded-xl border border-slate-800 bg-slate-900/50 font-bold text-slate-100 transition-all hover:border-slate-700 hover:bg-slate-900 active:scale-95">
              <span>Watch Demo</span>
              <Workflow className="h-5 w-5" />
            </button>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="mb-32">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">System Features</h2>
            <p className="mt-4 text-slate-400">
              Hardened capabilities for the next generation of AI Browsing.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <FeatureCard key={i} {...feature} />
            ))}
          </div>
        </section>

        {/* Framework Integration Section */}
        <section className="mb-32 rounded-3xl border border-slate-800 bg-linear-to-br from-slate-900/80 to-slate-950/80 p-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h2 className="mb-6 text-3xl font-bold sm:text-4xl">Agentic Framework DNA</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1 h-5 w-5 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50">
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200">Autonomous Execution</h4>
                    <p className="text-sm text-slate-400">
                      Enable agents to execute browser-based tasks including account management,
                      research, and data entry.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 h-5 w-5 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/50">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200">Shared Context Memory</h4>
                    <p className="text-sm text-slate-400">
                      Browser state is synced to the TNF Knowledge base, allowing agents across
                      different interfaces (Desktop, Web, API) to share context.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 lg:pl-12">
              <div className="rounded-2xl border border-slate-700/50 bg-slate-900/90 p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500/50" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
                    <div className="h-3 w-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    Relay Terminal
                  </div>
                </div>
                <div className="space-y-4 font-mono text-xs">
                  <div className="text-cyan-400">[{'>'}] Initializing TNF Connect v7...</div>
                  <div className="text-slate-500">
                    [*] Scanning Youtube Context... Found 12 video seeds.
                  </div>
                  <div className="text-purple-400">
                    [*] Orchestrator: Assigning Task "Summary & Index" to Agent-X.
                  </div>
                  <div className="text-slate-300">
                    [*] Agent-X: Extracting accessibility tree for interactive elements...
                  </div>
                  <div className="text-green-400">
                    [*] Success: Context relayed to Channel #market-intelligence.
                  </div>
                  <div className="animate-pulse inline-block w-2 h-4 bg-slate-500 ml-1" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links Footer */}
        <section className="text-center">
          <h3 className="mb-8 text-xl font-bold text-slate-300">Ecosystem Quick Links</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { label: 'AI Studio', href: 'https://aistudio.google.com/', icon: Bot },
              { label: 'NotebookLM', href: 'https://notebooklm.google.com/', icon: BrainCircuit },
              { label: 'TNF Documentation', href: '/docs', icon: ExternalLink },
            ].map((link, i) => (
              <a
                key={i}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-6 py-3 rounded-xl border border-slate-800 bg-slate-900/30 text-sm font-medium transition-all hover:border-slate-700 hover:bg-slate-900/60"
              >
                <link.icon className="h-4 w-4 text-cyan-400" />
                <span>{link.label}</span>
              </a>
            ))}
          </div>
        </section>
      </div>

      {/* Modern Footer */}
      <footer className="mt-32 border-t border-slate-900 bg-slate-950/50 py-12 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} The New Fuse. All rights reserved.</p>
        <div className="mt-4 flex justify-center gap-6">
          <a href="#" className="hover:text-cyan-400 transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-cyan-400 transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-cyan-400 transition-colors">
            Support
          </a>
        </div>
      </footer>
    </div>
  );
}
