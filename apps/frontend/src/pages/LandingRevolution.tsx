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
    <div className="min-h-screen bg-transparent text-white overflow-hidden">
      {/* HERO SECTION - MASSIVE & BOLD */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-32">
        {/* Background Glow Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 mb-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-semibold tracking-wide">
              The Future of AI Orchestration is Here
            </span>
          </div>

          {/* Main Headline - HUGE */}
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-black mb-8 leading-none">
            <span className="block text-white">Build Your</span>
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Empire
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-2xl md:text-3xl text-gray-300 mb-16 max-w-4xl mx-auto leading-relaxed font-light">
            Deploy autonomous agents. Orchestrate multi-model workflows. Scale infinitely.
            <br />
            <span className="text-white font-semibold">No code. No limits. No compromise.</span>
          </p>

          {/* CTA Buttons - MASSIVE */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              asChild
              className="h-16 px-12 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-[0_0_40px_rgba(59,130,246,0.6)] hover:shadow-[0_0_60px_rgba(59,130,246,0.8)] transform hover:scale-105 transition-all duration-300"
            >
              <Link to="/auth/register">
                <Rocket className="mr-3 h-6 w-6" />
                Start Building Free
                <ArrowRight className="ml-3 h-6 w-6" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-16 px-12 text-xl font-semibold border-2 border-white/30 hover:bg-white/10 backdrop-blur-xl"
            >
              <Link to="/docs">
                <Terminal className="mr-3 h-5 w-5" />
                View Docs
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-20 flex flex-wrap gap-12 justify-center items-center opacity-60">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <span className="text-lg font-medium">Open Source</span>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-yellow-400" />
              <span className="text-lg font-medium">&lt;100ms Latency</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-400" />
              <span className="text-lg font-medium">Enterprise Security</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION - BOLD CARDS */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-6xl font-black mb-6">
              <span className="text-white">Why Developers</span>{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Choose Us
              </span>
            </h2>
            <p className="text-2xl text-gray-400 max-w-3xl mx-auto">
              Stop duct-taping APIs. Start orchestrating intelligence.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative p-12 rounded-3xl bg-white/[0.02] backdrop-blur-2xl border border-white/10 hover:border-blue-500/50 transition-all duration-500 hover:bg-white/[0.05] cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transform transition-transform shadow-2xl">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-white">Agent Swarms</h3>
                <p className="text-lg text-gray-400 leading-relaxed">
                  Deploy hundreds of specialized agents that collaborate autonomously to solve
                  complex problems.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative p-12 rounded-3xl bg-white/[0.02] backdrop-blur-2xl border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:bg-white/[0.05] cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transform transition-transform shadow-2xl">
                  <Network className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-white">Native MCP</h3>
                <p className="text-lg text-gray-400 leading-relaxed">
                  First platform built entirely on Model Context Protocol. Swap models like swapping
                  batteries.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative p-12 rounded-3xl bg-white/[0.02] backdrop-blur-2xl border border-white/10 hover:border-green-500/50 transition-all duration-500 hover:bg-white/[0.05] cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-6 group-hover:scale-110 transform transition-transform shadow-2xl">
                  <Workflow className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-white">Visual Workflows</h3>
                <p className="text-lg text-gray-400 leading-relaxed">
                  Drag-and-drop workflow builder. Define outcomes, let agents self-organize to
                  deliver results.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative p-12 rounded-3xl bg-white/[0.02] backdrop-blur-2xl border border-white/10 hover:border-orange-500/50 transition-all duration-500 hover:bg-white/[0.05] cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transform transition-transform shadow-2xl">
                  <Code className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-white">IDE Integration</h3>
                <p className="text-lg text-gray-400 leading-relaxed">
                  Command center lives in VS Code. Debug agents, monitor swarms, deploy
                  workflows—never leave your editor.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="group relative p-12 rounded-3xl bg-white/[0.02] backdrop-blur-2xl border border-white/10 hover:border-pink-500/50 transition-all duration-500 hover:bg-white/[0.05] cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 transform transition-transform shadow-2xl">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-white">Zero-Trust Security</h3>
                <p className="text-lg text-gray-400 leading-relaxed">
                  Docker sandboxing. RBAC. Audit logs. Your agents operate in fortified isolation.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="group relative p-12 rounded-3xl bg-white/[0.02] backdrop-blur-2xl border border-white/10 hover:border-cyan-500/50 transition-all duration-500 hover:bg-white/[0.05] cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-6 group-hover:scale-110 transform transition-transform shadow-2xl">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-white">Deploy Anywhere</h3>
                <p className="text-lg text-gray-400 leading-relaxed">
                  Docker Compose. Kubernetes. Railway. One command to production. Zero vendor
                  lock-in.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA - MASSIVE */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-7xl md:text-8xl font-black mb-8 leading-none">
            <span className="text-white">Ready to Build</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              The Future?
            </span>
          </h2>
          <p className="text-2xl text-gray-400 mb-12">
            Join thousands of developers shipping AI-powered products.
          </p>
          <Button
            asChild
            className="h-20 px-16 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-[0_0_60px_rgba(59,130,246,0.7)] hover:shadow-[0_0_80px_rgba(59,130,246,0.9)] transform hover:scale-110 transition-all duration-300"
          >
            <Link to="/auth/register">
              <Rocket className="mr-4 h-8 w-8" />
              Start Building Now
              <ArrowRight className="ml-4 h-8 w-8" />
            </Link>
          </Button>
          <p className="mt-8 text-gray-500">No credit card required · Deploy in 60 seconds</p>
        </div>
      </section>
    </div>
  );
};

export default LandingPageRevolution;
