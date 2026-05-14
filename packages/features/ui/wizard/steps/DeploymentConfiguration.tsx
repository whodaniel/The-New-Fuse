/**
 * Deployment Configuration Step
 *
 * Configure deployment settings for CloudRuntime
 */

import { Clock, Database, Globe, Server, Settings, Shield } from 'lucide-react';
import React, { useState } from 'react';
import { WizardContext } from '../WizardSystem.js';

export interface DeploymentConfigurationProps {
  context: WizardContext;
  onDataChange: (data: Record<string, unknown>) => void;
  validationErrors?: string[];
}

const ENVIRONMENTS = [
  { id: 'production', label: 'Production', description: 'Live environment for end users' },
  { id: 'staging', label: 'Staging', description: 'Pre-production testing environment' },
  { id: 'development', label: 'Development', description: 'Development and testing' },
];

const INSTANCE_TYPES = [
  { id: 'hobby', label: 'Hobby', cpu: '0.5 vCPU', memory: '512 MB', price: '$5/month' },
  { id: 'basic', label: 'Basic', cpu: '1 vCPU', memory: '1 GB', price: '$10/month' },
  { id: 'standard', label: 'Standard', cpu: '2 vCPU', memory: '2 GB', price: '$25/month' },
  { id: 'performance', label: 'Performance', cpu: '4 vCPU', memory: '4 GB', price: '$50/month' },
];

export const DeploymentConfiguration: React.FC<DeploymentConfigurationProps> = ({
  context,
  onDataChange,
  validationErrors = [],
}) => {
  const [environment, setEnvironment] = useState(
    (context.data.deploymentEnvironment as string) || 'staging'
  );
  const [instanceType, setInstanceType] = useState(
    (context.data.instanceType as string) || 'basic'
  );
  const [enableDatabase, setEnableDatabase] = useState(
    (context.data.enableDatabase as boolean) ?? true
  );
  const [enableSSL, setEnableSSL] = useState((context.data.enableSSL as boolean) ?? true);
  const [customDomain, setCustomDomain] = useState((context.data.customDomain as string) || '');
  const [autoScaling, setAutoScaling] = useState((context.data.autoScaling as boolean) ?? false);

  const handleChange = (key: string, value: unknown) => {
    onDataChange({ [key]: value });
  };

  return (
    <div className="wizard-step-deployment-config">
      <div className="step-header">
        <Settings className="w-8 h-8 text-primary" />
        <h2 className="step-title">Configure Deployment</h2>
        <p className="step-description">
          Set up your deployment configuration for{' '}
          {String(context.data.cloud_runtimeProjectName || 'your project')}
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

      <div className="config-sections">
        <div className="config-section">
          <h3>
            <Server className="w-5 h-5" /> Environment
          </h3>
          <div className="environment-options">
            {ENVIRONMENTS.map((env) => (
              <div
                key={env.id}
                className={`environment-card ${environment === env.id ? 'selected' : ''}`}
                onClick={() => {
                  setEnvironment(env.id);
                  handleChange('deploymentEnvironment', env.id);
                }}
              >
                <h4>{env.label}</h4>
                <p>{env.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="config-section">
          <h3>
            <Clock className="w-5 h-5" /> Instance Type
          </h3>
          <div className="instance-grid">
            {INSTANCE_TYPES.map((type) => (
              <div
                key={type.id}
                className={`instance-card ${instanceType === type.id ? 'selected' : ''}`}
                onClick={() => {
                  setInstanceType(type.id);
                  handleChange('instanceType', type.id);
                }}
              >
                <h4>{type.label}</h4>
                <div className="instance-specs">
                  <span>{type.cpu}</span>
                  <span>{type.memory}</span>
                </div>
                <div className="instance-price">{type.price}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="config-section">
          <h3>
            <Database className="w-5 h-5" /> Database
          </h3>
          <label className="toggle-option">
            <input
              type="checkbox"
              checked={enableDatabase}
              onChange={(e) => {
                setEnableDatabase(e.target.checked);
                handleChange('enableDatabase', e.target.checked);
              }}
            />
            <span className="toggle-label">Enable PostgreSQL Database</span>
            <span className="toggle-description">
              Includes pgvector extension for vector embeddings
            </span>
          </label>
        </div>

        <div className="config-section">
          <h3>
            <Shield className="w-5 h-5" /> Security
          </h3>
          <label className="toggle-option">
            <input
              type="checkbox"
              checked={enableSSL}
              onChange={(e) => {
                setEnableSSL(e.target.checked);
                handleChange('enableSSL', e.target.checked);
              }}
            />
            <span className="toggle-label">Enable SSL/TLS</span>
            <span className="toggle-description">Secure all traffic with HTTPS</span>
          </label>
        </div>

        <div className="config-section">
          <h3>
            <Globe className="w-5 h-5" /> Custom Domain (Optional)
          </h3>
          <input
            type="text"
            className="form-input"
            placeholder="api.yourdomain.com"
            value={customDomain}
            onChange={(e) => {
              setCustomDomain(e.target.value);
              handleChange('customDomain', e.target.value);
            }}
          />
          <p className="form-hint">You can configure this later in CloudRuntime dashboard</p>
        </div>

        <div className="config-section">
          <h3>Advanced Options</h3>
          <label className="toggle-option">
            <input
              type="checkbox"
              checked={autoScaling}
              onChange={(e) => {
                setAutoScaling(e.target.checked);
                handleChange('autoScaling', e.target.checked);
              }}
            />
            <span className="toggle-label">Enable Auto-scaling</span>
            <span className="toggle-description">
              Automatically scale based on traffic (Premium feature)
            </span>
          </label>
        </div>
      </div>

      <div className="cost-summary">
        <h4>Estimated Monthly Cost</h4>
        <div className="cost-breakdown">
          <div className="cost-item">
            <span>Instance ({INSTANCE_TYPES.find((t) => t.id === instanceType)?.label})</span>
            <span>{INSTANCE_TYPES.find((t) => t.id === instanceType)?.price}</span>
          </div>
          {enableDatabase && (
            <div className="cost-item">
              <span>PostgreSQL Database</span>
              <span>$5/month</span>
            </div>
          )}
          <div className="cost-total">
            <span>Total</span>
            <span>
              $
              {parseInt(
                INSTANCE_TYPES.find((t) => t.id === instanceType)?.price.replace(/[^0-9]/g, '') ||
                  '0'
              ) + (enableDatabase ? 5 : 0)}
              /month
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
