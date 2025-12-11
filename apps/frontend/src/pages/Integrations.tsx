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
import { LandingFooter } from '../../components/layout/LandingFooter';
import { LandingHeader } from '../../components/layout/LandingHeader';
import { SEOHead } from '../../components/seo/SEOHead';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

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
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title="The New Fuse - Integrations | AI Collaboration Platform"
        description="Explore all integrations available with The New Fuse AI collaboration platform."
        keywords={['AI platform integrations', 'workflow automation integrations']}
      />
      <LandingHeader />

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

      <LandingFooter />
    </div>
  );
};

export default Integrations;
