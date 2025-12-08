import { LandingFooter } from '@/components/layout/LandingFooter';
import { LandingHeader } from '@/components/layout/LandingHeader';
import { SEOHead } from '@/components/seo/SEOHead';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePagePerformance } from '@/hooks/usePagePerformance';
import { GlassCard, GlassCardContent } from '@the-new-fuse/ui-consolidated';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  Box,
  CheckCircle,
  Chrome,
  Clock,
  Cloud,
  Code,
  Cpu,
  Database,
  GitBranch,
  Github,
  Globe,
  Layers,
  MessageSquare,
  Network,
  Play,
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
  gradient: string;
}) => (
  <GlassCard gradient={gradient}>
    <GlassCardContent className="p-8">
      <div className="relative">
        <div
          className={`w-14 h-14 rounded-2xl ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
        >
          <Icon className="h-7 w-7 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
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
  <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200 bg-gradient-to-br from-white to-gray-50">
    <CardContent className="p-6">
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
      >
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-lg font-bold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600 mb-4 text-sm">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

export const LandingRedesigned = () => {
  usePagePerformance('Landing Page Redesigned');

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title="The New Fuse - Revolutionary AI Collaboration Platform | MCP & A2A Protocol"
        description="Transform your workflow with The New Fuse - the most advanced AI agent orchestration platform. Build, deploy, and manage intelligent agents with MCP protocol, workflow automation, and real-time collaboration."
        keywords={[
          'AI platform',
          'AI agents',
          'workflow automation',
          'agent orchestration',
          'MCP protocol',
          'A2A protocol',
          'AI collaboration',
          'intelligent automation',
          'enterprise AI',
          'AI development platform',
        ]}
        canonical={typeof window !== 'undefined' ? window.location.origin : ''}
      />
      <LandingHeader />

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
                  Powered by MCP & A2A Protocols
                </Badge>
              </div>

              {/* Main Headline */}
              <h1
                id="hero-heading"
                className="text-6xl lg:text-8xl font-black mb-8 animate-fade-in-up animation-delay-200"
              >
                <span className="block text-gray-900">The Future of</span>
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  AI Orchestration
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl lg:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400">
                Build intelligent workflows, orchestrate AI agents, and automate complex tasks with
                the most powerful AI collaboration platform ever created.
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
                    Start Building Free
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 px-10 py-7 text-lg font-semibold group transition-all duration-300"
                  onClick={() => {
                    const videoSection = document.getElementById('demo-video');
                    videoSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </Button>
              </div>

              {/* Live Stats - Redesigned */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto animate-fade-in-up animation-delay-800">
                {[
                  {
                    value: 10000,
                    suffix: '+',
                    label: 'Active Users',
                    icon: Users,
                    color: 'from-blue-500 to-blue-600',
                  },
                  {
                    value: 250,
                    suffix: '+',
                    label: 'AI Agents',
                    icon: Bot,
                    color: 'from-purple-500 to-purple-600',
                  },
                  {
                    value: 5000,
                    suffix: '+',
                    label: 'Workflows',
                    icon: Workflow,
                    color: 'from-green-500 to-green-600',
                  },
                  {
                    value: 99.9,
                    suffix: '%',
                    label: 'Uptime',
                    icon: Activity,
                    color: 'from-orange-500 to-orange-600',
                  },
                ].map((stat, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r {stat.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity" />
                    <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                      <CardContent className="p-6 text-center">
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-r ${stat.color} flex items-center justify-center mx-auto mb-3`}
                        >
                          <stat.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-3xl font-black text-gray-900 mb-1">
                          <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                        </div>
                        <div className="text-sm font-semibold text-gray-600">{stat.label}</div>
                      </CardContent>
                    </Card>
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
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">
                Platform Overview
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6">
                One Platform, Infinite Possibilities
              </h2>
              <p className="text-xl text-gray-600">
                From AI agent management to workflow automation, The New Fuse provides everything
                you need to build the future of intelligent automation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              <ModernFeatureCard
                icon={Bot}
                title="AI Agent Marketplace"
                description="Discover, deploy, and manage 250+ pre-built AI agents. Each agent specializes in specific tasks, from code generation to data analysis."
                gradient="bg-gradient-to-br from-blue-500 to-blue-600"
              />
              <ModernFeatureCard
                icon={Network}
                title="MCP Protocol Native"
                description="Built on Model Context Protocol for seamless integration with any AI model. Connect Claude, GPT-4, Gemini, and custom models effortlessly."
                gradient="bg-gradient-to-br from-purple-500 to-purple-600"
              />
              <ModernFeatureCard
                icon={Workflow}
                title="Visual Workflow Builder"
                description="Design complex automation pipelines with drag-and-drop simplicity. Real-time execution monitoring and debugging included."
                gradient="bg-gradient-to-br from-green-500 to-green-600"
              />
              <ModernFeatureCard
                icon={MessageSquare}
                title="Agent-to-Agent Communication"
                description="Implements Google's A2A protocol for intelligent multi-agent coordination. Agents collaborate automatically to solve complex problems."
                gradient="bg-gradient-to-br from-orange-500 to-orange-600"
              />
              <ModernFeatureCard
                icon={Chrome}
                title="Browser Automation"
                description="Chrome extension with powerful automation capabilities. Capture context, automate web tasks, and integrate with any website."
                gradient="bg-gradient-to-br from-pink-500 to-pink-600"
              />
              <ModernFeatureCard
                icon={Terminal}
                title="VS Code Integration"
                description="Native IDE extension for seamless development. Code generation, debugging, and AI assistance right in your editor."
                gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
              />
            </div>
          </div>
        </section>

        {/* Why Choose The New Fuse - New Section */}
        <section className="py-24 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">
                Why Choose Us
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6">
                Built Different from the Ground Up
              </h2>
              <p className="text-xl text-gray-600">
                We didn't just build another AI tool. We created the operating system for AI
                collaboration.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: Zap,
                  title: 'Lightning-Fast Performance',
                  description:
                    'Sub-100ms response times with intelligent caching and edge computing',
                  stats: ['<100ms latency', 'Global CDN', '99.9% uptime'],
                },
                {
                  icon: Shield,
                  title: 'Enterprise-Grade Security',
                  description: 'SOC 2 compliant with end-to-end encryption and RBAC',
                  stats: ['SOC 2 Type II', 'E2E encryption', 'GDPR compliant'],
                },
                {
                  icon: Code,
                  title: 'Developer-First Design',
                  description: 'Comprehensive APIs, SDKs, and documentation for rapid integration',
                  stats: ['REST & GraphQL APIs', 'TypeScript SDKs', '100% documented'],
                },
                {
                  icon: Layers,
                  title: 'Modular Architecture',
                  description: 'Microservices-based design that scales with your needs',
                  stats: ['Docker ready', 'Kubernetes native', 'Horizontal scaling'],
                },
              ].map((item, idx) => (
                <Card
                  key={idx}
                  className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur group"
                >
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <item.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-3 text-gray-900">{item.title}</h3>
                        <p className="text-gray-600 mb-4 leading-relaxed">{item.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {item.stats.map((stat, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="bg-blue-100 text-blue-700"
                            >
                              {stat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases - Redesigned */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <Badge className="mb-4 bg-green-100 text-green-700 border-green-200">Use Cases</Badge>
              <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6">
                Transforming Industries Worldwide
              </h2>
              <p className="text-xl text-gray-600">
                From startups to enterprises, see how teams leverage The New Fuse to automate their
                workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              <UseCaseCard
                icon={Code}
                title="Software Development"
                description="Automate your entire development lifecycle"
                features={[
                  'Automated code review and testing',
                  'CI/CD pipeline orchestration',
                  'Bug detection and fixing',
                  'Documentation generation',
                ]}
                color="from-blue-500 to-blue-600"
              />
              <UseCaseCard
                icon={Users}
                title="Customer Support"
                description="Scale your support with intelligent agents"
                features={[
                  '24/7 automated responses',
                  'Multi-language support',
                  'Ticket routing and prioritization',
                  'Knowledge base integration',
                ]}
                color="from-green-500 to-green-600"
              />
              <UseCaseCard
                icon={BarChart3}
                title="Data Analytics"
                description="Transform raw data into actionable insights"
                features={[
                  'Automated data processing',
                  'Real-time analytics dashboards',
                  'Predictive modeling',
                  'Custom report generation',
                ]}
                color="from-purple-500 to-purple-600"
              />
              <UseCaseCard
                icon={Target}
                title="Marketing Automation"
                description="Personalize at scale with AI agents"
                features={[
                  'Content generation',
                  'Campaign optimization',
                  'Social media management',
                  'Lead scoring and nurturing',
                ]}
                color="from-pink-500 to-pink-600"
              />
              <UseCaseCard
                icon={Database}
                title="Data Engineering"
                description="Build robust data pipelines"
                features={[
                  'ETL workflow automation',
                  'Data quality monitoring',
                  'Schema management',
                  'Real-time data sync',
                ]}
                color="from-indigo-500 to-indigo-600"
              />
              <UseCaseCard
                icon={Puzzle}
                title="Business Operations"
                description="Streamline operations across departments"
                features={[
                  'Process automation',
                  'Document processing',
                  'Approval workflows',
                  'Resource allocation',
                ]}
                color="from-orange-500 to-orange-600"
              />
            </div>
          </div>
        </section>

        {/* Technology Stack - New Section */}
        <section
          className="py-24 bg-gradient-to-br from-gray-900 to-blue-900 text-white relative overflow-hidden"
          id="demo-video"
        >
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />

          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <Badge className="mb-4 bg-white/10 text-white border-white/20">Tech Stack</Badge>
              <h2 className="text-4xl lg:text-5xl font-black mb-6">Built with Modern Technology</h2>
              <p className="text-xl text-blue-100">
                Enterprise-grade infrastructure powered by cutting-edge technologies
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                { icon: Code, name: 'TypeScript', desc: 'Type-safe development' },
                { icon: Box, name: 'React 19', desc: 'Modern UI framework' },
                { icon: Terminal, name: 'NestJS', desc: 'Scalable backend' },
                { icon: Database, name: 'PostgreSQL', desc: 'Reliable database' },
                { icon: Cloud, name: 'Docker', desc: 'Containerization' },
                { icon: GitBranch, name: 'Git', desc: 'Version control' },
                { icon: Cpu, name: 'Redis', desc: 'High-speed caching' },
                { icon: Globe, name: 'Railway', desc: 'Cloud deployment' },
              ].map((tech, idx) => (
                <Card
                  key={idx}
                  className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 group backdrop-blur"
                >
                  <CardContent className="p-6 text-center">
                    <tech.icon className="h-10 w-10 mx-auto mb-3 text-blue-400 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-white mb-1">{tech.name}</div>
                    <div className="text-sm text-blue-200">{tech.desc}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-16 text-center">
              <p className="text-blue-100 mb-6 text-lg">
                Open source and extensible. Built by developers, for developers.
              </p>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg"
              >
                <Link to="https://github.com/whodaniel/fuse" target="_blank">
                  <Github className="mr-2 h-5 w-5" />
                  View on GitHub
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Social Proof - New Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <Badge className="mb-4 bg-yellow-100 text-yellow-700 border-yellow-200">
                Trusted By
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6">
                Join Thousands of Teams Building with AI
              </h2>
              <p className="text-xl text-gray-600">
                From startups to Fortune 500 companies, teams worldwide trust The New Fuse
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  quote:
                    'The New Fuse transformed how we build and deploy AI agents. What took weeks now takes hours.',
                  author: 'Sarah Chen',
                  role: 'CTO, TechStartup Inc',
                  rating: 5,
                },
                {
                  quote:
                    "Best AI orchestration platform we've used. The MCP integration is seamless and powerful.",
                  author: 'Michael Rodriguez',
                  role: 'Lead Developer, DataCorp',
                  rating: 5,
                },
                {
                  quote:
                    'Incredible developer experience. The VS Code extension alone saved us countless hours.',
                  author: 'Emily Watson',
                  role: 'Engineering Manager, CloudSolutions',
                  rating: 5,
                },
              ].map((testimonial, idx) => (
                <Card
                  key={idx}
                  className="border-2 border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300"
                >
                  <CardContent className="p-8">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-6 italic leading-relaxed">
                      "{testimonial.quote}"
                    </p>
                    <div>
                      <div className="font-bold text-gray-900">{testimonial.author}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
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
              <h2 className="text-5xl lg:text-7xl font-black mb-8">Ready to Build the Future?</h2>
              <p className="text-2xl text-blue-100 mb-12 leading-relaxed">
                Join 10,000+ developers already building with The New Fuse. Start free, scale as you
                grow.
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
                    <span className="text-lg font-bold">No Credit Card</span>
                  </div>
                  <p className="text-blue-100 text-sm">Start building immediately</p>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-6 w-6 text-green-400 mr-2" />
                    <span className="text-lg font-bold">5-Minute Setup</span>
                  </div>
                  <p className="text-blue-100 text-sm">Deploy your first agent fast</p>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-6 w-6 text-green-400 mr-2" />
                    <span className="text-lg font-bold">Scale Infinitely</span>
                  </div>
                  <p className="text-blue-100 text-sm">Grow without limits</p>
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
