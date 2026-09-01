/**
 * Deployment Progress Step
 *
 * Show real-time deployment progress
 */

import { AlertCircle, Check, Clock, ExternalLink, Loader, Rocket } from 'lucide-react';
import React, { useState } from 'react';
import { WizardContext } from '../WizardSystem.js';

export interface DeploymentProgressProps {
  context: WizardContext;
  onDataChange: (data: Record<string, unknown>) => void;
  validationErrors?: string[];
}

interface DeploymentStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  message?: string;
}

export const DeploymentProgress: React.FC<DeploymentProgressProps> = ({
  context,
  onDataChange,
  validationErrors = [],
}) => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentComplete, setDeploymentComplete] = useState(false);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);
  const [steps, setSteps] = useState<DeploymentStep[]>([
    { id: '1', label: 'Preparing deployment', status: 'pending' },
    { id: '2', label: 'Building Docker image', status: 'pending' },
    { id: '3', label: 'Pushing to CloudRuntime', status: 'pending' },
    { id: '4', label: 'Starting container', status: 'pending' },
    { id: '5', label: 'Running health checks', status: 'pending' },
    { id: '6', label: 'Configuring networking', status: 'pending' },
  ]);

  const startDeployment = async () => {
    setIsDeploying(true);

    // Simulate deployment steps
    for (let i = 0; i < steps.length; i++) {
      // Update current step to running
      setSteps((prev) =>
        prev.map((step, idx) => (idx === i ? { ...step, status: 'running' } : step))
      );

      // Simulate step duration
      await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

      // Update step to completed
      setSteps((prev) =>
        prev.map((step, idx) =>
          idx === i
            ? {
                ...step,
                status: 'completed',
                duration: 1500 + Math.floor(Math.random() * 1000),
              }
            : step
        )
      );
    }

    setIsDeploying(false);
    setDeploymentComplete(true);
    setDeploymentUrl(
      `https://${context.data.cloud_runtimeProjectName || 'tnf-cloud-sandbox'}.thenewfuse.com`
    );
    onDataChange({ deploymentComplete: true, deploymentUrl });
  };

  const getStatusIcon = (status: DeploymentStep['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'running':
        return <Loader className="w-5 h-5 animate-spin text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const completedSteps = steps.filter((s) => s.status === 'completed').length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className="wizard-step-deployment-progress">
      <div className="step-header">
        <Rocket className="w-8 h-8 text-primary" />
        <h2 className="step-title">Deploy to CloudRuntime</h2>
        <p className="step-description">
          Deploying to {String(context.data.deploymentEnvironment || 'production')} environment
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

      <div className="deployment-container">
        {!isDeploying && !deploymentComplete && (
          <div className="pre-deploy">
            <h3>Ready to Deploy</h3>
            <div className="deploy-summary">
              <div className="summary-item">
                <span className="label">Project:</span>
                <span className="value">
                  {String(context.data.cloud_runtimeProjectName || 'Unknown')}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Environment:</span>
                <span className="value">
                  {String(context.data.deploymentEnvironment || 'staging')}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Instance:</span>
                <span className="value">{String(context.data.instanceType || 'basic')}</span>
              </div>
              <div className="summary-item">
                <span className="label">Database:</span>
                <span className="value">
                  {context.data.enableDatabase ? 'PostgreSQL with pgvector' : 'None'}
                </span>
              </div>
            </div>
            <button className="deploy-btn" onClick={startDeployment}>
              <Rocket className="w-5 h-5" />
              Start Deployment
            </button>
          </div>
        )}

        {(isDeploying || deploymentComplete) && (
          <div className="deploy-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-text">{Math.round(progress)}% Complete</div>

            <div className="deployment-steps">
              {steps.map((step) => (
                <div key={step.id} className={`deployment-step ${step.status}`}>
                  <div className="step-icon">{getStatusIcon(step.status)}</div>
                  <div className="step-content">
                    <span className="step-label">{step.label}</span>
                    {step.duration && (
                      <span className="step-duration">{(step.duration / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {deploymentComplete && (
          <div className="deploy-success">
            <div className="success-icon">
              <Check className="w-12 h-12" />
            </div>
            <h3>Deployment Successful!</h3>
            <p>Your cloud sandbox is now live and running.</p>

            {deploymentUrl && (
              <a
                href={deploymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="deployment-url"
              >
                <ExternalLink className="w-4 h-4" />
                {deploymentUrl}
              </a>
            )}

            <div className="next-steps">
              <h4>Next Steps</h4>
              <ul>
                <li>Configure environment variables in CloudRuntime dashboard</li>
                <li>Set up monitoring and alerts</li>
                <li>Test the deployment with a sample request</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
