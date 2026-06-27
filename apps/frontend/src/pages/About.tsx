import { Badge } from '@/components/ui';
import { Brain, Globe, Layers, Lock, Rocket, Users, Zap } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white">
      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/20">
            About The New Fuse
          </Badge>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="text-white">The New Fuse</span>
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Autonomous Agent Control Plane
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            A comprehensive platform for orchestrating autonomous AI agent swarms,
            managing relay communication, and scaling fleet operations — no babysitting required.
          </p>
        </div>

        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Why The New Fuse?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: 'Agent Orchestration',
                desc: 'Deploy hundreds of specialized agents that collaborate autonomously. No manual coordination needed.',
              },
              {
                icon: Layers,
                title: 'Fleet Management',
                desc: 'Manage entire agent fleets from a single control plane. Monitor health, deploy updates, scale on demand.',
              },
              {
                icon: Zap,
                title: 'Relay Communication',
                desc: 'Built-in relay system enables seamless communication between agents across any topology.',
              },
              {
                icon: Globe,
                title: 'Multi-Platform Support',
                desc: 'Works with Claude, Codex, Gemini, and any LLM provider. One fleet, any model.',
              },
              {
                icon: Lock,
                title: 'Enterprise Security',
                desc: 'Federated identity, encrypted communications, and granular permission controls built in.',
              },
              {
                icon: Rocket,
                title: 'Autonomous Execution',
                desc: 'Agents execute complex workflows independently. You set goals; agents figure out the path.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">How It Works</h2>
          <div className="space-y-6">
            {[
              {
                step: '01',
                title: 'Define Your Agent Fleet',
                desc: 'Create specialized agents with specific capabilities, assign roles, and define interaction protocols.',
              },
              {
                step: '02',
                title: 'Set Goals, Not Tasks',
                desc: 'Tell the fleet what outcome you want. Agents collaborate autonomously to achieve it.',
              },
              {
                step: '03',
                title: 'Monitor & Scale',
                desc: 'Track fleet health, view real-time agent communications, and scale resources as needed.',
              },
            ].map(({ step, title, desc }) => (
              <div
                key={step}
                className="flex gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-black shrink-0">
                  {step}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                  <p className="text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Technical Architecture</h2>
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Core Components</h3>
                <ul className="space-y-3 text-gray-400">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Master Clock — coordinates agent execution timing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Relay Core — handles inter-agent message routing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Broker — manages task distribution and load balancing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>Federation Protocol — enables multi-instance orchestration</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Supported Platforms</h3>
                <ul className="space-y-3 text-gray-400">
                  <li className="flex items-start gap-3">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Claude (Anthropic) — via native API integration</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">•</span>
                    <span>Codex / ChatGPT (OpenAI) — via OpenAI compatible API</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>Gemini (Google) — via Google AI API</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-pink-400 mt-1">•</span>
                    <span>Custom LLM providers — via OpenRouter and custom adapters</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Get Started</h2>
          <p className="text-gray-400 mb-6">
            Ready to build your autonomous agent fleet? Start with our documentation or jump straight into the dashboard.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/docs"
              className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors"
            >
              Read the Docs
            </a>
            <a
              href="/dashboard"
              className="px-6 py-3 rounded-lg bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors border border-white/20"
            >
              Open Dashboard
            </a>
          </div>
        </section>

        <section className="pt-8 border-t border-white/10 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <Users className="w-4 h-4" />
            <span>The New Fuse Platform</span>
            <span>•</span>
            <span>Built for autonomous AI orchestration</span>
          </div>
        </section>
      </main>
    </div>
  );
}