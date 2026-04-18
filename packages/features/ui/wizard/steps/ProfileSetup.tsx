/**
 * Profile Setup - User profile configuration step
 */

import { Building, Cloud, Code, Database, Mail, Shield, Target, User } from 'lucide-react';
import React, { useState } from 'react';
import { WizardContext } from '../WizardSystem.js';

export interface ProfileSetupProps {
  context: WizardContext;
  onDataChange: (data: Record<string, unknown>) => void;
  validationErrors?: string[];
}

const GOAL_OPTIONS = [
  {
    id: 'automation',
    label: 'Process Automation',
    description: 'Automate repetitive tasks and workflows',
    icon: Code,
  },
  {
    id: 'customer-support',
    label: 'Customer Support',
    description: 'Build AI-powered support agents',
    icon: User,
  },
  {
    id: 'data-analysis',
    label: 'Data Analysis',
    description: 'Analyze and extract insights from data',
    icon: Database,
  },
  {
    id: 'deployment',
    label: 'Cloud Deployment',
    description: 'Deploy and manage cloud services',
    icon: Cloud,
  },
  {
    id: 'security',
    label: 'Security & Compliance',
    description: 'Implement security and access controls',
    icon: Shield,
  },
  {
    id: 'integration',
    label: 'System Integration',
    description: 'Connect and integrate different systems',
    icon: Building,
  },
];

export const ProfileSetup: React.FC<ProfileSetupProps> = ({
  context,
  onDataChange,
  validationErrors = [],
}) => {
  const [name, setName] = useState((context.data.name as string) || '');
  const [email, setEmail] = useState((context.data.email as string) || '');
  const [organization, setOrganization] = useState((context.data.organization as string) || '');
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    (context.data.goals as string[]) || []
  );

  const handleNameChange = (value: string) => {
    setName(value);
    onDataChange({ name: value });
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    onDataChange({ email: value });
  };

  const handleOrganizationChange = (value: string) => {
    setOrganization(value);
    onDataChange({ organization: value });
  };

  const handleGoalToggle = (goalId: string) => {
    const newGoals = selectedGoals.includes(goalId)
      ? selectedGoals.filter((g) => g !== goalId)
      : [...selectedGoals, goalId];

    setSelectedGoals(newGoals);
    onDataChange({ goals: newGoals });
  };

  return (
    <div className="wizard-step-profile-setup">
      <div className="profile-header">
        <h2 className="step-title">Set Up Your Profile</h2>
        <p className="step-description">
          Tell us about yourself so we can personalize your experience
        </p>
      </div>

      {validationErrors.length > 0 && (
        <div className="validation-errors">
          {validationErrors.map((error, index) => (
            <div key={index} className="error-message">
              {error}
            </div>
          ))}
        </div>
      )}

      <div className="profile-form">
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            <User className="w-4 h-4" />
            Full Name *
          </label>
          <input
            id="name"
            type="text"
            className="form-input"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            <Mail className="w-4 h-4" />
            Email Address *
          </label>
          <input
            id="email"
            type="email"
            className="form-input"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="organization" className="form-label">
            <Building className="w-4 h-4" />
            Organization (Optional)
          </label>
          <input
            id="organization"
            type="text"
            className="form-input"
            placeholder="Your company or organization"
            value={organization}
            onChange={(e) => handleOrganizationChange(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <Target className="w-4 h-4" />
            Your Goals *
          </label>
          <p className="form-hint">Select all that apply</p>
          <div className="goals-grid">
            {GOAL_OPTIONS.map((goal) => {
              const Icon = goal.icon;
              const isSelected = selectedGoals.includes(goal.id);

              return (
                <div
                  key={goal.id}
                  className={`goal-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleGoalToggle(goal.id)}
                >
                  <div className="goal-icon">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="goal-content">
                    <h3 className="goal-label">{goal.label}</h3>
                    <p className="goal-description">{goal.description}</p>
                  </div>
                  <div className="goal-checkbox">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleGoalToggle(goal.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="profile-footer">
        <p className="footer-note">
          Your information is kept private and secure. You can update it anytime in Settings.
        </p>
      </div>
    </div>
  );
};
