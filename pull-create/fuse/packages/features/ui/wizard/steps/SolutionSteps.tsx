/**
 * Solution Steps
 *
 * Guide users through fixing identified issues
 */

import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  FileCode,
  Terminal,
  Wrench,
} from 'lucide-react';
import React, { useState } from 'react';
import { WizardContext } from '../WizardSystem';

export interface SolutionStepsProps {
  context: WizardContext;
  onDataChange: (data: Record<string, unknown>) => void;
  validationErrors?: string[];
}

interface Solution {
  id: string;
  title: string;
  description: string;
  forIssues: string[];
  steps: SolutionStep[];
  docs?: string;
}

interface SolutionStep {
  id: string;
  type: 'command' | 'code' | 'manual' | 'info';
  title: string;
  content: string;
  note?: string;
}

const SOLUTIONS: Solution[] = [
  {
    id: 'fix-api-connection',
    title: 'Fix API Connection Issues',
    description: 'Steps to resolve API connectivity problems',
    forIssues: ['api-health', 'connection', 'API connection failed'],
    steps: [
      {
        id: '1',
        type: 'manual',
        title: 'Check if the API server is running',
        content: 'Verify that the API server is started and accessible on the expected port.',
      },
      {
        id: '2',
        type: 'command',
        title: 'Check API server status',
        content: 'pnpm dev:api',
        note: 'Run this in the project root to start the API server',
      },
      {
        id: '3',
        type: 'command',
        title: 'Test API health endpoint',
        content: 'curl http://localhost:3001/health',
        note: 'Should return {"status":"ok"}',
      },
      {
        id: '4',
        type: 'code',
        title: 'Check environment variables',
        content: `# .env file should contain:
API_URL=http://localhost:3001
API_KEY=your-api-key-here`,
      },
    ],
    docs: 'https://docs.thenewfuse.com/troubleshooting/api',
  },
  {
    id: 'fix-database',
    title: 'Fix Database Connection',
    description: 'Steps to resolve database connectivity issues',
    forIssues: ['db-connection', 'database', 'Cannot connect to database'],
    steps: [
      {
        id: '1',
        type: 'command',
        title: 'Check PostgreSQL status',
        content: 'pg_isready -h localhost -p 5432',
      },
      {
        id: '2',
        type: 'command',
        title: 'Start PostgreSQL (if using Docker)',
        content: 'docker-compose up -d postgres',
      },
      {
        id: '3',
        type: 'code',
        title: 'Verify DATABASE_URL',
        content: `# .env file:
DATABASE_URL="postgresql://user:password@localhost:5432/thenewfuse"`,
      },
      {
        id: '4',
        type: 'command',
        title: 'Run database migrations',
        content: 'pnpm db:migrate',
      },
    ],
    docs: 'https://docs.thenewfuse.com/troubleshooting/database',
  },
  {
    id: 'fix-railway',
    title: 'Fix Railway Deployment',
    description: 'Steps to resolve Railway deployment issues',
    forIssues: ['deployment', 'Deploy to Railway', 'Railway deployment failing'],
    steps: [
      {
        id: '1',
        type: 'command',
        title: 'Login to Railway',
        content: 'railway login',
      },
      {
        id: '2',
        type: 'command',
        title: 'Check Railway status',
        content: 'railway status',
      },
      {
        id: '3',
        type: 'command',
        title: 'View deployment logs',
        content: 'railway logs',
      },
      {
        id: '4',
        type: 'manual',
        title: 'Check environment variables',
        content: 'Verify all required environment variables are set in Railway dashboard',
      },
      {
        id: '5',
        type: 'command',
        title: 'Force redeploy',
        content: 'railway up --detach',
      },
    ],
    docs: 'https://docs.thenewfuse.com/deployment/railway',
  },
  {
    id: 'fix-permissions',
    title: 'Fix Permission Issues',
    description: 'Steps to resolve access and permission problems',
    forIssues: ['access', 'permission denied', 'Permission denied errors'],
    steps: [
      {
        id: '1',
        type: 'manual',
        title: 'Check your role',
        content: 'Verify your user role in the admin dashboard. You may need elevated permissions.',
      },
      {
        id: '2',
        type: 'manual',
        title: 'Check token expiration',
        content: 'Your authentication token may have expired. Try logging out and logging back in.',
      },
      {
        id: '3',
        type: 'code',
        title: 'Verify JWT configuration',
        content: `# Check JWT_SECRET is set
JWT_SECRET=your-secret-key
JWT_EXPIRY=7d`,
      },
      {
        id: '4',
        type: 'manual',
        title: 'Contact administrator',
        content: 'If you believe you should have access, contact your organization administrator.',
      },
    ],
    docs: 'https://docs.thenewfuse.com/security/rbac',
  },
];

