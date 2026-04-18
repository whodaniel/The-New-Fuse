import React from 'react';
import { render, screen } from '@testing-library/react';
import TimelineView from './TimelineView.js';
import { TimelineEvent, TimelineBranch, TimelineWorkflow } from '../types/timeline.js';

// Helper function to convert TimelineWorkflow from the timeline.ts file
// to the format expected by the TimelineView component
const adaptWorkflowsForTimelineView = (
  workflows: TimelineWorkflow[]
): Array<{
  id: string;
  name: string;
  steps: Array<{
    id: string;
    name: string;
    status: string;
  }>;
}> => {
  return workflows.map(workflow => ({
    id: workflow.id,
    name: workflow.name,
    steps: workflow.steps.map(step => ({
      id: step.id,
      name: step.title, // Map 'title' to 'name'
      status: typeof step.status === 'string' ? step.status : String(step.status)
    }))
  }));
};

jest.mock('@the-new-fuse/TimelineSlider', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="timeline-slider" />)
}));

jest.mock('@the-new-fuse/EventDetails', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="event-details" />)
}));

jest.mock('@the-new-fuse/BranchSelector', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="branch-selector" />)
}));

const mockEvents: TimelineEvent[] = [
  {
    id: '1',
    type: 'FEATURE',
    timestamp: '2025-01-01T00:00:00Z',
    data: { title: 'Test Feature' }
  }
];

const mockBranches: TimelineBranch[] = [
  {
    id: '1',
    name: 'main',
    startEventId: '1',
    status: 'ACTIVE',
    events: ['1'],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  }
];

const mockWorkflows: TimelineWorkflow[] = [
  {
    id: '1',
    name: 'Test Workflow',
    description: 'Test workflow description',
    eventId: '1',
    status: 'PENDING',
    steps: [
      {
        id: 'step1',
        workflowId: '1',
        title: 'Step 1',
        description: 'First step',
        status: 'PENDING',
        order: 1
      }
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  }
];

describe('TimelineView', () => {
  const mockOnEventClick = jest.fn();
  const mockOnCreateBranch = jest.fn();
  const mockOnMergeBranch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders timeline view', () => {
    render(
      <TimelineView
        events={mockEvents}
        branches={mockBranches}
        workflows={adaptWorkflowsForTimelineView(mockWorkflows)}
        onEventClick={mockOnEventClick}
        onCreateBranch={mockOnCreateBranch}
        onMergeBranch={mockOnMergeBranch}
      />
    );

    expect(screen.getByTestId('timeline-slider')).toBeInTheDocument();
  });

  it('displays events correctly', () => {
    render(
      <TimelineView
        events={mockEvents}
        branches={mockBranches}
        workflows={adaptWorkflowsForTimelineView(mockWorkflows)}
        onEventClick={mockOnEventClick}
        onCreateBranch={mockOnCreateBranch}
        onMergeBranch={mockOnMergeBranch}
      />
    );

    // Add assertions for event rendering
  });

  it('handles branch creation', () => {
    render(
      <TimelineView
        events={mockEvents}
        branches={mockBranches}
        workflows={adaptWorkflowsForTimelineView(mockWorkflows)}
        onEventClick={mockOnEventClick}
        onCreateBranch={mockOnCreateBranch}
        onMergeBranch={mockOnMergeBranch}
      />
    );

    // Add assertions for branch creation
  });
});
