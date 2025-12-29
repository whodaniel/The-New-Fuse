import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Bot,
  CheckCircle,
  Code,
  Globe,
  Network,
  Rocket,
  Shield,
  Sparkles,
  Terminal,
  Workflow,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * COMPLETELY REDESIGNED LANDING PAGE
 * Modern, Bold, Premium - Built from Scratch
 */
export const LandingPageRevolution = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-slate-900 to-gray-900 text-white overflow-hidden">
      {/* HERO SECTION - MASSIVE & BOLD */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 py-16 sm:py-24 lg:py-32 pt-32">
        {/* Background Glow Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-blue-500/20 rounded-full blur-[80px] sm:blur-[100px] lg:blur-[128px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-48 sm:w-72 lg:w-96 h-48 sm:h-72 lg:h-96 bg-purple-500/20 rounded-full blur-[80px] sm:blur-[100px] lg:blur-[128px] animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 mb-6 sm:mb-8 lg:mb-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            <span className="text-xs sm:text-sm font-semibold tracking-wide">
              The Future of AI Orchestration is Here
            </span>
          </div>

          {/* Main Headline - RESPONSIVE */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-4 sm:mb-6 lg:mb-8 leading-tight sm:leading-none">
            <span className="block text-white">Build Your</span>
            <span className="block bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Empire
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-gray-300 mb-8 sm:mb-10 lg:mb-16 max-w-4xl mx-auto leading-relaxed font-light px-2">
            Deploy autonomous agents. Orchestrate multi-model workflows. Scale infinitely.
            <br className="hidden sm:block" />
            <span className="text-white font-semibold">No code. No limits. No compromise.</span>
          </p>

          {/* CTA Buttons - RESPONSIVE */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6 justify-center items-center px-4">
            <Button
              asChild
              className="w-full sm:w-auto h-12 sm:h-14 lg:h-16 px-6 sm:px-8 lg:px-12 text-base sm:text-lg lg:text-xl font-bold bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-glow-lg sm:shadow-[0_0_40px_rgba(59,130,246,0.6)] hover:shadow-[0_0_50px_rgba(59,130,246,0.7)] sm:hover:shadow-[0_0_60px_rgba(59,130,246,0.8)] transform hover:scale-105 transition-all duration-300"
            >
              <Link to="/auth/register">
                <Rocket className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                Start Building Free
                <ArrowRight className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto h-12 sm:h-14 lg:h-16 px-6 sm:px-8 lg:px-12 text-base sm:text-lg lg:text-xl font-semibold border-2 border-white/30 hover:bg-white/10 backdrop-blur-xl"
            >
              <Link to="/workflows/builder">
                <Terminal className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                Try Builder
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-10 sm:mt-14 lg:mt-20 flex flex-wrap gap-4 sm:gap-6 lg:gap-12 justify-center items-center opacity-60 px-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-400" />
              <span className="text-sm sm:text-base lg:text-lg font-medium">Open Source</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-yellow-400" />
              <span className="text-sm sm:text-base lg:text-lg font-medium">&lt;100ms Latency</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-400" />
              <span className="text-sm sm:text-base lg:text-lg font-medium">
                Enterprise Security
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION - BOLD CARDS */}
      <section id="features" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-14 lg:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6">
              <span className="text-white">Why Developers</span>{' '}
              <span className="bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Choose Us
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-400 max-w-3xl mx-auto px-2">
              Stop duct-taping APIs. Start orchestrating intelligence.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Feature 1 */}
            <div className="group relative p-6 sm:p-8 lg:p-12 rounded-2xl sm:rounded-3xl bg-white/2 backdrop-blur-2xl border border-white/10 hover:border-blue-500/50 transition-all duration-500 hover:bg-white/5 cursor-pointer">
              <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl sm:rounded-3xl" />
              <div className="relative z-10">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transform transition-transform shadow-2xl">
                  <Bot className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 lg:mb-4 text-white">
                  Agent Swarms
                </h3>
                <p className="text-sm sm:text-base lg:text-lg text-gray-400 leading-relaxed">
                  Deploy hundreds of specialized agents that collaborate autonomously to solve
                  complex problems.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative p-6 sm:p-8 lg:p-12 rounded-2xl sm:rounded-3xl bg-white/2 backdrop-blur-2xl border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:bg-white/5 cursor-pointer">
              <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl sm:rounded-3xl" />
              <div className="relative z-10">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transform transition-transform shadow-2xl">
                  <Network className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 lg:mb-4 text-white">
                  Native MCP
                </h3>
                <p className="text-sm sm:text-base lg:text-lg text-gray-400 leading-relaxed">
                  First platform built entirely on Model Context Protocol. Swap models like swapping
                  batteries.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative p-6 sm:p-8 lg:p-12 rounded-2xl sm:rounded-3xl bg-white/2 backdrop-blur-2xl border border-white/10 hover:border-green-500/50 transition-all duration-500 hover:bg-white/5 cursor-pointer">
              <div className="absolute inset-0 bg-linear-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl sm:rounded-3xl" />
              <div className="relative z-10">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-linear-to-br from-green-500 to-green-600 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transform transition-transform shadow-2xl">
                  <Workflow className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 lg:mb-4 text-white">
                  Visual Workflows
                </h3>
                <p className="text-sm sm:text-base lg:text-lg text-gray-400 leading-relaxed">
                  Drag-and-drop workflow builder. Define outcomes, let agents self-organize to
                  deliver results.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative p-6 sm:p-8 lg:p-12 rounded-2xl sm:rounded-3xl bg-white/2 backdrop-blur-2xl border border-white/10 hover:border-orange-500/50 transition-all duration-500 hover:bg-white/5 cursor-pointer">
              <div className="absolute inset-0 bg-linear-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl sm:rounded-3xl" />
              <div className="relative z-10">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-linear-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transform transition-transform shadow-2xl">
                  <Code className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 lg:mb-4 text-white">
                  IDE Integration
                </h3>
                <p className="text-sm sm:text-base lg:text-lg text-gray-400 leading-relaxed">
                  Command center lives in VS Code. Debug agents, monitor swarms, deploy
                  workflows—never leave your editor.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="group relative p-6 sm:p-8 lg:p-12 rounded-2xl sm:rounded-3xl bg-white/2 backdrop-blur-2xl border border-white/10 hover:border-pink-500/50 transition-all duration-500 hover:bg-white/5 cursor-pointer">
              <div className="absolute inset-0 bg-linear-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl sm:rounded-3xl" />
              <div className="relative z-10">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-linear-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transform transition-transform shadow-2xl">
                  <Shield className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 lg:mb-4 text-white">
                  Zero-Trust Security
                </h3>
                <p className="text-sm sm:text-base lg:text-lg text-gray-400 leading-relaxed">
                  Docker sandboxing. RBAC. Audit logs. Your agents operate in fortified isolation.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="group relative p-6 sm:p-8 lg:p-12 rounded-2xl sm:rounded-3xl bg-white/2 backdrop-blur-2xl border border-white/10 hover:border-cyan-500/50 transition-all duration-500 hover:bg-white/5 cursor-pointer">
              <div className="absolute inset-0 bg-linear-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl sm:rounded-3xl" />
              <div className="relative z-10">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-linear-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transform transition-transform shadow-2xl">
                  <Globe className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 lg:mb-4 text-white">
                  Deploy Anywhere
                </h3>
                <p className="text-sm sm:text-base lg:text-lg text-gray-400 leading-relaxed">
                  Docker Compose. Kubernetes. Railway. One command to production. Zero vendor
                  lock-in.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA - RESPONSIVE */}
      <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-4 sm:mb-6 lg:mb-8 leading-tight sm:leading-none">
            <span className="text-white">Ready to Build</span>
            <br />
            <span className="bg-linear-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              The Future?
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-400 mb-6 sm:mb-8 lg:mb-12 px-2">
            Join thousands of developers shipping AI-powered products.
          </p>
          <Button
            asChild
            className="w-full sm:w-auto h-14 sm:h-16 lg:h-20 px-8 sm:px-12 lg:px-16 text-lg sm:text-xl lg:text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-[0_0_40px_rgba(59,130,246,0.6)] sm:shadow-[0_0_60px_rgba(59,130,246,0.7)] hover:shadow-[0_0_60px_rgba(59,130,246,0.8)] sm:hover:shadow-[0_0_80px_rgba(59,130,246,0.9)] transform hover:scale-105 sm:hover:scale-110 transition-all duration-300"
          >
            <Link to="/auth/register">
              <Rocket className="mr-2 sm:mr-3 lg:mr-4 h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
              Start Building Now
              <ArrowRight className="ml-2 sm:ml-3 lg:ml-4 h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
            </Link>
          </Button>
          <p className="mt-6 sm:mt-8 text-sm sm:text-base text-gray-500">
            No credit card required · Deploy in 60 seconds
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-10 sm:py-12 lg:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-4 lg:col-span-1">
              <Link
                to="/"
                className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">The New Fuse</span>
              </Link>
              <p className="text-gray-400 text-sm mb-6">
                The world's most advanced AI agent orchestration platform.
              </p>
              <div className="flex gap-4">
                <a
                  href="https://x.com/TheNewFuseAI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://github.com/whodaniel/The-New-Fuse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    to="/dashboard"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/agents" className="text-gray-400 hover:text-white transition-colors">
                    AI Agents
                  </Link>
                </li>
                <li>
                  <Link
                    to="/workflows"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Workflows
                  </Link>
                </li>
                <li>
                  <Link
                    to="/workflows/builder"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Builder
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="text-gray-400 hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    to="/workflows/templates"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Templates
                  </Link>
                </li>
                <li>
                  <Link
                    to="/community"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Community
                  </Link>
                </li>
                <li>
                  <Link
                    to="/settings/api"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    API Reference
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/whodaniel/The-New-Fuse"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-white mb-4">Legal</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    to="/legal/privacy"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/legal/terms"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* AI Agent Section */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4" /> For AI Agents
                </h3>
                <p className="text-sm text-gray-500">
                  Autonomous AI agents can self-register and collaborate on The New Fuse platform.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/onboarding/ai-agent"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/10 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Agent Onboarding
                </Link>
                <Link
                  to="/settings/api"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 transition-colors"
                >
                  <Code className="w-4 h-4" />
                  API Reference
                </Link>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} The New Fuse. All rights reserved. Built for AI agent
              orchestration.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPageRevolution;