export const SolutionSteps: React.FC<SolutionStepsProps> = ({
  context,
  onDataChange,
  validationErrors = [],
}) => {
  const [completedSteps, setCompletedSteps] = useState<string[]>(
    (context.data.completedSolutionSteps as string[]) || []
  );
  const [expandedSolutions, setExpandedSolutions] = useState<string[]>(['fix-api-connection']);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  // Find relevant solutions based on context
  const problemCategory = context.data.problemCategory as string;
  const problemDescription = context.data.problemDescription as string;
  const diagnosticResults = context.data.diagnosticResults as Array<{ id: string; status: string }>;

  const relevantSolutions = SOLUTIONS.filter((solution) => {
    // Match based on problem category
    if (
      problemCategory &&
      solution.forIssues.some((issue) =>
        issue.toLowerCase().includes(problemCategory.toLowerCase())
      )
    ) {
      return true;
    }
    // Match based on problem description
    if (
      problemDescription &&
      solution.forIssues.some(
        (issue) =>
          problemDescription.toLowerCase().includes(issue.toLowerCase()) ||
          issue.toLowerCase().includes(problemDescription.toLowerCase())
      )
    ) {
      return true;
    }
    // Match based on failed diagnostics
    if (diagnosticResults) {
      const failedChecks = diagnosticResults.filter((r) => r.status === 'failed').map((r) => r.id);
      return solution.forIssues.some((issue) => failedChecks.includes(issue));
    }
    return false;
  });

  const toggleSolution = (solutionId: string) => {
    setExpandedSolutions((prev) =>
      prev.includes(solutionId) ? prev.filter((id) => id !== solutionId) : [...prev, solutionId]
    );
  };

  const toggleStepComplete = (stepId: string) => {
    const newCompleted = completedSteps.includes(stepId)
      ? completedSteps.filter((id) => id !== stepId)
      : [...completedSteps, stepId];

    setCompletedSteps(newCompleted);
    onDataChange({ completedSolutionSteps: newCompleted });
  };

  const copyToClipboard = async (text: string, stepId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedCommand(stepId);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const getStepIcon = (type: SolutionStep['type']) => {
    switch (type) {
      case 'command':
        return <Terminal className="w-4 h-4" />;
      case 'code':
        return <FileCode className="w-4 h-4" />;
      case 'info':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Wrench className="w-4 h-4" />;
    }
  };

  return (
    <div className="wizard-step-solutions">
      <div className="step-header">
        <Wrench className="w-8 h-8 text-primary" />
        <h2 className="step-title">Solution Steps</h2>
        <p className="step-description">Follow these steps to resolve your issue</p>
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

      <div className="solutions-container">
        {relevantSolutions.length === 0 ? (
          <div className="no-solutions">
            <AlertCircle className="w-12 h-12" />
            <h3>No specific solutions found</h3>
            <p>Try running diagnostics or describing your issue in more detail.</p>
          </div>
        ) : (
          relevantSolutions.map((solution) => {
            const isExpanded = expandedSolutions.includes(solution.id);
            const solutionCompletedSteps = solution.steps.filter((step) =>
              completedSteps.includes(`${solution.id}-${step.id}`)
            ).length;

            return (
              <div key={solution.id} className="solution-card">
                <div className="solution-header" onClick={() => toggleSolution(solution.id)}>
                  <div className="solution-info">
                    <h3>{solution.title}</h3>
                    <p>{solution.description}</p>
                    <div className="solution-progress">
                      {solutionCompletedSteps}/{solution.steps.length} steps completed
                    </div>
                  </div>
                  <div className="solution-toggle">
                    {isExpanded ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="solution-steps">
                    {solution.steps.map((step) => {
                      const stepKey = `${solution.id}-${step.id}`;
                      const isCompleted = completedSteps.includes(stepKey);

                      return (
                        <div
                          key={step.id}
                          className={`solution-step ${step.type} ${isCompleted ? 'completed' : ''}`}
                        >
                          <div className="step-checkbox">
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={() => toggleStepComplete(stepKey)}
                            />
                          </div>
                          <div className="step-content">
                            <div className="step-title">
                              {getStepIcon(step.type)}
                              <span>{step.title}</span>
                            </div>
                            {step.type === 'command' || step.type === 'code' ? (
                              <div className="code-block">
                                <pre>{step.content}</pre>
                                <button
                                  className="copy-btn"
                                  onClick={() => copyToClipboard(step.content, stepKey)}
                                >
                                  {copiedCommand === stepKey ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <p className="step-description">{step.content}</p>
                            )}
                            {step.note && <p className="step-note">{step.note}</p>}
                          </div>
                        </div>
                      );
                    })}

                    {solution.docs && (
                      <a
                        href={solution.docs}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="docs-link"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Documentation
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="step-tips">
        <h4>Still having issues?</h4>
        <ul>
          <li>Check the full documentation for more detailed guides</li>
          <li>Search the community forums for similar issues</li>
          <li>Contact support with your diagnostic results</li>
        </ul>
      </div>
    </div>
  );
};
