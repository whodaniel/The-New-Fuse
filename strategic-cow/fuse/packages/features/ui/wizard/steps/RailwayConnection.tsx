/**
 * Railway Connection Step
 *
 * Step for connecting to Railway and verifying authentication
 */

import { AlertCircle, Check, ExternalLink, Key, Loader, RefreshCw, Train } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { WizardContext } from '../WizardSystem';

export interface RailwayConnectionProps {
  context: WizardContext;
  onDataChange: (data: Record<string, unknown>) => void;
  validationErrors?: string[];
}

interface RailwayProject {
  id: string;
  name: string;
  createdAt: string;
  environments: string[];
}

interface ConnectionStatus {
  connected: boolean;
  authenticated: boolean;
  username?: string;
  error?: string;
}

export const RailwayConnection: React.FC<RailwayConnectionProps> = ({
  context,
  onDataChange,
  validationErrors = [],
}) => {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [projects, setProjects] = useState<RailwayProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(
    (context.data.railwayProject as string) || ''
  );
  const [isChecking, setIsChecking] = useState(false);
  const [apiToken, setApiToken] = useState((context.data.railwayToken as string) || '');
  const [showTokenInput, setShowTokenInput] = useState(false);

  const checkConnection = useCallback(async () => {
    setIsChecking(true);

    try {
      // Simulate Railway CLI check - in production this would run `railway whoami`
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate connection status
      const isConnected = true; // Would check actual CLI status

      setStatus({
        connected: isConnected,
        authenticated: isConnected,
        username: isConnected ? 'demo-user@example.com' : undefined,
      });

      if (isConnected) {
        // Simulate fetching projects
        await new Promise((resolve) => setTimeout(resolve, 500));
        setProjects([
          {
            id: 'proj-1',
            name: 'the-new-fuse-production',
            createdAt: '2024-01-15',
            environments: ['production', 'staging'],
          },
          {
            id: 'proj-2',
            name: 'tnf-cloud-sandbox',
            createdAt: '2024-01-10',
            environments: ['production'],
          },
          {
            id: 'proj-3',
            name: 'tnf-development',
            createdAt: '2024-01-01',
            environments: ['development', 'testing'],
          },
        ]);
        onDataChange({ railwayConnected: true });
      }
    } catch (error) {
      setStatus({
        connected: false,
        authenticated: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      });
      onDataChange({ railwayConnected: false });
    } finally {
      setIsChecking(false);
    }
  }, [onDataChange]);

  useEffect(() => {
    checkConnection();
  }, []);

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    const project = projects.find((p) => p.id === projectId);
    onDataChange({
      railwayProject: projectId,
      railwayProjectName: project?.name,
      railwayEnvironments: project?.environments,
    });
  };

  const handleTokenSubmit = async () => {
    if (!apiToken.trim()) return;

    onDataChange({ railwayToken: apiToken });
    setShowTokenInput(false);
    await checkConnection();
  };

  return (
    <div className="wizard-step-railway">
      <div className="step-header">
        <Train className="w-8 h-8 text-primary" />
        <h2 className="step-title">Connect to Railway</h2>
        <p className="step-description">
          Connect your Railway account to deploy your cloud sandbox
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

      <div className="connection-section">
        <div className="status-card">
          <div className="status-header">
            <h3>Connection Status</h3>
            <button className="refresh-btn" onClick={checkConnection} disabled={isChecking}>
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {isChecking ? (
            <div className="status-checking">
              <Loader className="w-6 h-6 animate-spin" />
              <span>Checking Railway connection...</span>
            </div>
          ) : status ? (
            <div className={`status-result ${status.connected ? 'connected' : 'disconnected'}`}>
              {status.connected ? (
                <>
                  <Check className="w-6 h-6" />
                  <div className="status-info">
                    <span className="status-label">Connected</span>
                    {status.username && <span className="status-username">{status.username}</span>}
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-6 h-6" />
                  <div className="status-info">
                    <span className="status-label">Not Connected</span>
                    {status.error && <span className="status-error">{status.error}</span>}
                  </div>
                </>
              )}
            </div>
          ) : null}

          {!status?.connected && (
            <div className="connection-options">
              <button className="option-btn primary" onClick={() => setShowTokenInput(true)}>
                <Key className="w-4 h-4" />
                Use API Token
              </button>
              <a
                href="https://railway.app/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="option-btn secondary"
              >
                <ExternalLink className="w-4 h-4" />
                Open Railway Dashboard
              </a>
              <p className="option-hint">
                Run <code>railway login</code> in your terminal, or use an API token
              </p>
            </div>
          )}

          {showTokenInput && (
            <div className="token-input-section">
              <label htmlFor="api-token">Railway API Token</label>
              <div className="token-input-row">
                <input
                  id="api-token"
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="Enter your Railway API token"
                />
                <button onClick={handleTokenSubmit}>Connect</button>
              </div>
              <p className="token-hint">
                Get your token from Railway Dashboard → Account Settings → Tokens
              </p>
            </div>
          )}
        </div>

        {status?.connected && projects.length > 0 && (
          <div className="projects-section">
            <h3>Select Project</h3>
            <div className="projects-grid">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`project-card ${selectedProject === project.id ? 'selected' : ''}`}
                  onClick={() => handleProjectSelect(project.id)}
                >
                  <div className="project-header">
                    <h4>{project.name}</h4>
                    {selectedProject === project.id && <Check className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="project-meta">
                    <span>Created: {project.createdAt}</span>
                  </div>
                  <div className="project-environments">
                    {project.environments.map((env) => (
                      <span key={env} className="env-badge">
                        {env}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button className="new-project-btn">+ Create New Project</button>
          </div>
        )}
      </div>

      <div className="step-tips">
        <h4>Prerequisites</h4>
        <ul>
          <li>
            Railway CLI installed (<code>npm install -g @railway/cli</code>)
          </li>
          <li>Railway account with a project set up</li>
          <li>Docker installed for local testing</li>
        </ul>
      </div>
    </div>
  );
};
