/**
 * The New Fuse - Modern Landing Page
 * Fully redesigned to use the comprehensive design system
 * Implements StandardLayout, design tokens, and consistent components
 */

import { StandardLayout } from '@/components/layout/StandardLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { GlassCard, PremiumButton } from '@/components/ui/premium';
import { usePagePerformance } from '@/hooks/usePagePerformance';
import { Badge, Card, CardContent } from '@the-new-fuse/ui-consolidated';
import {
  ArrowRight,
  Award,
  BarChart3,
  Bot,
  CheckCircle,
  Chrome,
  Code,
  Cpu,
  Github,
  Globe,
  MessageSquare,
  Network,
  Quote,
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

// Animated Counter Component using design system
const AnimatedCounter = ({ end, duration = 2000 }: { end: number; duration?: number }) => {
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

  return <span className="text-primary-600 font-bold">{count.toLocaleString()}</span>;
};

// Standardized Feature Card using design system components
const FeatureCard = ({
  icon: Icon,
  title,
  description,
  color = 'primary',
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color?: string;
}) => {
  const colorClasses = {
    primary: 'bg-gradient-to-br from-primary-500 to-primary-600',
    secondary: 'bg-gradient-to-br from-secondary-500 to-secondary-600',
    success: 'bg-gradient-to-br from-success-500 to-success-600',
    warning: 'bg-gradient-to-br from-warning-500 to-warning-600',
    danger: 'bg-gradient-to-br from-danger-500 to-danger-600',
    indigo: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    orange: 'bg-gradient-to-br from-orange-500 to-orange-600',
  };

  return (
    <Card
      className="group hover:shadow-lg transition-all duration-300 border-0 bg-background hover:bg-background/90 fade-in"
      role="listitem"
    >
      <CardContent className="p-6">
        <div
          className={`w-12 h-12 rounded-lg ${colorClasses[color] || colorClasses.primary} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
          aria-hidden="true"
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
};

// Standardized Tech Stack Item using design system
const TechStackItem = ({
  icon: Icon,
  name,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  description: string;
}) => (
  <div className="flex items-start space-x-3 p-4 rounded-lg bg-background border border-border hover:border-primary-300 transition-colors duration-300 fade-in">
    <div className="flex-shrink-0">
      <Icon className="h-6 w-6 text-primary-600" />
    </div>
    <div>
      <h4 className="font-medium text-foreground">{name}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

// Main Landing Page Component
export const Landing = () => {
  // Track page performance metrics
  usePagePerformance('Landing Page');

  // Standardized breadcrumbs for consistency
  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Platform', path: '/landing' },
  ];

  return (
    <StandardLayout
      title="The New Fuse AI Platform"
      subtitle="Next-Generation AI Collaboration & Automation"
      breadcrumbs={breadcrumbs}
      showSidebar={false}
      showHeader={true}
      showFooter={true}
    >
      <div className="min-h-screen flex flex-col">
        <SEOHead
          title="The New Fuse - AI Collaboration Platform | Workflow Automation & Agent Orchestration"
          description="Orchestrate intelligent workflows, enable seamless agent communication, and unlock the full potential of AI automation with The New Fuse. Support for MCP and A2A protocols."
          keywords={[
            'AI platform',
            'workflow automation',
            'AI agents',
            'agent orchestration',
            'MCP protocol',
            'A2A protocol',
            'enterprise AI',
            'AI collaboration',
            'intelligent automation',
          ]}
          canonical={typeof window !== 'undefined' ? window.location.origin : ''}
        />

        <main className="flex-grow" role="main">
          {/* Hero Section - Using design system gradients and components */}
          <section
            className="relative py-20 lg:py-32 gradient-primary text-white overflow-hidden"
            aria-labelledby="hero-heading"
          >
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600/30 to-secondary-600/30"></div>

            {/* Animated background elements using design system */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-gradient-to-br from-primary-400/20 to-secondary-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-gradient-to-tr from-indigo-400/20 to-primary-500/20 rounded-full blur-3xl animate-pulse"></div>
            </div>

            <div className="relative container mx-auto px-4 text-center">
              <div className="max-w-5xl mx-auto">
                <Badge
                  className="mb-6 bg-white/10 text-white border-white/20 hover:bg-white/20 fade-in"
                  aria-label="Platform badge"
                >
                  <Cpu className="w-4 h-4 mr-2" aria-hidden="true" />
                  The First Autopoietic AI System
                </Badge>

                <h1
                  id="hero-heading"
                  className="text-5xl lg:text-7xl font-bold mb-6 leading-tight fade-in"
                >
                  Software That
                  <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Builds Itself
                  </span>
                </h1>

                <p className="text-xl lg:text-2xl mb-10 text-blue-100 max-w-4xl mx-auto leading-relaxed fade-in animation-delay-100">
                  The world's first <strong>Self-Improving AI Framework</strong>. Deploy an
                  autonomous swarm that analyzes its own code, architect's upgrades, and deploys
                  fixes—without your help.
                </p>

                <div
                  className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 fade-in animation-delay-200"
                  role="group"
                  aria-label="Call to action buttons"
                >
                  <Link to="/auth/register">
                    <PremiumButton
                      size="lg"
                      variant="primary"
                      icon={Cpu}
                      iconPosition="left"
                      className="px-8 py-4 text-lg font-semibold shadow-2xl hover:shadow-3xl group"
                    >
                      Deploy The Swarm
                      <ArrowRight
                        className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300"
                        aria-hidden="true"
                      />
                    </PremiumButton>
                  </Link>
                  <PremiumButton
                    size="lg"
                    variant="outline"
                    className="px-8 py-4 text-lg"
                    onClick={() => {
                      const demoSection = document.getElementById('features-section');
                      demoSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  >
                    See It Evolve
                  </PremiumButton>
                </div>

                {/* Live Stats - Using design system colors and components */}
                <div
                  className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto fade-in animation-delay-300"
                  role="region"
                  aria-label="Platform statistics"
                >
                  <div className="text-center">
                    <div
                      className="text-3xl lg:text-4xl font-bold text-yellow-400"
                      aria-label="150 plus AI agents"
                    >
                      <AnimatedCounter end={150} />+
                    </div>
                    <div className="text-blue-200 text-sm font-medium">AI Agents</div>
                  </div>
                  <div className="text-center">
                    <div
                      className="text-3xl lg:text-4xl font-bold text-green-400"
                      aria-label="2500 plus workflows"
                    >
                      <AnimatedCounter end={2500} />+
                    </div>
                    <div className="text-blue-200 text-sm font-medium">Workflows</div>
                  </div>
                  <div className="text-center">
                    <div
                      className="text-3xl lg:text-4xl font-bold text-purple-400"
                      aria-label="50000 plus messages per day"
                    >
                      <AnimatedCounter end={50000} />+
                    </div>
                    <div className="text-blue-200 text-sm font-medium">Messages/Day</div>
                  </div>
                  <div className="text-center">
                    <div
                      className="text-3xl lg:text-4xl font-bold text-orange-400"
                      aria-label="157 Orphaned Components"
                    >
                      54+
                    </div>
                    <div className="text-blue-200 text-sm font-medium">Monorepo Packages</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Core Features Section - Using design system grid and components */}
          <section
            id="features-section"
            className="py-20 bg-background"
            aria-labelledby="features-heading"
          >
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <Badge className="mb-4" aria-label="Core platform features">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Core Capabilities
                </Badge>
                <h2
                  id="features-heading"
                  className="text-4xl lg:text-5xl font-bold text-foreground mb-6 fade-in"
                >
                  Engineered for Autonomy
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto fade-in animation-delay-100">
                  This isn't just a chatbot. It's a complex adaptive system powered by a 5-agent
                  swarm that continuously analyzes, architects, and improves its own codebase.
                </p>
              </div>

              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 fade-in animation-delay-200"
                role="list"
                aria-label="Core features"
              >
                <FeatureCard
                  icon={Bot}
                  title="Self-Correction Swarm"
                  description="A dedicated 5-agent team (Analyzer, Architect, Implementer) living inside your API that detects bugs and writes its own fixes."
                  color="primary"
                />
                <FeatureCard
                  icon={Network}
                  title="Native MCP Support"
                  description="Built on the Model Context Protocol standard. Connect seamlessly to local resources, GitHub, and external tools as native functions."
                  color="success"
                />
                <FeatureCard
                  icon={Chrome}
                  title="Browser Hub Awareness"
                  description="Give your agents eyes. The integrated Browser Hub and Chrome Extension allow agents to see, browse, and scrape the live web."
                  color="indigo"
                />
                <FeatureCard
                  icon={Shield}
                  title="Fort Knox Security"
                  description="The Reviewer Agent audits every line of generated code for SQL injection, XSS, and vulnerabilities before it ever runs."
                  color="danger"
                />
                <FeatureCard
                  icon={MessageSquare}
                  title="Multi-Agent Collaboration"
                  description="Agents don't work alone. They communicate via A2A protocols to delegate tasks, share context, and solve complex problems together."
                  color="purple"
                />
                <FeatureCard
                  icon={Workflow}
                  title="Visual Neural Builder"
                  description="Drag-and-drop your agent's brain. Create complex logic flows visually, then let the swarm optimize them for performance."
                  color="orange"
                />
              </div>
            </div>
          </section>

          {/* Technical Excellence Section - Using design system components */}
          <section className="py-20 bg-background" aria-labelledby="technical-heading">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                  <Badge className="mb-4" aria-label="Technical excellence">
                    Technical Excellence
                  </Badge>
                  <h2
                    id="technical-heading"
                    className="text-4xl lg:text-5xl font-bold text-foreground mb-6 fade-in"
                  >
                    Built for Scale & Performance
                  </h2>
                  <p className="text-lg text-muted-foreground mb-8 fade-in animation-delay-100">
                    Our platform is architected with modern best practices, ensuring reliability,
                    scalability, and maintainability at enterprise scale.
                  </p>

                  <ul
                    className="grid grid-cols-1 gap-4 fade-in animation-delay-200"
                    role="list"
                    aria-label="Technical highlights"
                  >
                    <li className="flex items-center space-x-3">
                      <CheckCircle
                        className="h-5 w-5 text-success-500 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-foreground">
                        Microservices Architecture with TypeScript/Node.js
                      </span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle
                        className="h-5 w-5 text-success-500 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-foreground">
                        PNPM Workspaces Monorepo for Better Organization
                      </span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle
                        className="h-5 w-5 text-success-500 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-foreground">
                        Prisma ORM with PostgreSQL for Data Management
                      </span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle
                        className="h-5 w-5 text-success-500 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-foreground">
                        Docker Containerization & Kubernetes Ready
                      </span>
                    </li>
                    <li className="flex items-center space-x-3">
                      <CheckCircle
                        className="h-5 w-5 text-success-500 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-foreground">
                        Comprehensive Testing & CI/CD Pipelines
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4 fade-in animation-delay-300">
                  <TechStackItem
                    icon={Code}
                    name="54-Package Monorepo"
                    description="A massive, modular PNPM workspace architecture designed for cleaner code separation and infinite scalability."
                  />
                  <TechStackItem
                    icon={Network}
                    name="Protocol Implementation"
                    description="Native support for MCP and A2A protocols for agent communication"
                  />
                  <TechStackItem
                    icon={Cpu}
                    name="High Performance"
                    description="Optimized for low latency and high throughput agent interactions"
                  />
                  <TechStackItem
                    icon={Terminal}
                    name="Self-Improving Agents"
                    description="Agents that can analyze their own code, identify debt, and rewrite themselves for better performance."
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Integration Ecosystem - Using design system cards */}
          <section
            className="py-20 gradient-secondary text-white"
            id="demo-section"
            aria-labelledby="integration-heading"
          >
            <div className="container mx-auto px-4 text-center">
              <Badge
                className="mb-4 bg-white/10 text-white border-white/20 fade-in"
                aria-label="Integration ecosystem"
              >
                Integration Ecosystem
              </Badge>
              <h2
                id="integration-heading"
                className="text-4xl lg:text-5xl font-bold mb-6 fade-in animation-delay-100"
              >
                Seamlessly Integrates with Your Workflow
              </h2>
              <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto fade-in animation-delay-200">
                Connect with your existing tools and platforms through our extensive integration
                ecosystem.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 fade-in animation-delay-300">
                <Card className="bg-white/10 border-white/20 text-white hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-8 text-center">
                    <Github className="h-12 w-12 mx-auto mb-4 text-primary-400" />
                    <h3 className="text-xl font-semibold mb-3">GitHub Integration</h3>
                    <p className="text-blue-100">
                      Seamless code repository management and CI/CD integration
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 border-white/20 text-white hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-8 text-center">
                    <Code className="h-12 w-12 mx-auto mb-4 text-success-400" />
                    <h3 className="text-xl font-semibold mb-3">VS Code Extension</h3>
                    <p className="text-blue-100">
                      Native IDE support for enhanced development experience
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 border-white/20 text-white hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-8 text-center">
                    <Chrome className="h-12 w-12 mx-auto mb-4 text-warning-400" />
                    <h3 className="text-xl font-semibold mb-3">Chrome Extension</h3>
                    <p className="text-blue-100">
                      Browser-based agent interaction and workflow management
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Use Cases Section - Using design system components */}
          <section className="py-20 bg-background" aria-labelledby="use-cases-heading">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <Badge className="mb-4" aria-label="Use cases">
                  Use Cases
                </Badge>
                <h2
                  id="use-cases-heading"
                  className="text-4xl lg:text-5xl font-bold text-foreground mb-6 fade-in"
                >
                  Powering Innovation Across Industries
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto fade-in animation-delay-100">
                  From software development to business automation, see how organizations leverage
                  The New Fuse.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 fade-in animation-delay-200">
                <div className="space-y-8">
                  <div className="border-l-4 border-primary-500 pl-6">
                    <div className="flex items-center mb-3">
                      <Target className="h-6 w-6 text-primary-500 mr-3" />
                      <h3 className="text-xl font-semibold text-foreground">
                        Software Development
                      </h3>
                    </div>
                    <p className="text-muted-foreground">
                      Automate code review, testing, and deployment processes with intelligent AI
                      agents that understand your codebase and team workflow.
                    </p>
                  </div>

                  <div className="border-l-4 border-success-500 pl-6">
                    <div className="flex items-center mb-3">
                      <Users className="h-6 w-6 text-success-500 mr-3" />
                      <h3 className="text-xl font-semibold text-foreground">Customer Support</h3>
                    </div>
                    <p className="text-muted-foreground">
                      Deploy intelligent support agents that can escalate complex issues, access
                      knowledge bases, and provide 24/7 customer assistance.
                    </p>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-6">
                    <div className="flex items-center mb-3">
                      <BarChart3 className="h-6 w-6 text-purple-500 mr-3" />
                      <h3 className="text-xl font-semibold text-foreground">Data Analytics</h3>
                    </div>
                    <p className="text-muted-foreground">
                      Create data processing pipelines with AI agents that can analyze, transform,
                      and generate insights from complex datasets.
                    </p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="border-l-4 border-orange-500 pl-6">
                    <div className="flex items-center mb-3">
                      <Zap className="h-6 w-6 text-orange-500 mr-3" />
                      <h3 className="text-xl font-semibold text-foreground">Business Automation</h3>
                    </div>
                    <p className="text-muted-foreground">
                      Streamline business processes with intelligent workflow automation that adapts
                      to changing requirements and business rules.
                    </p>
                  </div>

                  <div className="border-l-4 border-danger-500 pl-6">
                    <div className="flex items-center mb-3">
                      <Shield className="h-6 w-6 text-danger-500 mr-3" />
                      <h3 className="text-xl font-semibold text-foreground">Security Operations</h3>
                    </div>
                    <p className="text-muted-foreground">
                      Deploy security agents that monitor threats, analyze logs, and respond to
                      incidents with coordinated automated responses.
                    </p>
                  </div>

                  <div className="border-l-4 border-indigo-500 pl-6">
                    <div className="flex items-center mb-3">
                      <Globe className="h-6 w-6 text-indigo-500 mr-3" />
                      <h3 className="text-xl font-semibold text-foreground">
                        IoT & Edge Computing
                      </h3>
                    </div>
                    <p className="text-muted-foreground">
                      Orchestrate distributed IoT systems with edge-deployed agents that can make
                      real-time decisions and coordinate with cloud services.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Social Proof Section - Testimonials and Metrics */}
          <section
            className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
            aria-labelledby="social-proof-heading"
          >
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <Badge className="mb-4" aria-label="Social proof">
                  <Award className="w-4 h-4 mr-2" />
                  Trusted by Innovators
                </Badge>
                <h2
                  id="social-proof-heading"
                  className="text-4xl lg:text-5xl font-bold text-foreground mb-6 fade-in"
                >
                  Join the AI Orchestration Revolution
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto fade-in animation-delay-100">
                  Organizations worldwide are transforming their AI operations with The New Fuse
                </p>
              </div>

              {/* Metrics Grid using GlassCard components */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 fade-in animation-delay-200">
                <GlassCard gradient="blue" className="text-center">
                  <div className="flex flex-col items-center">
                    <TrendingUp className="w-10 h-10 text-blue-400 mb-3" />
                    <div className="text-4xl font-bold text-white mb-2">500%</div>
                    <div className="text-sm text-gray-300">Average Productivity Increase</div>
                  </div>
                </GlassCard>
                <GlassCard gradient="green" className="text-center">
                  <div className="flex flex-col items-center">
                    <Zap className="w-10 h-10 text-green-400 mb-3" />
                    <div className="text-4xl font-bold text-white mb-2">10x</div>
                    <div className="text-sm text-gray-300">Faster Workflow Deployment</div>
                  </div>
                </GlassCard>
                <GlassCard gradient="purple" className="text-center">
                  <div className="flex flex-col items-center">
                    <Users className="w-10 h-10 text-purple-400 mb-3" />
                    <div className="text-4xl font-bold text-white mb-2">10,000+</div>
                    <div className="text-sm text-gray-300">Active Developers</div>
                  </div>
                </GlassCard>
                <GlassCard gradient="orange" className="text-center">
                  <div className="flex flex-col items-center">
                    <Star className="w-10 h-10 text-orange-400 mb-3" />
                    <div className="text-4xl font-bold text-white mb-2">99.9%</div>
                    <div className="text-sm text-gray-300">Customer Satisfaction</div>
                  </div>
                </GlassCard>
              </div>

              {/* Testimonials */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 fade-in animation-delay-300">
                <GlassCard gradient="cyan" className="relative">
                  <Quote className="w-8 h-8 text-cyan-400 mb-4 opacity-50" />
                  <p className="text-white text-lg mb-4 leading-relaxed">
                    "The New Fuse transformed how we deploy AI agents. What used to take weeks now
                    takes hours."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                      SJ
                    </div>
                    <div>
                      <div className="text-white font-semibold">Sarah Johnson</div>
                      <div className="text-gray-400 text-sm">CTO, TechCorp</div>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard gradient="purple" className="relative">
                  <Quote className="w-8 h-8 text-purple-400 mb-4 opacity-50" />
                  <p className="text-white text-lg mb-4 leading-relaxed">
                    "Finally, an AI orchestration platform that feels like conducting a symphony
                    instead of herding cats."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg">
                      MC
                    </div>
                    <div>
                      <div className="text-white font-semibold">Michael Chen</div>
                      <div className="text-gray-400 text-sm">Lead Architect, DataFlow</div>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard gradient="green" className="relative">
                  <Quote className="w-8 h-8 text-green-400 mb-4 opacity-50" />
                  <p className="text-white text-lg mb-4 leading-relaxed">
                    "Real-time monitoring and insights have given us unprecedented visibility into
                    our AI operations."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                      EP
                    </div>
                    <div>
                      <div className="text-white font-semibold">Emily Park</div>
                      <div className="text-gray-400 text-sm">VP Engineering, CloudScale</div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </section>

          {/* CTA Section - Using premium components */}
          <section
            className="py-20 gradient-primary text-white relative overflow-hidden"
            aria-labelledby="cta-heading"
          >
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
            </div>

            <div className="relative container mx-auto px-4 text-center">
              <div className="max-w-4xl mx-auto">
                <h2 id="cta-heading" className="text-4xl lg:text-5xl font-bold mb-6 fade-in">
                  Ready to Conduct Your AI Symphony?
                </h2>
                <p className="text-xl text-blue-100 mb-10 fade-in animation-delay-100">
                  Join the maestros who are already orchestrating AI at scale. Transform your
                  operations from chaotic to symphonic—starting today, completely free.
                </p>

                <div
                  className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 fade-in animation-delay-200"
                  role="group"
                  aria-label="Get started actions"
                >
                  <Link to="/auth/register">
                    <PremiumButton
                      size="lg"
                      variant="primary"
                      icon={Music}
                      iconPosition="left"
                      className="bg-white text-primary-600 hover:bg-blue-50 px-10 py-5 text-xl font-bold shadow-2xl hover:shadow-3xl group"
                    >
                      Begin Your AI Symphony
                      <ArrowRight
                        className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform duration-300"
                        aria-hidden="true"
                      />
                    </PremiumButton>
                  </Link>
                  <Link to="/auth/login">
                    <PremiumButton
                      size="lg"
                      variant="outline"
                      className="px-10 py-5 text-xl border-white/30"
                    >
                      Access Dashboard
                    </PremiumButton>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center fade-in animation-delay-300">
                  <GlassCard className="backdrop-blur-xl bg-white/10 border-white/20">
                    <div className="flex flex-col items-center">
                      <Star className="h-10 w-10 mb-3 text-yellow-400" />
                      <div className="text-lg font-bold text-white mb-1">Free to Start</div>
                      <div className="text-blue-200 text-sm">No credit card, no commitment</div>
                    </div>
                  </GlassCard>
                  <GlassCard className="backdrop-blur-xl bg-white/10 border-white/20">
                    <div className="flex flex-col items-center">
                      <Shield className="h-10 w-10 mb-3 text-green-400" />
                      <div className="text-lg font-bold text-white mb-1">Enterprise Ready</div>
                      <div className="text-blue-200 text-sm">
                        Battle-tested security & compliance
                      </div>
                    </div>
                  </GlassCard>
                  <GlassCard className="backdrop-blur-xl bg-white/10 border-white/20">
                    <div className="flex flex-col items-center">
                      <Users className="h-10 w-10 mb-3 text-purple-400" />
                      <div className="text-lg font-bold text-white mb-1">Expert Support</div>
                      <div className="text-blue-200 text-sm">24/7 assistance from AI maestros</div>
                    </div>
                  </GlassCard>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </StandardLayout>
  );
};

// Export the component
export default Landing;
