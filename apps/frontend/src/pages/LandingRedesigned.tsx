import { LandingFooter } from '@/components/layout/LandingFooter';
import { SEOHead } from '@/components/seo/SEOHead';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GlassCard, CardContent as GlassCardContent } from '@/components/ui/design-system';
import { usePagePerformance } from '@/hooks/usePagePerformance';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle,
  Chrome,
  Clock,
  Code,
  Database,
  Layers,
  MessageSquare,
  Network,
  Puzzle,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Target,
  Terminal,
  TrendingUp,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Animated gradient background
const AnimatedBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-blob" />
    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-green-500/20 to-blue-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
  </div>
);

// Animated counter component
const AnimatedCounter = ({
  end,
  duration = 2000,
  suffix = '',
}: {
  end: number;
  duration?: number;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

// Feature card with hover effects
const ModernFeatureCard = ({
  icon: Icon,
  title,
  description,
  gradient,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  gradient: string;
}) => (
  <GlassCard gradient={gradient} className="bg-white/5 border-white/10">
    <GlassCardContent className="p-8">
      <div className="relative">
        <div
          className={`w-14 h-14 rounded-2xl ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
        >
          <Icon className="h-7 w-7 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-3 text-white group-hover:text-blue-400 transition-colors">
          {title}
        </h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </GlassCardContent>
  </GlassCard>
);

// Use case card
const UseCaseCard = ({
  icon: Icon,
  title,
  description,
  features,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  features: string[];
  color: string;
}) => (
  <GlassCard className="group hover:shadow-xl transition-all duration-300 border border-white/10 hover:border-blue-500/50 bg-white/5">
    <GlassCardContent className="p-6">
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
      >
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-lg font-bold mb-2 text-white">{title}</h3>
      <p className="text-gray-400 mb-4 text-sm">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start text-sm text-gray-300">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </GlassCardContent>
  </GlassCard>
);

export const LandingRedesigned = () => {
  usePagePerformance('Landing Page Redesigned');

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-white selection:bg-blue-500/30">
      <SEOHead
        title="The New Fuse - The Operating System for AI Collaboration"
        description="Unified AI orchestration platform featuring Master Command Center, Native MCP Protocol, and Autonomous Agent coordination. Build, deploy, and evolve your AI infrastructure."
        keywords={[
          'AI platform',
          'AI collaboration',
          'VS Code Extension',
          'Master Command Center',
          'MCP Protocol',
          'Autonomous Agents',
          'Self-evolving AI',
          'Agent Orchestration',
        ]}
        canonical={typeof window !== 'undefined' ? window.location.origin : ''}
      />

      <main className="flex-grow" role="main">
        {/* Hero Section - Completely Redesigned */}
        <section
          className="relative min-h-screen flex items-center justify-center overflow-hidden"
          aria-labelledby="hero-heading"
        >
          <AnimatedBackground />

          <div className="relative container mx-auto px-4 py-20">
            <div className="max-w-6xl mx-auto text-center">
              {/* Badge */}
              <div className="flex justify-center mb-8 animate-fade-in-up">
                <Badge className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 text-sm font-semibold shadow-lg">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Native MCP & Agent-to-Agent Protocol
                </Badge>
              </div>

              {/* Main Headline */}
              <h1
                id="hero-heading"
                className="text-6xl lg:text-8xl font-black mb-8 animate-fade-in-up animation-delay-200"
              >
                <span className="block text-white">The Operating System for</span>
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  AI Collaboration
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400">
                A unified control plane for your entire AI workforce. Orchestrate multi-model
                agents, automate complex workflows, and leverage the Master Command Center right
                from your IDE.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up animation-delay-600">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-7 text-lg font-bold shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 group border-0"
                >
                  <Link to="/auth/register">
                    <Rocket className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    Launch Command Center
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>

              {/* Live Stats - Redesigned */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto animate-fade-in-up animation-delay-800">
                {[
                  {
                    value: 250,
                    suffix: '+',
                    label: 'Pre-built Agents',
                    icon: Bot,
                    color: 'from-blue-500 to-blue-600',
                  },
                  {
                    value: 50,
                    suffix: '+',
                    label: 'MCP Integrations',
                    icon: Network,
                    color: 'from-purple-500 to-purple-600',
                  },
                  {
                    value: 1000,
                    suffix: 'ms',
                    label: 'Sync Latency',
                    icon: Activity,
                    color: 'from-green-500 to-green-600',
                  },
                  {
                    value: 99.99,
                    suffix: '%',
                    label: 'System Uptime',
                    icon: Shield,
                    color: 'from-orange-500 to-orange-600',
                  },
                ].map((stat, idx) => (
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r {stat.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity" />
                    <GlassCard className="border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/5 backdrop-blur-sm">
                      <GlassCardContent className="p-6 text-center">
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-r ${stat.color} flex items-center justify-center mx-auto mb-3`}
                        >
                          <stat.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-3xl font-black text-white mb-1">
                          <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                        </div>
                        <div className="text-sm font-semibold text-gray-400">{stat.label}</div>
                      </GlassCardContent>
                    </GlassCard>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-scroll" />
            </div>
          </div>
        </section>

        {/* Platform Overview - New Section */}
        <section className="py-24 bg-transparent relative overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/20">
                Core Architecture
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">
                Modular, Standardized, Powerful
              </h2>
              <p className="text-xl text-gray-300">
                Built on the Model Context Protocol standards, providing a unified interface for any
                AI model, tool, or data source.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              <ModernFeatureCard
                icon={Bot}
                title="Unified Agent Ecosystem"
                description="Access a registry of specialized agents. From autonomous coding agents to specialized data analysts, all communicating via standard A2A protocols."
                gradient="bg-gradient-to-br from-blue-500 to-blue-600"
              />
              <ModernFeatureCard
                icon={Network}
                title="Native MCP Support"
                description="The first platform built entirely on the Model Context Protocol. Seamlessly connect local resources, databases, and APIs to your agents context."
                gradient="bg-gradient-to-br from-purple-500 to-purple-600"
              />
              <ModernFeatureCard
                icon={Terminal}
                title="Master Command Center"
                description="Your VS Code becomes mission control. Execute workflows, monitor agent swarms, and debug responses directly from your IDE."
                gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
              />
              <ModernFeatureCard
                icon={MessageSquare}
                title="Multi-Model Orchestration"
                description="Route tasks to the best model for the job. Parallelize requests across leading foundation models and custom LLMs for optimal performance."
                gradient="bg-gradient-to-br from-orange-500 to-orange-600"
              />
              <ModernFeatureCard
                icon={Workflow}
                title="Autonomous Workflows"
                description="Define expected outcomes and let the system self-organize. Agents dynamically form teams to solve complexity."
                gradient="bg-gradient-to-br from-green-500 to-green-600"
              />
              <ModernFeatureCard
                icon={Chrome}
                title="Universal Context Bridge"
                description="Connect browser sessions, local files, and external docs into a single shared context window for all your agents."
                gradient="bg-gradient-to-br from-pink-500 to-pink-600"
              />
            </div>
          </div>
        </section>

        {/* Why Choose The New Fuse - New Section */}
        <section className="py-24 bg-transparent relative">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20">
                System Capabilities
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">
                Engineered for Evolution
              </h2>
              <p className="text-xl text-gray-300">
                A platform that learns and adapts. The more you use it, the smarter your agent
                workforce becomes.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: Zap,
                  title: 'WebSocket Real-Time Sync',
                  description:
                    'Instant state synchronization between your IDE, browser, and backend services via optimized WebSocket streams.',
                  stats: ['<50ms sync', 'Redis Pub/Sub', 'Event-Driven'],
                },
                {
                  icon: Shield,
                  title: 'Secure Context Isolation',
                  description:
                    'Enterprise-grade sandboxing ensures agent actions are contained and authorized.',
                  stats: ['Docker Sandboxing', 'RBAC', 'Audit Logging'],
                },
                {
                  icon: Code,
                  title: 'Extensible via Plugins',
                  description:
                    'Add new capabilities using standard TypeScript plugins. Publish to the private or public marketplace.',
                  stats: ['TypeScript API', 'Hot Module Reload', 'NPM Compatible'],
                },
                {
                  icon: Layers,
                  title: 'Docker-First Deployment',
                  description:
                    'Spin up the entire stack with a single command. Production parity from local dev to cloud.',
                  stats: ['Docker Compose', 'K8s Ready', 'Zero-Config'],
                },
              ].map((item, idx) => (
                <GlassCard
                  key={idx}
                  className="border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/5 backdrop-blur group"
                >
                  <GlassCardContent className="p-8">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <item.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-3 text-white">{item.title}</h3>
                        <p className="text-gray-400 mb-4 leading-relaxed">{item.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {item.stats.map((stat, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="bg-blue-500/10 text-blue-300 border-blue-500/20"
                            >
                              {stat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </GlassCardContent>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases - Redesigned */}
        <section className="py-24 bg-transparent">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <Badge className="mb-4 bg-green-500/10 text-green-400 border-green-500/20">
                Use Cases
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">
                From Scripting to Self-Evolving Systems
              </h2>
              <p className="text-xl text-gray-300">
                Empower your teams to move beyond simple chatbots to fully autonomous agent fleets.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              <UseCaseCard
                icon={Code}
                title="Self-Evolving Development"
                description="Agents that improve their own codebases"
                features={[
                  'Automated refactoring loops',
                  'Test-driven self-correction',
                  'Documentation auto-updates',
                  'Dependency auditing',
                ]}
                color="from-blue-500 to-blue-600"
              />
              <UseCaseCard
                icon={Users}
                title="Collaborative Swarms"
                description="Diverse agent teams solving complex problems"
                features={[
                  'Role-based task distribution',
                  'Consensus mechanisms',
                  'Shared memory context',
                  'Conflict resolution',
                ]}
                color="from-green-500 to-green-600"
              />
              <UseCaseCard
                icon={BarChart3}
                title="Intelligent Analysis"
                description="Deep insights from unstructured data"
                features={[
                  'Multi-modal data processing',
                  'Trend prediction agents',
                  'Anomaly detection',
                  'Automated reporting',
                ]}
                color="from-purple-500 to-purple-600"
              />
              <UseCaseCard
                icon={Target}
                title="Personalized Engagement"
                description="1:1 interactions at infinite scale"
                features={[
                  'Context-aware conversations',
                  'Behavioral adaptation',
                  'Sentiment analysis',
                  'Proactive engagement',
                ]}
                color="from-pink-500 to-pink-600"
              />
              <UseCaseCard
                icon={Database}
                title="Knowledge Synthesis"
                description="Turn information into wisdom"
                features={[
                  'Cross-source verification',
                  'Ontology mapping',
                  'Recursive summarization',
                  'Knowledge graph building',
                ]}
                color="from-indigo-500 to-indigo-600"
              />
              <UseCaseCard
                icon={Puzzle}
                title="System Integration"
                description="Glue for the API economy"
                features={[
                  'Auto-generated API clients',
                  'Protocol translation',
                  'Error recovery',
                  'Rate limit optimization',
                ]}
                color="from-orange-500 to-orange-600"
              />
            </div>
          </div>
        </section>

        {/* Social Proof - New Section */}
        <section className="py-24 bg-transparent">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <Badge className="mb-4 bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                Community
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">
                Developers Love The New Fuse
              </h2>
              <p className="text-xl text-gray-300">
                Join the thousands of engineers building the next generation of AI software.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  quote:
                    'Finally, an AI platform that fits into my actual workflow. The VS Code extension is a game changer.',
                  author: 'Alex Chen',
                  role: 'Senior Staff Engineer',
                  rating: 5,
                },
                {
                  quote:
                    "The MCP integration allows us to swap models without rewriting code. It's properly future-proof.",
                  author: 'Sarah Johnson',
                  role: 'AI Architect',
                  rating: 5,
                },
                {
                  quote:
                    'From local Docker dev to Railway production in minutes. The DX is unparalleled.',
                  author: 'David Kim',
                  role: 'Founder, AI Startup',
                  rating: 5,
                },
              ].map((testimonial, idx) => (
                <GlassCard
                  key={idx}
                  className="border-white/10 hover:border-blue-500/30 hover:shadow-xl transition-all duration-300 bg-white/5"
                >
                  <GlassCardContent className="p-8">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-300 mb-6 italic leading-relaxed">
                      "{testimonial.quote}"
                    </p>
                    <div>
                      <div className="font-bold text-white">{testimonial.author}</div>
                      <div className="text-sm text-gray-400">{testimonial.role}</div>
                    </div>
                  </GlassCardContent>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA - Redesigned */}
        <section className="py-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <AnimatedBackground />

          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-5xl lg:text-7xl font-black mb-8">
                Deploy Your First Agent Squad
              </h2>
              <p className="text-2xl text-blue-100 mb-12 leading-relaxed">
                Stop writing boilerplate glue code. Start orchestrating intelligent systems today.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-12 py-8 text-xl font-bold shadow-2xl hover:shadow-white/50 transition-all duration-300 group"
                >
                  <Link to="/auth/register">
                    Get Started Free
                    <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/30 text-white hover:bg-white/10 px-12 py-8 text-xl font-semibold backdrop-blur"
                >
                  <Link to="/auth/login">Sign In</Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="h-6 w-6 text-green-400 mr-2" />
                    <span className="text-lg font-bold">Open Source Core</span>
                  </div>
                  <p className="text-blue-100 text-sm">MIT Licensed</p>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-6 w-6 text-green-400 mr-2" />
                    <span className="text-lg font-bold">1-Click Deploy</span>
                  </div>
                  <p className="text-blue-100 text-sm">Docker & Railway ready</p>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-6 w-6 text-green-400 mr-2" />
                    <span className="text-lg font-bold">Self-Hosting</span>
                  </div>
                  <p className="text-blue-100 text-sm">Keep your data private</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
};

// Export as default for backward compatibility
export default LandingRedesigned;
