import React from 'react';
import {
  Brain,
  Network,
  Workflow,
  Users,
  Chrome,
  Zap,
  Shield,
  Code,
  GitBranch,
  MessageSquare,
  Cpu,
  Globe,
} from 'lucide-react';
import { FeaturesSection } from './FeaturesSection';
import { FeatureCard } from './FeatureCard';

export const FeatureShowcase: React.FC = () => {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
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
          imageSrc="https://placehold.co/600x400/667eea/ffffff/png?text=AI+Agents+Working+Together"
          imageAlt="AI agents collaborating"
          accent="purple"
          delay={0}
        />

        {/* MCP Protocol Integration */}
        <FeatureCard
          icon={Network}
          title="MCP Protocol Integration"
          description="Built on the Model Context Protocol for seamless integration with any AI model. Connect, extend, and customize your AI infrastructure with industry-standard protocols."
          imageSrc="https://placehold.co/600x400/3b82f6/ffffff/png?text=MCP+Protocol+Network"
          imageAlt="MCP Protocol Network"
          accent="blue"
          delay={0.1}
        />

        {/* Real-Time Workflow Engine */}
        <FeatureCard
          icon={Workflow}
          title="Real-Time Workflow Engine"
          description="Design, execute, and monitor complex workflows in real-time. Visual workflow builder with drag-and-drop interface and live execution monitoring."
          imageSrc="https://placehold.co/600x400/10b981/ffffff/png?text=Workflow+Engine+Dashboard"
          imageAlt="Workflow Engine"
          accent="green"
          delay={0.2}
        />

        {/* Live Collaboration */}
        <FeatureCard
          icon={Users}
          title="Live Collaboration Features"
          description="Real-time collaboration with your team and AI agents. See updates instantly, share contexts, and work together on complex projects with synchronized state."
          imageSrc="https://placehold.co/600x400/f59e0b/ffffff/png?text=Team+Collaboration"
          imageAlt="Live Collaboration"
          accent="orange"
          delay={0.3}
        />

        {/* Chrome Extension */}
        <FeatureCard
          icon={Chrome}
          title="Chrome Extension Capabilities"
          description="Bring AI assistance directly into your browser. Capture context, automate web tasks, and integrate seamlessly with your daily workflow."
          imageSrc="https://placehold.co/600x400/ec4899/ffffff/png?text=Browser+Extension"
          imageAlt="Chrome Extension"
          accent="pink"
          delay={0.4}
        />

        {/* Performance & Speed */}
        <FeatureCard
          icon={Zap}
          title="Lightning Fast Performance"
          description="Optimized for speed with edge computing, intelligent caching, and efficient resource management. Get instant responses and real-time updates."
          imageSrc="https://placehold.co/600x400/8b5cf6/ffffff/png?text=Performance+Metrics"
          imageAlt="Performance Dashboard"
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
          imageSrc="https://placehold.co/600x400/6366f1/ffffff/png?text=API+Documentation"
          imageAlt="API Architecture"
          accent="blue"
          delay={0}
        />

        <FeatureCard
          icon={Code}
          title="Extensible Plugin System"
          description="Create custom plugins and extensions to add new capabilities. Share your plugins with the community or keep them private for your team."
          imageSrc="https://placehold.co/600x400/14b8a6/ffffff/png?text=Plugin+Marketplace"
          imageAlt="Plugin System"
          accent="green"
          delay={0.1}
        />
      </FeaturesSection>
    </div>
  );
};

export default FeatureShowcase;
