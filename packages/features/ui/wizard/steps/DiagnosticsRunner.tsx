/**
 * Diagnostics Runner Step
 *
 * Run automated diagnostics to identify issues
 */

import { Activity, AlertTriangle, Check, Loader, RefreshCw, Terminal, X } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { WizardContext } from '../WizardSystem.js';

export interface DiagnosticsRunnerProps {
  context: WizardContext;
  onDataChange: (data: Record<string, unknown>) => void;
  validationErrors?: string[];
}

interface DiagnosticCheck {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  message?: string;
  duration?: number;
}

const DIAGNOSTIC_CHECKS: Omit<DiagnosticCheck, 'status'>[] = [
  // Connection checks
  {
    id: 'api-health',
    name: 'API Health Check',
    description: 'Check if the API is responding',
    category: 'Connection',
  },
  {
    id: 'ws-connection',
    name: 'WebSocket Connection',
    description: 'Test WebSocket connectivity',
    category: 'Connection',
  },
  {
    id: 'db-connection',
    name: 'Database Connection',
    description: 'Verify database is reachable',
    category: 'Connection',
  },
  {
    id: 'redis-connection',
    name: 'Redis Connection',
    description: 'Check Redis availability',
    category: 'Connection',
  },

  // Service checks
  {
    id: 'auth-service',
    name: 'Auth Service',
    description: 'Verify authentication is working',
    category: 'Services',
  },
  {
    id: 'agent-service',
    name: 'Agent Service',
    description: 'Check agent management service',
    category: 'Services',
  },
  {
    id: 'llm-provider',
    name: 'LLM Provider',
    description: 'Test LLM provider connectivity',
    category: 'Services',
  },

  // Configuration checks
  {
    id: 'env-vars',
    name: 'Environment Variables',
    description: 'Verify required env vars are set',
    category: 'Configuration',
  },
  {
    id: 'ssl-cert',
    name: 'SSL Certificate',
    description: 'Check SSL certificate validity',
    category: 'Configuration',
  },
  {
    id: 'rbac-config',
    name: 'RBAC Configuration',
    description: 'Validate role configuration',
    category: 'Configuration',
  },

  // Performance checks
  {
    id: 'response-time',
    name: 'Response Time',
    description: 'Measure API response latency',
    category: 'Performance',
  },
  {
    id: 'memory-usage',
    name: 'Memory Usage',
    description: 'Check memory consumption',
    category: 'Performance',
  },
];

export const DiagnosticsRunner: React.FC<DiagnosticsRunnerProps> = ({
  context,
  onDataChange,
  validationErrors = [],
}) => {
  const [checks, setChecks] = useState<DiagnosticCheck[]>(
    DIAGNOSTIC_CHECKS.map((check) => ({ ...check, status: 'pending' }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const runDiagnostics = useCallback(async () => {
    setIsRunning(true);
    setHasRun(true);

    // Reset all checks to pending
    setChecks(DIAGNOSTIC_CHECKS.map((check) => ({ ...check, status: 'pending' })));

    // Run each check sequentially
    for (let i = 0; i < DIAGNOSTIC_CHECKS.length; i++) {
      const check = DIAGNOSTIC_CHECKS[i];

      // Set current check to running
      setChecks((prev) => prev.map((c, idx) => (idx === i ? { ...c, status: 'running' } : c)));

      // Simulate check execution
      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

      // Simulate result (in production this would run actual checks)
      const results: Array<'passed' | 'failed' | 'warning'> = [
        'passed',
        'passed',
        'passed',
        'passed',
        'warning',
        'failed',
      ];
      const result = results[Math.floor(Math.random() * (results.length - 1))]; // Mostly pass
      const duration = Math.floor(100 + Math.random() * 400);

      let message: string | undefined;
      if (result === 'failed') {
        message = 'Connection refused or timeout';
      } else if (result === 'warning') {
        message = 'Degraded performance detected';
      }

      setChecks((prev) =>
        prev.map((c, idx) => (idx === i ? { ...c, status: result, duration, message } : c))
      );
    }

    setIsRunning(false);

    // Update context with results
    const finalChecks = checks.map((check, i) => ({
      ...check,
      status: check.status === 'running' ? 'passed' : check.status,
    }));
    onDataChange({ diagnosticResults: finalChecks });
  }, [checks, onDataChange]);

  const getStatusIcon = (status: DiagnosticCheck['status']) => {
    switch (status) {
      case 'passed':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <X className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'running':
        return <Loader className="w-5 h-5 animate-spin text-blue-500" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300" />;
    }
  };

  const passedCount = checks.filter((c) => c.status === 'passed').length;
  const failedCount = checks.filter((c) => c.status === 'failed').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;

  const categories = [...new Set(DIAGNOSTIC_CHECKS.map((c) => c.category))];

  return (
    <div className="wizard-step-diagnostics">
      <div className="step-header">
        <Activity className="w-8 h-8 text-primary" />
        <h2 className="step-title">Run Diagnostics</h2>
        <p className="step-description">Automated checks to identify potential issues</p>
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

      <div className="diagnostics-content">
        <div className="diagnostics-controls">
          <button className="run-btn" onClick={runDiagnostics} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Running Diagnostics...
              </>
            ) : hasRun ? (
              <>
                <RefreshCw className="w-5 h-5" />
                Run Again
              </>
            ) : (
              <>
                <Terminal className="w-5 h-5" />
                Start Diagnostics
              </>
            )}
          </button>
        </div>

        {hasRun && (
          <div className="results-summary">
            <div className="summary-stat passed">
              <Check className="w-4 h-4" />
              <span>{passedCount} Passed</span>
            </div>
            <div className="summary-stat warning">
              <AlertTriangle className="w-4 h-4" />
              <span>{warningCount} Warnings</span>
            </div>
            <div className="summary-stat failed">
              <X className="w-4 h-4" />
              <span>{failedCount} Failed</span>
            </div>
          </div>
        )}

        <div className="checks-container">
          {categories.map((category) => (
            <div key={category} className="check-category">
              <h3>{category}</h3>
              <div className="checks-list">
                {checks
                  .filter((c) => c.category === category)
                  .map((check) => (
                    <div key={check.id} className={`check-item ${check.status}`}>
                      <div className="check-status">{getStatusIcon(check.status)}</div>
                      <div className="check-info">
                        <span className="check-name">{check.name}</span>
                        <span className="check-description">{check.description}</span>
                        {check.message && <span className="check-message">{check.message}</span>}
                      </div>
                      {check.duration && <span className="check-duration">{check.duration}ms</span>}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {hasRun && failedCount > 0 && (
        <div className="step-tips error">
          <h4>Issues Detected</h4>
          <p>Some checks failed. The next step will show you how to fix them.</p>
        </div>
      )}

      {hasRun && failedCount === 0 && warningCount === 0 && (
        <div className="step-tips success">
          <h4>All Checks Passed!</h4>
          <p>
            Your system appears to be healthy. If you're still experiencing issues, please continue
            to describe them.
          </p>
        </div>
      )}
    </div>
  );
};
