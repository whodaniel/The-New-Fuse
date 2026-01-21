import { Edge, Node } from 'reactflow';
import { WorkflowTemplate } from '../services/WorkflowService';

export const DEFAULT_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'template-code-review',
    name: 'Code Review Automation',
    description: 'Automated code review process with AI agents for syntax, security, and performance.',
    category: 'Development',
    complexity: 'medium',
    popularity: 'high',
    nodes: [
      { id: 'start', type: 'trigger', position: { x: 250, y: 0 }, data: { label: 'GitHub PR' } },
      { id: 'syntax', type: 'agent', position: { x: 0, y: 100 }, data: { label: 'Syntax Check', agentType: 'code-analyzer' } },
      { id: 'security', type: 'agent', position: { x: 250, y: 100 }, data: { label: 'Security Audit', agentType: 'security-auditor' } },
      { id: 'perf', type: 'agent', position: { x: 500, y: 100 }, data: { label: 'Perf Check', agentType: 'performance-analyst' } },
      { id: 'summary', type: 'processing', position: { x: 250, y: 250 }, data: { label: 'Summarize Reports' } },
      { id: 'notify', type: 'action', position: { x: 250, y: 350 }, data: { label: 'Post Comment' } }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'syntax' },
      { id: 'e2', source: 'start', target: 'security' },
      { id: 'e3', source: 'start', target: 'perf' },
      { id: 'e4', source: 'syntax', target: 'summary' },
      { id: 'e5', source: 'security', target: 'summary' },
      { id: 'e6', source: 'perf', target: 'summary' },
      { id: 'e7', source: 'summary', target: 'notify' }
    ]
  },
  {
    id: 'template-data-analysis',
    name: 'Data Analysis Pipeline',
    description: 'Ingest data, clean it, analyze with AI, and generate a visualization report.',
    category: 'Data',
    complexity: 'high',
    popularity: 'medium',
    nodes: [
      { id: 'ingest', type: 'trigger', position: { x: 250, y: 0 }, data: { label: 'Data Ingestion' } },
      { id: 'clean', type: 'processing', position: { x: 250, y: 100 }, data: { label: 'Data Cleaning' } },
      { id: 'analyze', type: 'agent', position: { x: 250, y: 200 }, data: { label: 'AI Analysis', agentType: 'data-scientist' } },
      { id: 'viz', type: 'processing', position: { x: 250, y: 300 }, data: { label: 'Visualization' } },
      { id: 'report', type: 'action', position: { x: 250, y: 400 }, data: { label: 'Email Report' } }
    ],
    edges: [
      { id: 'e1', source: 'ingest', target: 'clean' },
      { id: 'e2', source: 'clean', target: 'analyze' },
      { id: 'e3', source: 'analyze', target: 'viz' },
      { id: 'e4', source: 'viz', target: 'report' }
    ]
  },
  {
    id: 'template-content-gen',
    name: 'Content Generation',
    description: 'Generate blog posts from topics, review with AI, and publish to CMS.',
    category: 'Content',
    complexity: 'low',
    popularity: 'high',
    nodes: [
      { id: 'topic', type: 'trigger', position: { x: 250, y: 0 }, data: { label: 'Topic Input' } },
      { id: 'draft', type: 'agent', position: { x: 250, y: 100 }, data: { label: 'Draft Writer', agentType: 'writer' } },
      { id: 'review', type: 'agent', position: { x: 250, y: 200 }, data: { label: 'Editor Review', agentType: 'editor' } },
      { id: 'publish', type: 'action', position: { x: 250, y: 300 }, data: { label: 'Publish CMS' } }
    ],
    edges: [
      { id: 'e1', source: 'topic', target: 'draft' },
      { id: 'e2', source: 'draft', target: 'review' },
      { id: 'e3', source: 'review', target: 'publish' }
    ]
  },
  {
    id: 'template-onboarding',
    name: 'User Onboarding',
    description: 'Orchestrate welcome emails, account setup, and resource allocation for new users.',
    category: 'Operations',
    complexity: 'medium',
    popularity: 'medium',
    nodes: [
      { id: 'signup', type: 'trigger', position: { x: 250, y: 0 }, data: { label: 'User Signup' } },
      { id: 'email', type: 'action', position: { x: 100, y: 100 }, data: { label: 'Welcome Email' } },
      { id: 'crm', type: 'action', position: { x: 400, y: 100 }, data: { label: 'Update CRM' } },
      { id: 'slack', type: 'action', position: { x: 250, y: 200 }, data: { label: 'Notify Team' } }
    ],
    edges: [
      { id: 'e1', source: 'signup', target: 'email' },
      { id: 'e2', source: 'signup', target: 'crm' },
      { id: 'e3', source: 'signup', target: 'slack' }
    ]
  }
];
