import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  BarChart3,
  Chrome,
  Code,
  Database,
  Globe,
  Home,
  Layers,
  MessageSquare,
  Monitor,
  Play,
  Settings,
  Sparkles,
  Terminal,
  Users,
  Zap,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

interface PageLinkProps {
  to: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'live' | 'demo' | 'new';
  external?: boolean;
}

const PageLink: React.FC<PageLinkProps> = ({
  to,
  title,
  description,
  icon: Icon,
  status,
  external = false,
}) => {
  const statusColors = {
    live: 'bg-green-100 text-green-800',
    demo: 'bg-yellow-100 text-yellow-800',
    new: 'bg-blue-100 text-blue-800',
  };

  const content = (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-white cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <Badge className={`${statusColors[status]} text-xs font-medium`}>{status}</Badge>
        </div>
        <h3 className="text-lg font-semibold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">{description}</p>
        <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700 transition-colors">
          <span>Open Page</span>
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  );

  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }

  return (
    <Link to={to} className="block">
      {content}
    </Link>
  );
};

const FrontendShowcase: React.FC = () => {
  const appPages: PageLinkProps[] = [
    {
      to: '/home',
      title: 'Home Dashboard',
      description: 'Main application home with navigation and overview',
      icon: Home,
      status: 'live',
    },
    {
      to: '/dashboard',
      title: 'Analytics Dashboard',
      description: 'User dashboard with analytics and metrics',
      icon: BarChart3,
      status: 'live',
    },
    {
      to: '/chat',
      title: 'Chat Interface',
      description: 'AI chat interface with multi-agent support',
      icon: MessageSquare,
      status: 'live',
    },
    {
      to: '/multi-agent-chat',
      title: 'Multi-Agent Chat',
      description: 'Advanced multi-agent conversation interface',
      icon: Users,
      status: 'live',
    },
    {
      to: '/ai-portal',
      title: 'AI Agent Portal',
      description: 'Browse and interact with AI agents',
      icon: Zap,
      status: 'live',
    },
    {
      to: '/admin/dashboard',
      title: 'Admin Dashboard',
      description: 'Administrative controls and system management',
      icon: Settings,
      status: 'live',
    },
  ];

  const demoPages: PageLinkProps[] = [
    {
      to: '/timeline-demo',
      title: 'Timeline Demo',
      description: 'Interactive timeline component demonstration',
      icon: Layers,
      status: 'demo',
    },
    {
      to: '/graph-demo',
      title: 'Graph Demo',
      description: 'Interactive graph visualization demo',
      icon: Database,
      status: 'demo',
    },
    {
      to: '/ui',
      title: 'UI Components',
      description: 'Component library and design system showcase',
      icon: Monitor,
      status: 'demo',
    },
    {
      to: '/components',
      title: 'Component Showcase',
      description: 'Detailed component examples and usage',
      icon: Code,
      status: 'demo',
    },
  ];

  const devPages: PageLinkProps[] = [
    {
      to: '/test',
      title: 'Test Page',
      description: 'Simple test page for routing verification',
      icon: Play,
      status: 'demo',
    },
    {
      to: '/debug',
      title: 'Debug Info',
      description: 'Development debug information and tools',
      icon: Terminal,
      status: 'demo',
    },
    {
      to: '/debug-routing',
      title: 'Route Debug',
      description: 'Routing debug and navigation testing',
      icon: Globe,
      status: 'demo',
    },
  ];

  const staticPages: PageLinkProps[] = [
    {
      to: 'http://localhost:3001/static/',
      title: 'HTML Showcase Index',
      description: 'Static HTML demonstration pages index',
      icon: Code,
      status: 'demo',
      external: true,
    },
    {
      to: 'http://localhost:3001/static/pages/dashboard.html',
      title: 'Static Dashboard',
      description: 'Static HTML dashboard layout',
      icon: Monitor,
      status: 'demo',
      external: true,
    },
    {
      to: 'http://localhost:3001/static/pages/chat.html',
      title: 'Static Chat',
      description: 'Static HTML chat interface',
      icon: MessageSquare,
      status: 'demo',
      external: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-6">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">The New Fuse Frontend Showcase</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore all the frontend pages and components built with React, TypeScript, and Tailwind
            CSS. Powered by PNPM package manager for efficient dependency management.
          </p>
        </div>

        {/* Server Info */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Server Running</span>
            </div>
            <div className="flex items-center space-x-2">
              <Terminal className="h-4 w-4" />
              <span>PNPM Package Manager</span>
            </div>
            <div className="flex items-center space-x-2">
              <Chrome className="h-4 w-4" />
              <span>localhost:3001</span>
            </div>
          </div>
        </div>

        {/* Main Application Pages */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Home className="mr-3 h-6 w-6 text-blue-600" />
            Main Application Pages
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appPages.map((page, index) => (
              <PageLink key={index} {...page} />
            ))}
          </div>
        </section>

        {/* Demo Pages */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Play className="mr-3 h-6 w-6 text-purple-600" />
            Interactive Demos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoPages.map((page, index) => (
              <PageLink key={index} {...page} />
            ))}
          </div>
        </section>

        {/* Development Pages */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Terminal className="mr-3 h-6 w-6 text-green-600" />
            Development Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devPages.map((page, index) => (
              <PageLink key={index} {...page} />
            ))}
          </div>
        </section>

        {/* Static HTML Showcase */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Code className="mr-3 h-6 w-6 text-orange-600" />
            Static HTML Showcase
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staticPages.map((page, index) => (
              <PageLink key={index} {...page} />
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-gray-200">
          <p className="text-gray-600">
            Built with ❤️ using React, TypeScript, Tailwind CSS, and PNPM Package Manager
          </p>
        </footer>
      </div>
    </div>
  );
};

export default FrontendShowcase;
