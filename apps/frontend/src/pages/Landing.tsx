import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LandingHeader } from '@/components/layout/LandingHeader';
import { LandingFooter } from '@/components/layout/LandingFooter';
import { SEOHead } from '@/components/seo/SEOHead';
import { usePagePerformance } from '@/hooks/usePagePerformance';
import {
  Bot,
  Workflow,
  MessageSquare,
  Shield,
  Zap,
  Globe,
  Code,
  Settings,
  Users,
  BarChart3,
  Cpu,
  Network,
  Terminal,
  Github,
  Chrome,
  ArrowRight,
  CheckCircle,
  Star,
  Sparkles,
  Target,
  Rocket
} from 'lucide-react';

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

  return <span>{count.toLocaleString()}</span>;
};

const FeatureCard = ({ icon: Icon, title, description, color = "blue" }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color?: string;
}) => (
  <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-white focus-within:ring-4 focus-within:ring-blue-500/20" role="listitem">
    <CardContent className="p-6">
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-${color}-500 to-${color}-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`} aria-hidden="true">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </CardContent>
  </Card>
);

const TechStackItem = ({ icon: Icon, name, description }: {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  description: string;
}) => (
  <div className="flex items-start space-x-3 p-4 rounded-lg bg-white border border-gray-100 hover:border-blue-200 transition-colors duration-300">
    <div className="flex-shrink-0">
      <Icon className="h-6 w-6 text-blue-600" />
    </div>
    <div>
      <h4 className="font-medium text-gray-900">{name}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  </div>
);

export const Landing = () => {
  // Track page performance metrics
  usePagePerformance('Landing Page');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="The New Fuse - AI Collaboration Platform | Workflow Automation & Agent Orchestration"
        description="Orchestrate intelligent workflows, enable seamless agent communication, and unlock the full potential of AI automation with The New Fuse. Support for MCP and A2A protocols."
        keywords={['AI platform', 'workflow automation', 'AI agents', 'agent orchestration', 'MCP protocol', 'A2A protocol', 'enterprise AI', 'AI collaboration', 'intelligent automation']}
        canonical={typeof window !== 'undefined' ? window.location.origin : ''}
      />
      <LandingHeader />

      <main className="flex-grow" role="main">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-800 text-white overflow-hidden" aria-labelledby="hero-heading">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30"></div>
          
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-gradient-to-tr from-indigo-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          </div>
          
          <div className="relative container mx-auto px-4 text-center">
            <div className="max-w-5xl mx-auto">
              <Badge className="mb-6 bg-white/10 text-white border-white/20 hover:bg-white/20" aria-label="Platform badge">
                <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
                Next-Generation AI Platform
              </Badge>

              <h1 id="hero-heading" className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
                The Future of
                <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  AI Collaboration
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl mb-10 text-blue-100 max-w-4xl mx-auto leading-relaxed">
                Orchestrate intelligent workflows, enable seamless agent communication, and unlock the full potential of AI automation with The New Fuse.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12" role="group" aria-label="Call to action buttons">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group focus:ring-4 focus:ring-white/50"
                  aria-label="Start your journey with The New Fuse"
                >
                  <Link to="/auth/register">
                    <Rocket className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
                    Start Your Journey
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
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
              
              {/* Live Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto" role="region" aria-label="Platform statistics">
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-yellow-400" aria-label="150 plus AI agents">
                    <AnimatedCounter end={150} />+
                  </div>
                  <div className="text-blue-200 text-sm font-medium">AI Agents</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-green-400" aria-label="2500 plus workflows">
                    <AnimatedCounter end={2500} />+
                  </div>
                  <div className="text-blue-200 text-sm font-medium">Workflows</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-purple-400" aria-label="50000 plus messages per day">
                    <AnimatedCounter end={50000} />+
                  </div>
                  <div className="text-blue-200 text-sm font-medium">Messages/Day</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-orange-400" aria-label="99.9 percent uptime">99.9%</div>
                  <div className="text-blue-200 text-sm font-medium">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features Section */}
        <section className="py-20 bg-gray-50" aria-labelledby="features-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4" aria-label="Core platform features">Core Platform</Badge>
              <h2 id="features-heading" className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Everything You Need for AI Orchestration
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From agent management to workflow automation, we provide a comprehensive suite of tools for modern AI development.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="list" aria-label="Core features">
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

        {/* Technical Excellence Section */}
        <section className="py-20 bg-white" aria-labelledby="technical-heading">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <Badge className="mb-4" aria-label="Technical excellence">Technical Excellence</Badge>
                <h2 id="technical-heading" className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                  Built for Scale & Performance
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Our platform is architected with modern best practices, ensuring reliability, scalability, and maintainability at enterprise scale.
                </p>
                
                <ul className="grid grid-cols-1 gap-4" role="list" aria-label="Technical highlights">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" aria-hidden="true" />
                    <span className="text-gray-700">Microservices Architecture with TypeScript/Node.js</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" aria-hidden="true" />
                    <span className="text-gray-700">PNPM Workspaces Monorepo for Better Organization</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" aria-hidden="true" />
                    <span className="text-gray-700">Prisma ORM with PostgreSQL for Data Management</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" aria-hidden="true" />
                    <span className="text-gray-700">Docker Containerization & Kubernetes Ready</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" aria-hidden="true" />
                    <span className="text-gray-700">Comprehensive Testing & CI/CD Pipelines</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
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

        {/* Integration Ecosystem */}
        <section className="py-20 bg-gradient-to-br from-gray-900 to-blue-900 text-white" id="demo-section" aria-labelledby="integration-heading">
          <div className="container mx-auto px-4 text-center">
            <Badge className="mb-4 bg-white/10 text-white border-white/20" aria-label="Integration ecosystem">Integration Ecosystem</Badge>
            <h2 id="integration-heading" className="text-4xl lg:text-5xl font-bold mb-6">
              Seamlessly Integrates with Your Workflow
            </h2>
            <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
              Connect with your existing tools and platforms through our extensive integration ecosystem.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <Card className="bg-white/10 border-white/20 text-white">
                <CardContent className="p-8 text-center">
                  <Github className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                  <h3 className="text-xl font-semibold mb-3">GitHub Integration</h3>
                  <p className="text-blue-100">Seamless code repository management and CI/CD integration</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 border-white/20 text-white">
                <CardContent className="p-8 text-center">
                  <Code className="h-12 w-12 mx-auto mb-4 text-green-400" />
                  <h3 className="text-xl font-semibold mb-3">VS Code Extension</h3>
                  <p className="text-blue-100">Native IDE support for enhanced development experience</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 border-white/20 text-white">
                <CardContent className="p-8 text-center">
                  <Chrome className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
                  <h3 className="text-xl font-semibold mb-3">Chrome Extension</h3>
                  <p className="text-blue-100">Browser-based agent interaction and workflow management</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-20 bg-white" aria-labelledby="use-cases-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4" aria-label="Use cases">Use Cases</Badge>
              <h2 id="use-cases-heading" className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Powering Innovation Across Industries
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From software development to business automation, see how organizations leverage The New Fuse.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="border-l-4 border-blue-500 pl-6">
                  <div className="flex items-center mb-3">
                    <Target className="h-6 w-6 text-blue-500 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Software Development</h3>
                  </div>
                  <p className="text-gray-600">
                    Automate code review, testing, and deployment processes with intelligent AI agents that understand your codebase and team workflow.
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-6">
                  <div className="flex items-center mb-3">
                    <Users className="h-6 w-6 text-green-500 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Customer Support</h3>
                  </div>
                  <p className="text-gray-600">
                    Deploy intelligent support agents that can escalate complex issues, access knowledge bases, and provide 24/7 customer assistance.
                  </p>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-6">
                  <div className="flex items-center mb-3">
                    <BarChart3 className="h-6 w-6 text-purple-500 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Data Analytics</h3>
                  </div>
                  <p className="text-gray-600">
                    Create data processing pipelines with AI agents that can analyze, transform, and generate insights from complex datasets.
                  </p>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="border-l-4 border-orange-500 pl-6">
                  <div className="flex items-center mb-3">
                    <Zap className="h-6 w-6 text-orange-500 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Business Automation</h3>
                  </div>
                  <p className="text-gray-600">
                    Streamline business processes with intelligent workflow automation that adapts to changing requirements and business rules.
                  </p>
                </div>
                
                <div className="border-l-4 border-red-500 pl-6">
                  <div className="flex items-center mb-3">
                    <Shield className="h-6 w-6 text-red-500 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Security Operations</h3>
                  </div>
                  <p className="text-gray-600">
                    Deploy security agents that monitor threats, analyze logs, and respond to incidents with coordinated automated responses.
                  </p>
                </div>
                
                <div className="border-l-4 border-indigo-500 pl-6">
                  <div className="flex items-center mb-3">
                    <Globe className="h-6 w-6 text-indigo-500 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">IoT & Edge Computing</h3>
                  </div>
                  <p className="text-gray-600">
                    Orchestrate distributed IoT systems with edge-deployed agents that can make real-time decisions and coordinate with cloud services.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700 text-white" aria-labelledby="cta-heading">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 id="cta-heading" className="text-4xl lg:text-5xl font-bold mb-6">
                Ready to Transform Your AI Operations?
              </h2>
              <p className="text-xl text-blue-100 mb-10">
                Join leading organizations that trust The New Fuse for their AI automation needs. Start your journey today with our comprehensive platform.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center" role="group" aria-label="Get started actions">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group focus:ring-4 focus:ring-white/50"
                  aria-label="Get started free with The New Fuse"
                >
                  <Link to="/auth/register">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg focus:ring-4 focus:ring-white/50"
                  aria-label="Access your dashboard"
                >
                  <Link to="/auth/login">
                    Access Dashboard
                  </Link>
                </Button>
              </div>
              
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
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
      
      <LandingFooter />
    </div>
  );
};

// End of old implementation (kept for backup)
