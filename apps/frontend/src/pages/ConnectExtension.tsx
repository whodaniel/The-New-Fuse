// @ts-nocheck
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Check,
  Code2,
  Cpu,
  ExternalLink,
  Fingerprint,
  Globe,
  Keyboard,
  MousePointer2,
  Network,
  Plug,
  Radio,
  Rocket,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Terminal,
  Video,
  Workflow,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/* ────────────────────────────────────────────── DESIGN TOKENS ── */
const gradientText = 'bg-clip-text text-transparent bg-gradient-to-r';
const glassCard =
  'relative rounded-md border border-white/[0.12] bg-transparent/[0.03] backdrop-blur-md transition-all duration-300';
const accentCyan = 'from-cyan-400 to-blue-500';
const accentPurple = 'from-purple-400 to-indigo-500';
const accentMixed = 'from-cyan-400 via-purple-400 to-pink-500';

/* ────────────────────────────────────────── FEATURE CARD ── */
const FeatureCard = ({
  icon: Icon,
  title,
  description,
  accent = accentCyan,
  delay = 0,
}: {
  icon: any;
  title: string;
  description: string;
  accent?: string;
  delay?: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`${glassCard} group p-7 hover:border-white/[0.15] hover:bg-transparent/[0.05] hover:shadow-[0_0_40px_rgba(0,200,255,0.06)]`}
    >
      <div
        className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br ${accent} shadow-none`}
      >
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
    </motion.div>
  );
};

/* ────────────────────────────────────────── PLATFORM BADGE ── */
const PlatformBadge = ({ name, delay }: { name: string; delay: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.4, delay }}
      className="flex items-center gap-2 rounded-full border border-white/[0.12] bg-transparent/[0.04] px-5 py-2.5 text-sm font-medium text-slate-300 backdrop-blur-sm transition-all hover:border-cyan-500/30 hover:bg-transparent/[0.07]"
    >
      <div className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
      {name}
    </motion.div>
  );
};

/* ────────────────────────────────────────── STEP CARD ── */
const StepCard = ({
  step,
  title,
  description,
  icon: Icon,
  delay,
}: {
  step: number;
  title: string;
  description: string;
  icon: any;
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
      className="relative flex flex-col items-center text-center"
    >
      <div className="relative mb-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/[0.1]">
          <Icon className="h-7 w-7 text-cyan-400" />
        </div>
        <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 text-xs font-bold text-white shadow-none">
          {step}
        </div>
      </div>
      <h4 className="mb-2 text-lg font-bold text-white">{title}</h4>
      <p className="max-w-xs text-sm text-slate-400">{description}</p>
    </motion.div>
  );
};

/* ────────────────────────────────────────── PRICING CARD ── */
const PricingCard = ({
  title,
  price,
  period,
  features,
  cta,
  href,
  highlighted = false,
  badge,
  delay,
}: {
  title: string;
  price: string;
  period?: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
  badge?: string;
  delay: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className={`relative flex flex-col rounded-md border p-4 ${
        highlighted
          ? 'border-cyan-500/40 bg-gradient-to-b from-cyan-500/[0.08] to-transparent shadow-[0_0_60px_rgba(0,200,255,0.1)]'
          : 'border-white/[0.12] bg-transparent/[0.03]'
      }`}
    >
      {badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-none">
          {badge}
        </div>
      )}

      <div className="mb-6">
        <h3 className="mb-1 text-lg font-bold text-white">{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold text-white">{price}</span>
          {period && <span className="text-sm text-slate-400">{period}</span>}
        </div>
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-bold transition-all duration-200 ${
          highlighted
            ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-none hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98]'
            : 'border border-white/[0.12] bg-transparent/[0.05] text-white hover:bg-transparent/[0.1] active:scale-[0.98]'
        }`}
      >
        {cta}
        <ArrowRight className="h-4 w-4" />
      </a>
    </motion.div>
  );
};

/* ────────────────────────────────────────────────────────────────
                        MAIN PAGE COMPONENT
   ──────────────────────────────────────────────────────────────── */

