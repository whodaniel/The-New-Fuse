import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  Chrome,
  Code,
  Github,
  Globe,
  Network,
  Puzzle,
  Rocket,
  Terminal,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const IntegrationCard = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) => (
  <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-white">
    <CardContent className="p-6">
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </CardContent>
  </Card>
);

export const Integrations = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white">
      <main className="flex-grow">
        <section className="py-20 lg:py-32 bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-800 text-white text-center">
          <div className="container mx-auto px-4">
            <Badge className="mb-6 bg-slate-800/50 text-white border-white/20">
              <Puzzle className="w-4 h-4 mr-2" />
              Seamless Integrations
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-bold mb-6">
              Connect with Your Favorite Tools
            </h1>
            <p className="text-xl lg:text-2xl mb-10 text-blue-100 max-w-4xl mx-auto">
              The New Fuse integrates seamlessly with your existing workflow.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-white/90 text-slate-900 hover:bg-white px-8 py-4 text-lg font-semibold"
            >
              <Link to="/auth/register">
                <Rocket className="mr-2 h-5 w-5" />
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Our Integration Ecosystem
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Connect with your existing tools and platforms
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <IntegrationCard
                icon={Github}
                title="GitHub Integration"
                description="Seamless code repository management and CI/CD integration"
              />
              <IntegrationCard
                icon={Code}
                title="VS Code Extension"
                description="Native IDE support for enhanced development experience"
              />
              <IntegrationCard
                icon={Chrome}
                title="Chrome Extension"
                description="Browser-based agent interaction and workflow management"
              />
              <IntegrationCard
                icon={Network}
                title="API Integration"
                description="Comprehensive REST and GraphQL APIs for custom integrations"
              />
              <IntegrationCard
                icon={Terminal}
                title="CLI Tools"
                description="Powerful command-line interface for automation and management"
              />
              <IntegrationCard
                icon={Globe}
                title="Webhooks"
                description="Real-time event notifications and webhook support"
              />
            </div>
          </div>
        </section>

        <section className="py-20 bg-slate-900/60 backdrop-blur-md text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Ready to Connect?</h2>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
              Start integrating The New Fuse with your existing tools today.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold"
            >
              <Link to="/auth/register">Get Started Free</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">The New Fuse</span>
          </div>
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

export default Integrations;
