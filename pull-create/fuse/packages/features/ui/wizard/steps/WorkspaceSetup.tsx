/**
 * Workspace Setup - Workspace creation step
 */

import { Briefcase, Folder, Globe, Lock, Rocket, User, Users } from 'lucide-react';
import React, { useState } from 'react';
import { WizardContext } from '../WizardSystem';

export interface WorkspaceSetupProps {
  context: WizardContext;
  onDataChange: (data: Record<string, unknown>) => void;
  validationErrors?: string[];
}

const WORKSPACE_TYPES = [
  {
    id: 'personal',
    label: 'Personal',
    description: 'For individual projects and experimentation',
    icon: User,
    recommended: true,
  },
  {
    id: 'team',
    label: 'Team',
    description: 'Collaborate with a small team',
    icon: Users,
  },
  {
    id: 'organization',
    label: 'Organization',
    description: 'For larger organizations with multiple teams',
    icon: Briefcase,
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    description: 'Advanced features and dedicated support',
    icon: Rocket,
  },
];

const PRIVACY_OPTIONS = [
  {
    id: 'private',
    label: 'Private',
    description: 'Only you and invited members can access',
    icon: Lock,
  },
  {
    id: 'team',
    label: 'Team',
    description: 'Accessible to your organization',
    icon: Users,
  },
  {
    id: 'public',
    label: 'Public',
    description: 'Anyone can view (for open-source projects)',
    icon: Globe,
  },
];

export const WorkspaceSetup: React.FC<WorkspaceSetupProps> = ({
  context,
  onDataChange,
  validationErrors = [],
}) => {
  const [workspaceName, setWorkspaceName] = useState((context.data.workspaceName as string) || '');
  const [workspaceType, setWorkspaceType] = useState(
    (context.data.workspaceType as string) || 'personal'
  );
  const [privacy, setPrivacy] = useState((context.data.privacy as string) || 'private');
  const [description, setDescription] = useState(
    (context.data.workspaceDescription as string) || ''
  );

  const handleNameChange = (value: string) => {
    setWorkspaceName(value);
    onDataChange({ workspaceName: value });
  };

  const handleTypeChange = (value: string) => {
    setWorkspaceType(value);
    onDataChange({ workspaceType: value });
  };

  const handlePrivacyChange = (value: string) => {
    setPrivacy(value);
    onDataChange({ privacy: value });
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    onDataChange({ workspaceDescription: value });
  };

  return (
    <div className="wizard-step-workspace-setup">
      <div className="workspace-header">
        <h2 className="step-title">Create Your Workspace</h2>
        <p className="step-description">
          Workspaces help you organize agents, projects, and team members
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

      <div className="workspace-form">
        <div className="form-group">
          <label htmlFor="workspace-name" className="form-label">
            <Folder className="w-4 h-4" />
            Workspace Name *
          </label>
          <input
            id="workspace-name"
            type="text"
            className="form-input"
            placeholder="My Workspace"
            value={workspaceName}
            onChange={(e) => handleNameChange(e.target.value)}
            required
          />
          <p className="form-hint">Choose a name that describes your project or team</p>
        </div>

        <div className="form-group">
          <label className="form-label">Workspace Type *</label>
          <div className="type-grid">
            {WORKSPACE_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = workspaceType === type.id;

              return (
                <div
                  key={type.id}
                  className={`type-card ${isSelected ? 'selected' : ''} ${
                    type.recommended ? 'recommended' : ''
                  }`}
                  onClick={() => handleTypeChange(type.id)}
                >
                  {type.recommended && <div className="recommended-badge">Recommended</div>}
                  <div className="type-icon">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="type-label">{type.label}</h3>
                  <p className="type-description">{type.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Privacy Settings</label>
          <div className="privacy-options">
            {PRIVACY_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = privacy === option.id;

              return (
                <div
                  key={option.id}
                  className={`privacy-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handlePrivacyChange(option.id)}
                >
                  <div className="privacy-icon">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="privacy-content">
                    <h3 className="privacy-label">{option.label}</h3>
                    <p className="privacy-description">{option.description}</p>
                  </div>
                  <input
                    type="radio"
                    name="privacy"
                    checked={isSelected}
                    onChange={() => handlePrivacyChange(option.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Description (Optional)
          </label>
          <textarea
            id="description"
            className="form-textarea"
            placeholder="Describe what this workspace is for..."
            rows={3}
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
          />
        </div>
      </div>

      <div className="workspace-footer">
        <div className="info-box">
          <p className="info-title">What's Next?</p>
          <ul className="info-list">
            <li>Create your first AI agent</li>
            <li>Invite team members to collaborate</li>
            <li>Set up integrations and tools</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