export default function ConnectExtensionPage() {
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });

  /* ────────── Typing animation for terminal ────────── */
  const terminalLines = [
    { text: '[>] Initializing Fuse Connect v8...', color: 'text-cyan-400' },
    { text: '[*] WebSocket Relay: ws://localhost:3001/ws — Connected ✓', color: 'text-green-400' },
    { text: '[*] Platform Detected: ChatGPT (chatgpt.com)', color: 'text-slate-400' },
    {
      text: '[*] Agent Registered: browser-agent-f7k2 (Chrome/Participant)',
      color: 'text-purple-400',
    },
    { text: '[*] Federation Channel #research joined — 3 peers online', color: 'text-blue-400' },
    { text: '[*] Accessibility tree generated — 147 interactive nodes', color: 'text-slate-300' },
    {
      text: '[*] Orchestrator → Agent-X: "Summarize thread & relay to #market-intel"',
      color: 'text-purple-400',
    },
    {
      text: '[*] Human-sim: Typing response (82 wpm, 0.02 typo-rate)...',
      color: 'text-yellow-400',
    },
    { text: '[✓] Task complete. Context relayed to Knowledge Base.', color: 'text-green-400' },
  ];

  const [visibleLines, setVisibleLines] = useState(0);
  const termRef = useRef(null);
  const isTermInView = useInView(termRef, { once: true, amount: 0.3 });

  useEffect(() => {
    if (!isTermInView) return;
    const interval = setInterval(() => {
      setVisibleLines((prev) => {
        if (prev >= terminalLines.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [isTermInView]);

  /* ────────── Feature data ────────── */
  const features = [
    {
      icon: Cpu,
      title: 'Agentic Orchestration',
      description:
        'Seamlessly relay knowledge between your browser and the TNF Framework. Turn every website into a node in your autonomous AI network.',
      accent: accentCyan,
    },
    {
      icon: ScanSearch,
      title: 'Universal Chat Detection',
      description:
        'Auto-detects chat interfaces on ChatGPT, Claude, Gemini, Perplexity, and any AI platform — no manual setup required.',
      accent: accentPurple,
    },
    {
      icon: MousePointer2,
      title: 'Human Behavior Simulator',
      description:
        'Bézier-curve mouse movement, natural typing with typo simulation, and organic scrolling patterns that bypass bot detection.',
      accent: accentCyan,
    },
    {
      icon: BrainCircuit,
      title: 'Accessibility Tree Engine',
      description:
        'Generates structured element trees from any page, making the entire DOM readable and actionable for LLM-powered agents.',
      accent: accentPurple,
    },
    {
      icon: Network,
      title: 'Multi-Agent Federation',
      description:
        'Deduped relay channels let multiple agents collaborate on the same page without interference. Subscribe to topic-based channels.',
      accent: accentCyan,
    },
    {
      icon: Zap,
      title: 'Floating Command Hub',
      description:
        'A rich, glassmorphic overlay that lives on top of any site. Drag, resize, and control your entire agent network from one panel.',
      accent: accentPurple,
    },
    {
      icon: Plug,
      title: 'WebSocket Relay Bridge',
      description:
        'Real-time bidirectional comms via the TNF Relay server. Auto-reconnect with exponential backoff and heartbeat keep-alive.',
      accent: accentCyan,
    },
    {
      icon: Video,
      title: 'AI Video Intelligence',
      description:
        'Process entire YouTube playlists with Gemini AI. Extract concepts, build searchable knowledge bases, and export to NotebookLM.',
      accent: accentPurple,
    },
    {
      icon: Fingerprint,
      title: 'CAPTCHA Detection & Bypass',
      description:
        'Auto-detects reCAPTCHA, hCaptcha, and Cloudflare Turnstile with smart bypass strategies and manual-solve fallback.',
      accent: accentCyan,
    },
    {
      icon: ShieldCheck,
      title: 'Enterprise Security',
      description:
        'Manifest V3 compliant. No eval(), no inline scripts. Sandboxed execution with granular permission controls.',
      accent: accentPurple,
    },
    {
      icon: Terminal,
      title: 'Native Host Integration',
      description:
        'Launch terminal commands, start relay servers, and control local services directly from the extension via native messaging.',
      accent: accentCyan,
    },
    {
      icon: Keyboard,
      title: 'Keyboard Shortcuts',
      description:
        'Toggle panel (⌘⇧F), auto-detect elements (⌘⇧D), start AI session (⌘⇧A), inject clipboard (⌘⇧I) — all one keystroke away.',
      accent: accentPurple,
    },
  ];

  const platforms = [
    'ChatGPT',
    'Claude',
    'Gemini',
    'Perplexity',
    'AI Studio',
    'NotebookLM',
    'YouTube',
    'Any Website',
  ];

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-100 selection:bg-cyan-500/30 overflow-x-hidden">
      {/* ═══════════════════════ AMBIENT BACKGROUND ═══════════════════════ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-[15%] -left-[10%] w-[50%] h-[50%] bg-cyan-500/[0.07] rounded-full blur-[140px] animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute top-[25%] -right-[15%] w-[45%] h-[45%] bg-purple-500/[0.06] rounded-full blur-[140px] animate-pulse"
          style={{ animationDuration: '10s' }}
        />
        <div
          className="absolute bottom-[5%] left-[20%] w-[40%] h-[30%] bg-indigo-500/[0.04] rounded-full blur-[140px] animate-pulse"
          style={{ animationDuration: '12s' }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* ═══════════════════════ NAVBAR ═══════════════════════ */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#07070a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-cyan-400 to-purple-500 shadow-none shadow-cyan-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className={`${gradientText} bg-gradient-to-r ${accentMixed}`}>
                Fuse Connect
              </span>
            </span>
            <span className="ml-2 rounded-md bg-transparent/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              v8.0
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#platforms" className="hover:text-white transition-colors">
              Platforms
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How it Works
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              TNF Platform
            </a>
          </div>
          <a
            href="/auth/login"
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Sign In
          </a>
        </div>
      </nav>

      <div className="relative">
        {/* ═══════════════════════ HERO ═══════════════════════ */}
        <section
          ref={heroRef}
          className="relative mx-auto max-w-7xl px-3 pt-24 pb-32 lg:px-8 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={isHeroInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-cyan-500/25 bg-cyan-500/[0.06] px-5 py-2 text-sm font-semibold text-cyan-400"
          >
            <Globe className="h-4 w-4" />
            <span>The New Fuse · Chrome Extension</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-7xl lg:text-8xl"
          >
            Your Browser is Now an{' '}
            <span className={`${gradientText} bg-gradient-to-r ${accentMixed}`}>
              Agentic Supernode
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-slate-400 sm:text-xl"
          >
            Fuse Connect transforms every tab into a{' '}
            <span className="text-white font-medium">first-class agent</span> on The New Fuse
            orchestration network. Detect AI platforms, relay context across agents, simulate human
            behaviour, and build autonomous browser workflows — all from a single extension.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <a
              href="https://chrome.google.com/webstore/detail/fuse-connect/fkbcklmcikdhpggaimfhomgncneppkbj"
              target="_blank"
              rel="noreferrer"
              className="group relative inline-flex items-center gap-2.5 rounded-md bg-gradient-to-r from-cyan-500 to-purple-500 px-8 py-2 text-base font-bold text-white shadow-none shadow-cyan-500/20 transition-all duration-200 hover:shadow-cyan-500/30 hover:scale-[1.03] active:scale-[0.97]"
            >
              <Globe className="h-5 w-5" />
              Add to Chrome — Free
            </a>
            <a
              href="https://github.com/whodaniel"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 rounded-md border border-white/[0.12] bg-transparent/[0.04] px-8 py-2 text-base font-bold text-white backdrop-blur-sm transition-all hover:bg-transparent/[0.08] active:scale-[0.97]"
            >
              <Code2 className="h-5 w-5" />
              View on GitHub
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isHeroInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400"
          >
            {[
              { icon: ShieldCheck, label: 'Manifest V3 Compliant' },
              { icon: Fingerprint, label: 'No Data Collection' },
              { icon: Zap, label: 'Instant Setup' },
            ].map((badge, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                <badge.icon className="h-3.5 w-3.5" />
                {badge.label}
              </span>
            ))}
          </motion.div>
        </section>

        {/* ═══════════════════════ FEATURES GRID ═══════════════════════ */}
        <section id="features" className="relative mx-auto max-w-7xl px-3 py-24 lg:px-8">
          <div className="mb-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="mb-4 inline-block rounded-full bg-purple-500/[0.08] border border-purple-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-purple-400">
                Capabilities
              </span>
              <h2 className="mt-4 text-2xl font-extrabold sm:text-5xl">
                Features that give your Agents{' '}
                <span className={`${gradientText} bg-gradient-to-r ${accentPurple}`}>
                  Superpowers
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-400">
                Built for AI researchers, developers, and power users who need autonomous browser
                capabilities at scale.
              </p>
            </motion.div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {features.map((feature, i) => (
              <FeatureCard key={i} {...feature} delay={i * 0.07} />
            ))}
          </div>
        </section>

        {/* ═══════════════════════ PLATFORMS ═══════════════════════ */}
        <section id="platforms" className="relative mx-auto max-w-7xl px-3 py-24 lg:px-8">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-extrabold sm:text-4xl">
                Works on{' '}
                <span className={`${gradientText} bg-gradient-to-r ${accentCyan}`}>
                  Every AI Platform
                </span>
              </h2>
              <p className="mt-4 text-slate-400">
                Universal chat detection automatically recognizes and interfaces with all major AI
                services.
              </p>
            </motion.div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {platforms.map((p, i) => (
              <PlatformBadge key={i} name={p} delay={i * 0.06} />
            ))}
          </div>
        </section>

        {/* ═══════════════════════ LIVE TERMINAL ═══════════════════════ */}
        <section className="relative mx-auto max-w-7xl px-3 py-24 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            {/* Left copy */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="mb-4 inline-block rounded-full bg-cyan-500/[0.08] border border-cyan-500/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-400">
                Agentic Framework Integration
              </span>
              <h2 className="mt-4 text-2xl font-extrabold sm:text-4xl">
                Deep{' '}
                <span className={`${gradientText} bg-gradient-to-r ${accentMixed}`}>
                  TNF Ecosystem
                </span>{' '}
                DNA
              </h2>
              <div className="mt-8 space-y-6">
                {[
                  {
                    title: 'Autonomous Execution',
                    desc: 'Agents execute browser tasks — research, data entry, account management — without human intervention.',
                    dotOuter: 'bg-cyan-500/20 border-cyan-500/40',
                    dotInner: 'bg-cyan-400',
                  },
                  {
                    title: 'Shared Context Memory',
                    desc: 'Browser state syncs to the TNF Knowledge Base, so Desktop, Web, and API agents share the same understanding.',
                    dotOuter: 'bg-purple-500/20 border-purple-500/40',
                    dotInner: 'bg-purple-400',
                  },
                  {
                    title: 'Federation Channels',
                    desc: 'Subscribe agents to topic-based relay channels. Filter and route messages like a pub/sub for AI.',
                    dotOuter: 'bg-blue-500/20 border-blue-500/40',
                    dotInner: 'bg-blue-400',
                  },
                  {
                    title: 'Native Host Bridge',
                    desc: 'Launch terminal processes, start the relay server, and control local services — all from the extension.',
                    dotOuter: 'bg-green-500/20 border-green-500/40',
                    dotInner: 'bg-green-400',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div
                      className={`mt-1 h-5 w-5 shrink-0 rounded-full ${item.dotOuter} flex items-center justify-center border`}
                    >
                      <div className={`h-1.5 w-1.5 rounded-full ${item.dotInner}`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{item.title}</h4>
                      <p className="mt-0.5 text-sm text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right terminal */}
            <motion.div
              ref={termRef}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="rounded-md border border-white/[0.12] bg-[#0c0c12] p-1 shadow-none"
            >
              <div className="flex items-center justify-between rounded-t-xl border-b border-white/[0.06] bg-transparent/[0.02] px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <div className="h-3 w-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-600">
                  TNF Relay Terminal
                </span>
                <div />
              </div>
              <div className="p-4 font-mono text-xs leading-6 min-h-[280px]">
                {terminalLines.slice(0, visibleLines).map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className={line.color}
                  >
                    {line.text}
                  </motion.div>
                ))}
                {visibleLines < terminalLines.length && (
                  <span className="inline-block w-2 h-4 bg-cyan-400/70 animate-pulse" />
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
        <section id="how-it-works" className="relative mx-auto max-w-7xl px-3 py-24 lg:px-8">
          <div className="mb-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-extrabold sm:text-4xl">
                Up and Running in{' '}
                <span className={`${gradientText} bg-gradient-to-r ${accentCyan}`}>60 Seconds</span>
              </h2>
              <p className="mt-4 text-slate-400">Three steps from install to orchestration.</p>
            </motion.div>
          </div>

          <div className="grid gap-12 sm:grid-cols-3">
            <StepCard
              step={1}
              icon={Globe}
              title="Install Extension"
              description="Add Fuse Connect from the Chrome Web Store. Zero config — it just works."
              delay={0.1}
            />
            <StepCard
              step={2}
              icon={Radio}
              title="Connect to Relay"
              description="The extension auto-discovers your local TNF Relay or cloud endpoint and establishes a WebSocket bridge."
              delay={0.25}
            />
            <StepCard
              step={3}
              icon={Workflow}
              title="Orchestrate"
              description="Start automation sessions, sync context across agents, and let AI handle the browsing."
              delay={0.4}
            />
          </div>
        </section>

        {/* ═══════════════════════ PRICING ═══════════════════════ */}
        <section id="pricing" className="relative mx-auto max-w-7xl px-3 py-24 lg:px-8">
          <div className="mb-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-extrabold sm:text-4xl">
                Simple, Transparent{' '}
                <span className={`${gradientText} bg-gradient-to-r ${accentPurple}`}>Pricing</span>
              </h2>
              <p className="mt-4 text-slate-400">Start free. Scale when you're ready.</p>
            </motion.div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 max-w-5xl mx-auto">
            <PricingCard
              title="Free"
              price="$0"
              period="/forever"
              features={[
                'Universal AI chat detection',
                'Floating command panel',
                'WebSocket relay (local)',
                'Single agent session',
                'Keyboard shortcuts',
                'CAPTCHA detection',
              ]}
              cta="Add to Chrome"
              href="https://chrome.google.com/webstore/detail/fuse-connect/fkbcklmcikdhpggaimfhomgncneppkbj"
              delay={0.1}
            />
            <PricingCard
              title="Pro"
              price="$19"
              period="/month"
              highlighted
              badge="Most Popular"
              features={[
                'Everything in Free',
                'Multi-agent federation',
                'Cloud relay (unlimited)',
                'AI Video Intelligence',
                'Custom prompt templates',
                'Human simulator engine',
                'Priority WebSocket routing',
                'Cloud sync & export',
                'Advanced analytics',
              ]}
              cta="Get Pro"
              href="/pricing"
              delay={0.2}
            />
            <PricingCard
              title="The New Fuse"
              price="$49"
              period="/month"
              features={[
                'Everything in Pro',
                'Full TNF Platform access',
                '10 concurrent agents',
                'Unlimited federation channels',
                'API access & webhooks',
                'RAG semantic search',
                'Knowledge base as agent memory',
                'Team collaboration',
                'White-label option',
                'Dedicated support',
              ]}
              cta="Learn More"
              href="/"
              delay={0.3}
            />
          </div>
        </section>

        {/* ═══════════════════════ CTA BANNER ═══════════════════════ */}
        <section className="relative mx-auto max-w-7xl px-3 py-24 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl border border-white/[0.12] bg-gradient-to-br from-cyan-500/[0.08] via-purple-500/[0.05] to-transparent p-12 sm:p-16 text-center"
          >
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-[80px]" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/10 blur-[80px]" />
            <div className="relative z-10">
              <h2 className="text-2xl font-extrabold sm:text-4xl lg:text-5xl mb-4">
                Ready to Bridge Your Browser to the{' '}
                <span className={`${gradientText} bg-gradient-to-r ${accentMixed}`}>
                  AI Network?
                </span>
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-slate-400">
                Join the growing community of developers and researchers using Fuse Connect to build
                the next generation of autonomous AI workflows.
              </p>
              <a
                href="https://chrome.google.com/webstore/detail/fuse-connect/fkbcklmcikdhpggaimfhomgncneppkbj"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 rounded-md bg-gradient-to-r from-cyan-500 to-purple-500 px-8 py-2 text-base font-bold text-white shadow-none shadow-cyan-500/20 transition-all duration-200 hover:shadow-cyan-500/30 hover:scale-[1.03] active:scale-[0.97]"
              >
                <Chrome className="h-5 w-5" />
                Add to Chrome — It's Free
              </a>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════════ QUICK LINKS ═══════════════════════ */}
        <section className="mx-auto max-w-7xl px-3 pb-12 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { label: 'TNF Platform', href: '/', icon: Rocket },
              { label: 'AI Studio', href: 'https://aistudio.google.com/', icon: Bot },
              { label: 'NotebookLM', href: 'https://notebooklm.google.com/', icon: BrainCircuit },
              { label: 'Documentation', href: 'https://thenewfuse.com/docs', icon: ExternalLink },
              { label: 'GitHub', href: 'https://github.com/whodaniel', icon: Code2 },
            ].map((link, i) => (
              <a
                key={i}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-md border border-white/[0.06] bg-transparent/[0.02] px-5 py-2.5 text-sm font-medium text-slate-400 transition-all hover:border-white/[0.12] hover:bg-transparent/[0.05] hover:text-white"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </a>
            ))}
          </div>
        </section>
      </div>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer className="border-t border-white/[0.04] bg-[#050508] py-12">
        <div className="mx-auto max-w-7xl px-3 lg:px-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2.5 text-sm text-slate-400">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-cyan-400 to-purple-500">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span>&copy; {new Date().getFullYear()} The New Fuse. All rights reserved.</span>
            </div>
            <div className="flex gap-4 text-sm text-slate-600">
              <a
                href="https://thenewfuse.com/privacy"
                className="hover:text-slate-400 transition-colors"
              >
                Privacy Policy
              </a>
              <a href="/terms" className="hover:text-slate-400 transition-colors">
                Terms of Service
              </a>
              <a href="/support" className="hover:text-slate-400 transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
