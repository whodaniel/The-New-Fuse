/**
 * Welcome Screen - First step in Get Started wizard
 */

import { Bot, Globe, Shield, Sparkles, Users, Zap } from 'lucide-react';
import React from 'react';
import { WizardContext } from '../WizardSystem.js';

export interface WelcomeScreenProps {
  context: WizardContext;
  onDataChange: (data: Record<string, unknown>) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ context }) => {
  const features = [
    {
      icon: Bot,
      title: 'AI Agent Creation',
      description: 'Build powerful AI agents with custom capabilities and behaviors',
      color: 'text-blue-500',
    },
    {
      icon: Sparkles,
      title: 'Multi-Agent Orchestration',
      description: 'Coordinate multiple agents to work together on complex tasks',
      color: 'text-purple-500',
    },
    {
      icon: Zap,
      title: 'Real-time Collaboration',
      description: 'Agents and humans work seamlessly together in shared workspaces',
      color: 'text-yellow-500',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Role-based access control, audit logging, and multi-tenant isolation',
      color: 'text-green-500',
    },
    {
      icon: Globe,
      title: 'Cloud Deployment',
      description: 'Deploy to CloudRuntime with containerized execution environments',
      color: 'text-indigo-500',
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Manage teams, agencies, and agent operators with fine-grained permissions',
      color: 'text-pink-500',
    },
  ];

  return (
    <div className="wizard-step-welcome">
      <div className="welcome-header">
        <div className="welcome-logo">
          <Sparkles className="w-16 h-16 text-purple-500" />
        </div>
        <h1 className="welcome-title">Welcome to The New Fuse</h1>
        <p className="welcome-subtitle">
          Your gateway to building, deploying, and managing AI agent ecosystems
        </p>
      </div>

      <div className="welcome-features">
        <h2 className="features-title">What You Can Accomplish</h2>
        <div className="features-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="feature-card">
                <div className={`feature-icon ${feature.color}`}>
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="welcome-getting-started">
        <h2 className="getting-started-title">Getting Started</h2>
        <div className="getting-started-steps">
          <div className="step-item">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Set Up Your Profile</h3>
              <p>Tell us about your goals and preferences</p>
            </div>
          </div>
          <div className="step-item">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Create Your Workspace</h3>
              <p>Organize your agents and projects</p>
            </div>
          </div>
          <div className="step-item">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Build Your First Agent</h3>
              <p>Start with a simple agent to learn the basics</p>
            </div>
          </div>
        </div>
      </div>

      <div className="welcome-footer">
        <p className="footer-text">
          This wizard will guide you through each step. You can return to it anytime from the Help
          menu.
        </p>
      </div>
    </div>
  );
};
