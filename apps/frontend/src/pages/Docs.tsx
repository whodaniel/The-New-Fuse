import { GlassCard, PremiumButton } from '@/components/ui/premium';
import { BookOpen, Code, FileText, Search } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const DocsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Documentation
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to build, deploy, and scale with The New Fuse.
          </p>
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search documentation..."
              className="w-full bg-slate-800 border border-slate-700 rounded-full py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="p-6 hover:border-blue-500/50 transition-colors cursor-pointer group">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Getting Started</h3>
            <p className="text-gray-400 mb-4">
              Learn the basics of The New Fuse, from account creation to your first agent.
            </p>
            <Link to="/docs/getting-started" className="text-blue-400 font-medium hover:underline">
              Read Guide &rarr;
            </Link>
          </GlassCard>

          <GlassCard className="p-6 hover:border-purple-500/50 transition-colors cursor-pointer group">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Code className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">API Reference</h3>
            <p className="text-gray-400 mb-4">
              Detailed documentation for our REST API, including endpoints, authentication, and
              examples.
            </p>
            <Link to="/docs/api" className="text-purple-400 font-medium hover:underline">
              View API Docs &rarr;
            </Link>
          </GlassCard>

          <GlassCard className="p-6 hover:border-green-500/50 transition-colors cursor-pointer group">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Tutorials & Guides</h3>
            <p className="text-gray-400 mb-4">
              Step-by-step tutorials for common use cases, from simple workflows to complex agent
              swarms.
            </p>
            <Link to="/docs/tutorials" className="text-green-400 font-medium hover:underline">
              Browse Tutorials &rarr;
            </Link>
          </GlassCard>
        </div>

        {/* Documentation Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-bold text-lg text-white">Categories</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link to="#" className="hover:text-blue-400 transition-colors">
                  Platform Overview
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-blue-400 transition-colors">
                  Agent Management
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-blue-400 transition-colors">
                  Workflow Builder
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-blue-400 transition-colors">
                  Integrations
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-blue-400 transition-colors">
                  Security & Compliance
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-blue-400 transition-colors">
                  Billing & Plans
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">Popular Topics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'How to create a custom agent',
                  'Connecting to external APIs',
                  'Understanding workflow triggers',
                  'Managing team permissions',
                  'Optimizing agent performance',
                  'Deploying to production',
                ].map((topic, i) => (
                  <div
                    key={i}
                    className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-blue-500/30 transition-colors cursor-pointer"
                  >
                    <Link to="#" className="flex items-center justify-between group">
                      <span className="text-gray-300 group-hover:text-white transition-colors">
                        {topic}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl p-8 border border-white/10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Join the Community</h2>
                  <p className="text-gray-400">
                    Get help from other developers and share your projects.
                  </p>
                </div>
                <Link to="/community">
                  <PremiumButton variant="gradient">Visit Community Hub</PremiumButton>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocsPage;
