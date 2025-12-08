/**
 * The New Fuse - Modern Landing Page
 * Fully redesigned to use the comprehensive design system
 * Implements StandardLayout, design tokens, and consistent components
 */

import { StandardLayout } from '@/components/layout/StandardLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useTheme } from '@/contexts/ThemeContext';
import { usePagePerformance } from '@/hooks/usePagePerformance';
import { Badge, Button, Card, CardContent } from '@the-new-fuse/ui-consolidated';
import {
  ArrowRight,
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
  Rocket,
  Settings,
  Shield,
  Sparkles,
  Star,
  Target,
  Terminal,
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
  const { theme } = useTheme();

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
            className={`relative py-20 lg:py-32 gradient-primary text-white overflow-hidden ${theme === 'dark' ? 'dark-gradient' : ''}`}
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
                  <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
                  Next-Generation AI Platform
                </Badge>

                <h1
                  id="hero-heading"
                  className="text-5xl lg:text-7xl font-bold mb-6 leading-tight fade-in"
                >
                  The Future of
                  <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    AI Collaboration
                  </span>
                </h1>

                <p className="text-xl lg:text-2xl mb-10 text-blue-100 max-w-4xl mx-auto leading-relaxed fade-in animation-delay-100">
                  Orchestrate intelligent workflows, enable seamless agent communication, and unlock
                  the full potential of AI automation with The New Fuse.
                </p>

                <div
                  className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 fade-in animation-delay-200"
                  role="group"
                  aria-label="Call to action buttons"
                >
                  <Button
                    asChild
                    size="lg"
                    variant="primary"
                    className="px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group focus:ring-4 focus:ring-white/50"
                    aria-label="Start your journey with The New Fuse"
                  >
                    <Link to="/auth/register">
                      <Rocket
                        className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300"
                        aria-hidden="true"
                      />
                      Start Your Journey
                      <ArrowRight
                        className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300"
                        aria-hidden="true"
                      />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg focus:ring-4 focus:ring-white/50"
                    onClick={() => {
                      const demoSection = document.getElementById('demo-section');
                      demoSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    aria-label="Watch demo video"
                  >
                    Watch Demo
                  </Button>
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
                      aria-label="99.9 percent uptime"
                    >
                      99.9%
                    </div>
                    <div className="text-blue-200 text-sm font-medium">Uptime</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Core Features Section - Using design system grid and components */}
          <section className="py-20 bg-background" aria-labelledby="features-heading">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <Badge className="mb-4" aria-label="Core platform features">
                  Core Platform
                </Badge>
                <h2
                  id="features-heading"
                  className="text-4xl lg:text-5xl font-bold text-foreground mb-6 fade-in"
                >
                  Everything You Need for AI Orchestration
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto fade-in animation-delay-100">
                  From agent management to workflow automation, we provide a comprehensive suite of
                  tools for modern AI development.
                </p>
              </div>

              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 fade-in animation-delay-200"
                role="list"
                aria-label="Core features"
              >
                <FeatureCard
                  icon={Bot}
                  title="AI Agent Management"
                  description="Register, discover, and orchestrate AI agents with advanced capability advertising and dynamic skill matching."
                  color="primary"
                />
                <FeatureCard
                  icon={Workflow}
                  title="Workflow Automation"
                  description="Build sophisticated automation pipelines with drag-and-drop workflow designer and real-time monitoring."
                  color="success"
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
                  color="danger"
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
                    name="Modern TypeScript Stack"
                    description="Full-stack TypeScript with React, Node.js, and NestJS framework"
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
                    name="Developer Experience"
                    description="Rich CLI tools, VS Code extension, and comprehensive documentation"
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

          {/* CTA Section - Using design system buttons and components */}
          <section className="py-20 gradient-primary text-white" aria-labelledby="cta-heading">
            <div className="container mx-auto px-4 text-center">
              <div className="max-w-4xl mx-auto">
                <h2 id="cta-heading" className="text-4xl lg:text-5xl font-bold mb-6 fade-in">
                  Ready to Transform Your AI Operations?
                </h2>
                <p className="text-xl text-blue-100 mb-10 fade-in animation-delay-100">
                  Join leading organizations that trust The New Fuse for their AI automation needs.
                  Start your journey today with our comprehensive platform.
                </p>

                <div
                  className="flex flex-col sm:flex-row gap-4 justify-center items-center fade-in animation-delay-200"
                  role="group"
                  aria-label="Get started actions"
                >
                  <Button
                    asChild
                    size="lg"
                    variant="primary"
                    className="bg-white text-primary-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group focus:ring-4 focus:ring-white/50"
                    aria-label="Get started free with The New Fuse"
                  >
                    <Link to="/auth/register">
                      Get Started Free
                      <ArrowRight
                        className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300"
                        aria-hidden="true"
                      />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg focus:ring-4 focus:ring-white/50"
                    aria-label="Access your dashboard"
                  >
                    <Link to="/auth/login">Access Dashboard</Link>
                  </Button>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center fade-in animation-delay-300">
                  <div>
                    <Star className="h-8 w-8 mx-auto mb-3 text-yellow-400" />
                    <div className="text-lg font-semibold">Free to Start</div>
                    <div className="text-blue-200 text-sm">No credit card required</div>
                  </div>
                  <div>
                    <Shield className="h-8 w-8 mx-auto mb-3 text-green-400" />
                    <div className="text-lg font-semibold">Enterprise Ready</div>
                    <div className="text-blue-200 text-sm">SOC 2 compliant & secure</div>
                  </div>
                  <div>
                    <Users className="h-8 w-8 mx-auto mb-3 text-purple-400" />
                    <div className="text-lg font-semibold">24/7 Support</div>
                    <div className="text-blue-200 text-sm">Expert assistance when you need it</div>
                  </div>
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
