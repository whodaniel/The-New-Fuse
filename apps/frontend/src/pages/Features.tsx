import { Badge } from '@/components/ui/badge';
import { GlassCard, PremiumButton } from '@/components/ui/premium';
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle,
  Code,
  MessageSquare,
  Network,
  Rocket,
  Settings,
  Shield,
  Sparkles,
  Terminal,
  Workflow,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  color = 'blue',
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color?: string;
}) => (
  <GlassCard
    className="group hover:shadow-lg transition-all duration-300 p-6"
  >
      <div
        className={`w-12 h-12 rounded-lg bg-linear-to-br from-${color}-500 to-${color}-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
        aria-hidden="true"
      >
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
  </GlassCard>
);

export const Features = () => {
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-gray-900 via-slate-900 to-gray-900 text-white">
      <main className="grow" role="main">
        {/* Hero Section */}
        <section
          className="relative py-20 lg:py-32 bg-linear-to-br from-indigo-600 via-purple-700 to-blue-800 text-white overflow-hidden"
          aria-labelledby="features-hero-heading"
        >
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 bg-linear-to-r from-blue-600/30 to-purple-600/30"></div>

          <div className="relative container mx-auto px-4 text-center">
            <div className="max-w-5xl mx-auto">
              <Badge
                className="mb-6 bg-white/10 text-white border-white/20 hover:bg-white/20"
                aria-label="Features badge"
              >
                <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
                Comprehensive Feature Suite
              </Badge>

              <h1
                id="features-hero-heading"
                className="text-5xl lg:text-7xl font-bold mb-6 leading-tight"
              >
                Powerful Features for
                <span className="block bg-linear-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  AI Orchestration
                </span>
              </h1>

              <p className="text-xl lg:text-2xl mb-10 text-blue-100 max-w-4xl mx-auto leading-relaxed">
                Everything you need to build, deploy, and manage intelligent AI workflows.
              </p>

              <div
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
                role="group"
                aria-label="Call to action buttons"
              >
                <PremiumButton
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group focus:ring-4 focus:ring-white/50"
                  aria-label="Get started with The New Fuse features"
                  onClick={() => window.location.href = '/auth/register'}
                >
                    <Rocket
                      className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300"
                      aria-hidden="true"
                    />
                    Get Started
                    <ArrowRight
                      className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300"
                      aria-hidden="true"
                    />
                </PremiumButton>
                <PremiumButton
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg focus:ring-4 focus:ring-white/50"
                  aria-label="Learn more about features"
                  onClick={() => window.location.href = '/'}
                >
                  Back to Home
                </PremiumButton>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features Section */}
        <section className="py-20 bg-gray-50" aria-labelledby="core-features-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4" aria-label="Core features">
                Core Features
              </Badge>
              <h2
                id="core-features-heading"
                className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6"
              >
                Everything You Need for AI Orchestration
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From agent management to workflow automation, we provide a comprehensive suite of
                tools for modern AI development.
              </p>
            </div>

            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              role="list"
              aria-label="Core features"
            >
              <FeatureCard
                icon={Bot}
                title="AI Agent Management"
                description="Register, discover, and orchestrate AI agents with advanced capability advertising and dynamic skill matching."
                color="blue"
              />
              <FeatureCard
                icon={Workflow}
                title="Workflow Automation"
                description="Build sophisticated automation pipelines with drag-and-drop workflow designer and real-time monitoring."
                color="green"
              />
              <FeatureCard
                icon={MessageSquare}
                title="Agent Communication"
                description="Implements Google's A2A protocol and Model Context Protocol (MCP) for seamless inter-agent messaging."
                color="purple"
              />
              <FeatureCard
                icon={Shield}
                title="Enterprise Security"
                description="Role-based access control, audit logging, and enterprise-grade security for mission-critical deployments."
                color="red"
              />
              <FeatureCard
                icon={BarChart3}
                title="Advanced Analytics"
                description="Real-time monitoring, performance metrics, and intelligent insights for optimal system performance."
                color="indigo"
              />
              <FeatureCard
                icon={Settings}
                title="Developer Tools"
                description="VS Code extension, Chrome extension, and comprehensive APIs for seamless development experience."
                color="orange"
              />
            </div>
          </div>
        </section>

        {/* Technical Features Section */}
        <section className="py-20 bg-white" aria-labelledby="technical-features-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4" aria-label="Technical features">
                Technical Features
              </Badge>
              <h2
                id="technical-features-heading"
                className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6"
              >
                Built for Scale & Performance
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our platform is architected with modern best practices, ensuring reliability,
                scalability, and maintainability at enterprise scale.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <ul
                  className="grid grid-cols-1 gap-4"
                  role="list"
                  aria-label="Technical highlights"
                >
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" aria-hidden="true" />
                    <span className="text-gray-700">
                      Microservices Architecture with TypeScript/Node.js
                    </span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" aria-hidden="true" />
                    <span className="text-gray-700">
                      PNPM Workspaces Monorepo for Better Organization
                    </span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" aria-hidden="true" />
                    <span className="text-gray-700">
                      Prisma ORM with PostgreSQL for Data Management
                    </span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" aria-hidden="true" />
                    <span className="text-gray-700">
                      Docker Containerization & Kubernetes Ready
                    </span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" aria-hidden="true" />
                    <span className="text-gray-700">Comprehensive Testing & CI/CD Pipelines</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <GlassCard className="flex items-center space-x-4 p-4 rounded-lg">
                  <div className="shrink-0">
                    <Code className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Modern TypeScript Stack</h4>
                    <p className="text-sm text-gray-600">
                      Full-stack TypeScript with React, Node.js, and NestJS framework
                    </p>
                  </div>
                </GlassCard>
                <GlassCard className="flex items-center space-x-4 p-4 rounded-lg">
                  <div className="shrink-0">
                    <Network className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Protocol Implementation</h4>
                    <p className="text-sm text-gray-600">
                      Native support for MCP and A2A protocols for agent communication
                    </p>
                  </div>
                </GlassCard>
                <GlassCard className="flex items-center space-x-4 p-4 rounded-lg">
                  <div className="shrink-0">
                    <Terminal className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Developer Experience</h4>
                    <p className="text-sm text-gray-600">
                      Rich CLI tools, VS Code extension, and comprehensive documentation
                    </p>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          className="py-20 bg-linear-to-r from-blue-600 to-purple-700 text-white"
          aria-labelledby="features-cta-heading"
        >
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 id="features-cta-heading" className="text-4xl lg:text-5xl font-bold mb-6">
                Ready to Experience All Features?
              </h2>
              <p className="text-xl text-blue-100 mb-10">
                Start your journey today with our comprehensive AI collaboration platform.
              </p>

              <div
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                role="group"
                aria-label="Get started actions"
              >
                <PremiumButton
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group focus:ring-4 focus:ring-white/50"
                  aria-label="Get started free with The New Fuse"
                  onClick={() => window.location.href = '/auth/register'}
                >
                    Get Started Free
                    <ArrowRight
                      className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300"
                      aria-hidden="true"
                    />
                </PremiumButton>
                <PremiumButton
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg focus:ring-4 focus:ring-white/50"
                  aria-label="Access your dashboard"
                  onClick={() => window.location.href = '/auth/login'}
                >
                  Access Dashboard
                </PremiumButton>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-3 mb-4 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">The New Fuse</span>
          </Link>
          <p className="text-gray-400 text-sm mb-4">AI Agent Orchestration Platform</p>
          <div className="flex justify-center gap-6 text-sm text-gray-400">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/pricing" className="hover:text-white transition-colors">
              Pricing
            </Link>
            <Link to="/legal/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link to="/legal/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            © {new Date().getFullYear()} The New Fuse. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Features;
