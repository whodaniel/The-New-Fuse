import {
  Brain,
  Chrome,
  Code,
  Cpu,
  GitBranch,
  Globe,
  MessageSquare,
  Network,
  Shield,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import React from 'react';
import { FeatureCard } from './FeatureCard';
import { FeaturesSection } from './FeaturesSection';

export const FeatureShowcase: React.FC = () => {
  return (
    <div
      id="features"
      className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
    >
      {/* Main Features Section */}
      <FeaturesSection
        id="core-features"
        title="Powerful Features for Modern Teams"
        subtitle="Everything you need to build, collaborate, and deploy AI-powered solutions"
        columns={3}
      >
        {/* AI-Powered Agent Collaboration */}
        <FeatureCard
          icon={Brain}
          title="AI-Powered Agent Collaboration"
          description="Deploy multiple specialized AI agents that work together seamlessly. Each agent brings unique capabilities and expertise to solve complex problems collaboratively."
          imageSrc="/assets/images/landing/ai-agents.png"
          imageAlt="AI agents collaborating"
          accent="purple"
          delay={0}
        />

        {/* MCP Protocol Integration */}
        <FeatureCard
          icon={Network}
          title="MCP Protocol Integration"
          description="Built on the Model Context Protocol for seamless integration with any AI model. Connect, extend, and customize your AI infrastructure with industry-standard protocols."
          imageSrc="/assets/images/landing/mcp-network.png"
          imageAlt="MCP Protocol Network"
          accent="blue"
          delay={0.1}
        />

        {/* Real-Time Workflow Engine */}
        <FeatureCard
          icon={Workflow}
          title="Real-Time Workflow Engine"
          description="Design, execute, and monitor complex workflows in real-time. Visual workflow builder with drag-and-drop interface and live execution monitoring."
          accent="green"
          delay={0.2}
        />

        {/* Live Collaboration */}
        <FeatureCard
          icon={Users}
          title="Live Collaboration Features"
          description="Real-time collaboration with your team and AI agents. See updates instantly, share contexts, and work together on complex projects with synchronized state."
          accent="orange"
          delay={0.3}
        />

        {/* Chrome Extension */}
        <FeatureCard
          icon={Chrome}
          title="Chrome Extension Capabilities"
          description="Bring AI assistance directly into your browser. Capture context, automate web tasks, and integrate seamlessly with your daily workflow."
          accent="pink"
          delay={0.4}
        />

        {/* Performance & Speed */}
        <FeatureCard
          icon={Zap}
          title="Lightning Fast Performance"
          description="Optimized for speed with edge computing, intelligent caching, and efficient resource management. Get instant responses and real-time updates."
          accent="purple"
          delay={0.5}
        />
      </FeaturesSection>

      {/* Additional Capabilities Section */}
      <FeaturesSection
        id="additional-capabilities"
        title="Built for Developers, Designed for Teams"
        subtitle="Advanced features that scale with your needs"
        columns={3}
      >
        {/* Security & Privacy */}
        <FeatureCard
          icon={Shield}
          title="Enterprise-Grade Security"
          description="End-to-end encryption, role-based access control, and compliance with industry standards. Your data is secure and private."
          accent="blue"
          delay={0}
        />

        {/* Developer-Friendly APIs */}
        <FeatureCard
          icon={Code}
          title="Developer-Friendly APIs"
          description="Comprehensive REST and WebSocket APIs with detailed documentation. Build custom integrations and extend functionality with ease."
          accent="green"
          delay={0.1}
        />

        {/* Version Control Integration */}
        <FeatureCard
          icon={GitBranch}
          title="Version Control Integration"
          description="Native Git integration for workflow versioning, agent configurations, and collaborative development. Track changes and roll back with confidence."
          accent="orange"
          delay={0.2}
        />

        {/* Intelligent Context Management */}
        <FeatureCard
          icon={MessageSquare}
          title="Intelligent Context Management"
          description="Advanced context tracking across conversations and workflows. AI agents maintain perfect memory and understanding of your projects."
          accent="pink"
          delay={0.3}
        />

        {/* Distributed Processing */}
        <FeatureCard
          icon={Cpu}
          title="Distributed Processing"
          description="Scale horizontally with distributed agent execution. Handle massive workloads with automatic load balancing and resource optimization."
          accent="purple"
          delay={0.4}
        />

        {/* Global CDN & Edge Network */}
        <FeatureCard
          icon={Globe}
          title="Global Edge Network"
          description="Deploy agents close to your users with our global edge network. Ultra-low latency and high availability worldwide."
          accent="blue"
          delay={0.5}
        />
      </FeaturesSection>

      {/* Integration Highlights - 2 Column Layout */}
      <FeaturesSection
        id="integration-highlights"
        title="Seamless Integrations"
        subtitle="Connect with your favorite tools and services"
        columns={2}
      >
        <FeatureCard
          icon={Network}
          title="API-First Architecture"
          description="RESTful APIs, GraphQL support, and WebSocket connections for real-time updates. Build custom integrations with comprehensive documentation and SDKs."
          accent="blue"
          delay={0}
        />

        <FeatureCard
          icon={Code}
          title="Extensible Plugin System"
          description="Create custom plugins and extensions to add new capabilities. Share your plugins with the community or keep them private for your team."
          accent="green"
          delay={0.1}
        />
      </FeaturesSection>
    </div>
  );
};

export default FeatureShowcase;
