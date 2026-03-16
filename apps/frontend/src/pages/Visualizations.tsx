/**
 * Visualizations Coming Soon Page
 *
 * Created by TNF Orchestrator based on Gemini assessment feedback
 */

import { ArrowLeft, BrainCircuit, GitBranch, Network, Workflow } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

const Visualizations: React.FC = () => {
  const features = [
    {
      icon: Network,
      title: 'Agent Network Graph',
      description: 'Visualize connections between agents in your swarm',
    },
    {
      icon: Workflow,
      title: 'Workflow Diagrams',
      description: 'See the execution flow of complex multi-agent tasks',
    },
    {
      icon: GitBranch,
      title: 'Decision Trees',
      description: 'Explore branching logic and agent reasoning paths',
    },
    {
      icon: BrainCircuit,
      title: 'Knowledge Graphs',
      description: 'Interactive visualization of shared memory and context',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            to="/"
            className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Visualizations
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Coming Soon! We're building powerful visualization tools to help you understand and
            monitor your multi-agent workflows.
          </p>
        </div>

        {/* Features Preview */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all"
            >
              <feature.icon className="w-10 h-10 text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Notify Me CTA */}
        <div className="text-center">
          <p className="text-gray-400 mb-4">Want early access or have feature suggestions?</p>
          <Link
            to="/contact"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Contact Us
          </Link>
        </div>

        {/* Preview Image Placeholder */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-gray-800/30 border-2 border-dashed border-gray-700 rounded-xl p-12 text-center">
            <Network className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">Interactive visualization preview will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Visualizations;
