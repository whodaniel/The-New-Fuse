/**
 * Workflow Templates for The New Fuse
 * Pre-built workflow templates that users can import and customize
 */

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  nodes: any[];
  edges: any[];
  tags: string[];
}

export const workflowTemplates: WorkflowTemplate[] = [
  // 1. Code Review Workflow
  {
    id: 'code-review-workflow',
    name: 'Code Review Workflow',
    description: 'Automated code review process with agent analysis and human approval',
    category: 'Development',
    difficulty: 'beginner',
    estimatedTime: 15,
    tags: ['code-review', 'quality-assurance', 'approval'],
    nodes: [
      {
        id: 'start-1',
        type: 'agentTask',
        position: { x: 250, y: 50 },
        data: {
          label: 'Read Code Changes',
          description: 'Agent reads and analyzes the code changes',
          agentType: 'code-reader',
          estimatedTime: 2,
          priority: 'high',
          status: 'idle'
        }
      },
      {
        id: 'review-1',
        type: 'agentTask',
        position: { x: 250, y: 180 },
        data: {
          label: 'Analyze Code Quality',
          description: 'Agent reviews code for best practices, bugs, and improvements',
          agentType: 'code-reviewer',
          estimatedTime: 5,
          priority: 'high',
          status: 'idle'
        }
      },
      {
        id: 'condition-1',
        type: 'conditional',
        position: { x: 250, y: 310 },
        data: {
          label: 'Issues Found?',
          condition: 'issuesFound > 0',
          description: 'Check if any issues were found during review'
        }
      },
      {
        id: 'report-1',
        type: 'agentTask',
        position: { x: 100, y: 440 },
        data: {
          label: 'Generate Issue Report',
          description: 'Generate detailed report of issues found',
          agentType: 'reporter',
          estimatedTime: 2,
          priority: 'medium',
          status: 'idle'
        }
      },
      {
        id: 'approval-1',
        type: 'humanApproval',
        position: { x: 400, y: 440 },
        data: {
          label: 'Human Approval',
          description: 'Senior developer reviews and approves changes',
          approvers: 1,
          timeout: 24 * 60,
          status: 'idle'
        }
      },
      {
        id: 'merge-1',
        type: 'agentTask',
        position: { x: 400, y: 570 },
        data: {
          label: 'Merge Code',
          description: 'Merge approved code changes',
          agentType: 'developer',
          estimatedTime: 1,
          priority: 'high',
          status: 'idle'
        }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'start-1', target: 'review-1', animated: true },
      { id: 'e2-3', source: 'review-1', target: 'condition-1', animated: true },
      { id: 'e3-4', source: 'condition-1', sourceHandle: 'true', target: 'report-1', animated: true },
      { id: 'e3-5', source: 'condition-1', sourceHandle: 'false', target: 'approval-1', animated: true },
      { id: 'e5-6', source: 'approval-1', target: 'merge-1', animated: true }
    ]
  },

  // 2. Multi-Agent Research Workflow
  {
    id: 'multi-agent-research',
    name: 'Multi-Agent Research Workflow',
    description: 'Three agents research a topic in parallel, then combine and synthesize results',
    category: 'Research',
    difficulty: 'intermediate',
    estimatedTime: 30,
    tags: ['research', 'parallel', 'collaboration'],
    nodes: [
      {
        id: 'input-1',
        type: 'agentTask',
        position: { x: 300, y: 50 },
        data: {
          label: 'Parse Research Topic',
          description: 'Break down research topic into subtopics',
          agentType: 'analyst',
          estimatedTime: 3,
          priority: 'high',
          status: 'idle'
        }
      },
      {
        id: 'parallel-1',
        type: 'parallel',
        position: { x: 300, y: 180 },
        data: {
          label: 'Parallel Research',
          description: 'Three agents research different aspects simultaneously',
          parallelTasks: 3,
          status: 'idle'
        }
      },
      {
        id: 'research-1',
        type: 'agentTask',
        position: { x: 100, y: 310 },
        data: {
          label: 'Research Technical Aspects',
          description: 'Research technical implementation details',
          agentType: 'researcher',
          estimatedTime: 10,
          priority: 'high',
          status: 'idle'
        }
      },
      {
        id: 'research-2',
        type: 'agentTask',
        position: { x: 300, y: 310 },
        data: {
          label: 'Research Business Context',
          description: 'Research business use cases and market analysis',
          agentType: 'researcher',
          estimatedTime: 10,
          priority: 'high',
          status: 'idle'
        }
      },
      {
        id: 'research-3',
        type: 'agentTask',
        position: { x: 500, y: 310 },
        data: {
          label: 'Research Competitors',
          description: 'Analyze competitor solutions and alternatives',
          agentType: 'researcher',
          estimatedTime: 10,
          priority: 'high',
          status: 'idle'
        }
      },
      {
        id: 'combine-1',
        type: 'agentTask',
        position: { x: 300, y: 440 },
        data: {
          label: 'Combine Results',
          description: 'Aggregate research findings from all agents',
          agentType: 'coordinator',
          estimatedTime: 3,
          priority: 'high',
          status: 'idle'
        }
      },
      {
        id: 'synthesize-1',
        type: 'agentTask',
        position: { x: 300, y: 570 },
        data: {
          label: 'Synthesize Report',
          description: 'Create comprehensive research report with recommendations',
          agentType: 'analyst',
          estimatedTime: 5,
          priority: 'high',
          status: 'idle'
        }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'input-1', target: 'parallel-1', animated: true },
      { id: 'e2-3a', source: 'parallel-1', sourceHandle: 'output-1', target: 'research-1', animated: true },
      { id: 'e2-3b', source: 'parallel-1', sourceHandle: 'output-2', target: 'research-2', animated: true },
      { id: 'e2-3c', source: 'parallel-1', sourceHandle: 'output-3', target: 'research-3', animated: true },
      { id: 'e3-4a', source: 'research-1', target: 'combine-1', animated: true },
      { id: 'e3-4b', source: 'research-2', target: 'combine-1', animated: true },
      { id: 'e3-4c', source: 'research-3', target: 'combine-1', animated: true },
      { id: 'e4-5', source: 'combine-1', target: 'synthesize-1', animated: true }
    ]
  },

  // 3. Self-Improvement Loop
  {
    id: 'self-improvement-loop',
    name: 'Self-Improvement Loop',
    description: 'Agent suggests improvements, implements them, tests, and deploys if successful',
    category: 'Development',
    difficulty: 'advanced',
    estimatedTime: 45,
    tags: ['automation', 'ci-cd', 'testing', 'improvement'],
    nodes: [
      {
        id: 'analyze-1',
        type: 'agentTask',
        position: { x: 300, y: 50 },
        data: {
          label: 'Analyze Codebase',
          description: 'Analyze code for potential improvements',
          agentType: 'analyst',
          estimatedTime: 10,
          priority: 'medium',
          status: 'idle'
        }
      },
      {
        id: 'suggest-1',
        type: 'agentTask',
        position: { x: 300, y: 180 },
        data: {
          label: 'Suggest Improvements',
          description: 'Generate improvement suggestions based on analysis',
          agentType: 'architect',
          estimatedTime: 5,
          priority: 'high',
          status: 'idle'
        }
      },
      {
        id: 'approval-1',
        type: 'humanApproval',
        position: { x: 300, y: 310 },
        data: {
          label: 'Review Suggestions',
          description: 'Human reviews and approves improvement plan',
          approvers: 1,
          timeout: 12 * 60,
          status: 'idle'
        }
      },
      {
        id: 'implement-1',
        type: 'agentTask',
        position: { x: 300, y: 440 },
        data: {
          label: 'Implement Changes',
          description: 'Agent implements approved improvements',
          agentType: 'developer',
          estimatedTime: 15,
          priority: 'high',
          status: 'idle'
        }
      },
      {
        id: 'test-1',
        type: 'agentTask',
        position: { x: 300, y: 570 },
        data: {
          label: 'Run Tests',
          description: 'Execute automated test suite',
          agentType: 'tester',
          estimatedTime: 5,
          priority: 'high',
          status: 'idle'
        }
      },
      {
        id: 'condition-1',
        type: 'conditional',
        position: { x: 300, y: 700 },
        data: {
          label: 'Tests Passed?',
          condition: 'testsPassed === true',
          description: 'Check if all tests passed successfully'
        }
      },
      {
        id: 'deploy-1',
        type: 'agentTask',
        position: { x: 450, y: 830 },
        data: {
          label: 'Deploy Changes',
          description: 'Deploy improvements to production',
          agentType: 'devops',
          estimatedTime: 3,
          priority: 'high',
          status: 'idle'
        }
      },
      {
        id: 'rollback-1',
        type: 'agentTask',
        position: { x: 150, y: 830 },
        data: {
          label: 'Rollback & Debug',
          description: 'Rollback changes and analyze test failures',
          agentType: 'developer',
          estimatedTime: 10,
          priority: 'high',
          status: 'idle'
        }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'analyze-1', target: 'suggest-1', animated: true },
      { id: 'e2-3', source: 'suggest-1', target: 'approval-1', animated: true },
      { id: 'e3-4', source: 'approval-1', target: 'implement-1', animated: true },
      { id: 'e4-5', source: 'implement-1', target: 'test-1', animated: true },
      { id: 'e5-6', source: 'test-1', target: 'condition-1', animated: true },
      { id: 'e6-7', source: 'condition-1', sourceHandle: 'true', target: 'deploy-1', animated: true },
      { id: 'e6-8', source: 'condition-1', sourceHandle: 'false', target: 'rollback-1', animated: true }
    ]
  },

  // 4. Customer Support Workflow
  {
    id: 'customer-support',
    name: 'Intelligent Customer Support',
    description: 'Multi-agent customer support with automated triage and human escalation',
    category: 'Support',
    difficulty: 'intermediate',
    estimatedTime: 20,
    tags: ['customer-support', 'triage', 'automation'],
    nodes: [
      {
        id: 'receive-1',
        type: 'agentTask',
        position: { x: 300, y: 50 },
        data: {
          label: 'Receive & Parse Ticket',
          description: 'Parse customer support ticket',
          agentType: 'support-bot',
          estimatedTime: 1,
          priority: 'high',
          status: 'idle'
        }
      },
      {
        id: 'triage-1',
        type: 'agentTask',
        position: { x: 300, y: 180 },
        data: {
          label: 'Triage Ticket',
          description: 'Classify ticket by urgency and category',
          agentType: 'triage-agent',
          estimatedTime: 2,
          priority: 'high',
          status: 'idle'
        }
      },
      {
        id: 'condition-1',
        type: 'conditional',
        position: { x: 300, y: 310 },
        data: {
          label: 'Can Auto-Resolve?',
          condition: 'canAutoResolve === true',
          description: 'Check if issue can be automatically resolved'
        }
      },
      {
        id: 'auto-resolve-1',
        type: 'agentTask',
        position: { x: 150, y: 440 },
        data: {
          label: 'Auto-Resolve',
          description: 'Automatically resolve common issues',
          agentType: 'support-bot',
          estimatedTime: 2,
          priority: 'medium',
          status: 'idle'
        }
      },
      {
        id: 'human-1',
        type: 'humanApproval',
        position: { x: 450, y: 440 },
        data: {
          label: 'Human Agent Review',
          description: 'Escalate to human support agent',
          approvers: 1,
          timeout: 4 * 60,
          status: 'idle'
        }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'receive-1', target: 'triage-1', animated: true },
      { id: 'e2-3', source: 'triage-1', target: 'condition-1', animated: true },
      { id: 'e3-4', source: 'condition-1', sourceHandle: 'true', target: 'auto-resolve-1', animated: true },
      { id: 'e3-5', source: 'condition-1', sourceHandle: 'false', target: 'human-1', animated: true }
    ]
  },

  // 5. Data Pipeline Workflow
  {
    id: 'data-pipeline',
    name: 'Automated Data Pipeline',
    description: 'Extract, transform, validate, and load data with quality checks',
    category: 'Data',
    difficulty: 'advanced',
    estimatedTime: 40,
    tags: ['etl', 'data-processing', 'validation'],
    nodes: [
      {
        id: 'extract-1',
        type: 'agentTask',
        position: { x: 300, y: 50 },
        data: {
          label: 'Extract Data',
          description: 'Extract data from multiple sources',
          agentType: 'data-engineer',
          estimatedTime: 8,
          priority: 'high',
          status: 'idle'
        }
      },
      {
        id: 'parallel-1',
        type: 'parallel',
        position: { x: 300, y: 180 },
        data: {
          label: 'Parallel Transformations',
          description: 'Transform data in parallel streams',
          parallelTasks: 3,
          status: 'idle'
        }
      },
      {
        id: 'transform-1',
        type: 'agentTask',
        position: { x: 100, y: 310 },
        data: {
          label: 'Clean Data',
          description: 'Remove duplicates and fix formatting',
          agentType: 'data-engineer',
          estimatedTime: 5,
          priority: 'high',
          status: 'idle'
        }
      },
      {
        id: 'transform-2',
        type: 'agentTask',
        position: { x: 300, y: 310 },
        data: {
          label: 'Enrich Data',
          description: 'Add calculated fields and metadata',
          agentType: 'data-engineer',
          estimatedTime: 5,
          priority: 'high',
          status: 'idle'
        }
      },
      {
        id: 'transform-3',
        type: 'agentTask',
        position: { x: 500, y: 310 },
        data: {
          label: 'Validate Schema',
          description: 'Validate data against schema',
          agentType: 'data-validator',
          estimatedTime: 3,
          priority: 'high',
          status: 'idle'
        }
      },
      {
        id: 'merge-1',
        type: 'agentTask',
        position: { x: 300, y: 440 },
        data: {
          label: 'Merge & Quality Check',
          description: 'Merge transformed data and run quality checks',
          agentType: 'data-engineer',
          estimatedTime: 5,
          priority: 'high',
          status: 'idle'
        }
      },
      {
        id: 'condition-1',
        type: 'conditional',
        position: { x: 300, y: 570 },
        data: {
          label: 'Quality Check Pass?',
          condition: 'qualityScore >= 95',
          description: 'Verify data quality meets threshold'
        }
      },
      {
        id: 'load-1',
        type: 'agentTask',
        position: { x: 450, y: 700 },
        data: {
          label: 'Load to Database',
          description: 'Load validated data to production database',
          agentType: 'data-engineer',
          estimatedTime: 5,
          priority: 'high',
          status: 'idle'
        }
      },
      {
        id: 'quarantine-1',
        type: 'agentTask',
        position: { x: 150, y: 700 },
        data: {
          label: 'Quarantine & Alert',
          description: 'Quarantine bad data and alert team',
          agentType: 'data-engineer',
          estimatedTime: 2,
          priority: 'high',
          status: 'idle'
        }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'extract-1', target: 'parallel-1', animated: true },
      { id: 'e2-3a', source: 'parallel-1', sourceHandle: 'output-1', target: 'transform-1', animated: true },
      { id: 'e2-3b', source: 'parallel-1', sourceHandle: 'output-2', target: 'transform-2', animated: true },
      { id: 'e2-3c', source: 'parallel-1', sourceHandle: 'output-3', target: 'transform-3', animated: true },
      { id: 'e3-4a', source: 'transform-1', target: 'merge-1', animated: true },
      { id: 'e3-4b', source: 'transform-2', target: 'merge-1', animated: true },
      { id: 'e3-4c', source: 'transform-3', target: 'merge-1', animated: true },
      { id: 'e4-5', source: 'merge-1', target: 'condition-1', animated: true },
      { id: 'e5-6', source: 'condition-1', sourceHandle: 'true', target: 'load-1', animated: true },
      { id: 'e5-7', source: 'condition-1', sourceHandle: 'false', target: 'quarantine-1', animated: true }
    ]
  }
];

export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return workflowTemplates.find(t => t.id === id);
}

export function getTemplatesByCategory(category: string): WorkflowTemplate[] {
  return workflowTemplates.filter(t => t.category === category);
}

export function getTemplatesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): WorkflowTemplate[] {
  return workflowTemplates.filter(t => t.difficulty === difficulty);
}

export function searchTemplates(query: string): WorkflowTemplate[] {
  const lowerQuery = query.toLowerCase();
  return workflowTemplates.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}
