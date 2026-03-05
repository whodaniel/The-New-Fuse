// @ts-nocheck
import React from 'react';

// Simple local types to avoid dependency issues
enum SuggestionPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Mock EnhancedTimelineView component to avoid dependency issues
const EnhancedTimelineView = ({
  events,
  onEventClick,
}: {
  events: any[];
  onEventClick?: (event: any) => void;
}) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Timeline Events</h3>
    <div className="space-y-2">
      {events.map((event, index) => (
        <div
          key={event.id || index}
          className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
          onClick={() => onEventClick?.(event)}
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">{event.data?.title || `Event ${index + 1}`}</h4>
              <p className="text-sm text-gray-600">{event.data?.description || 'No description'}</p>
            </div>
            <span className="text-xs text-gray-500">{event.timestamp?.toLocaleDateString()}</span>
          </div>
          <div className="mt-2">
            <span
              className={`inline-block px-2 py-1 text-xs rounded ${
                event.data?.priority === 'HIGH'
                  ? 'bg-red-100 text-red-800'
                  : event.data?.priority === 'MEDIUM'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
              }`}
            >
              {event.data?.priority || 'NORMAL'}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Sample data for the timeline demonstration
const sampleEvents = [
  {
    id: '1',
    type: 'SUGGESTION',
    timestamp: new Date('2025-01-01'),
    data: {
      title: 'Add Dark Mode Support',
      description: 'Implement system-wide dark mode with user preferences',
      priority: 'HIGH',
      item: { id: 'sugg1' },
    },
  },
  {
    id: '2',
    type: 'TODO',
    timestamp: new Date('2025-01-05'),
    parentId: '1',
    data: {
      title: 'Create Color Palette',
      description: 'Design dark mode color scheme',
      item: { id: 'todo1' },
    },
  },
  {
    id: '3',
    type: 'FEATURE',
    timestamp: new Date('2025-01-10'),
    parentId: '2',
    data: {
      title: 'Theme Switcher',
      description: 'Implement theme switching mechanism',
      item: { id: 'feat1' },
    },
  },
  {
    id: '4',
    type: 'WORKFLOW_STEP',
    timestamp: new Date('2025-01-12'),
    parentId: '3',
    data: {
      title: 'User Testing',
      description: 'Conduct user testing for dark mode',
      item: { id: 'workflow1' },
    },
  },
  {
    id: '5',
    type: 'SUGGESTION',
    timestamp: new Date('2025-01-15'),
    data: {
      title: 'Add Mobile Support',
      description: 'Make the application responsive for mobile devices',
      priority: 'MEDIUM',
      item: { id: 'sugg2' },
    },
  },
];

const sampleBranches = [
  {
    id: 'main',
    name: 'main',
    startEvent: '1',
    status: 'ACTIVE',
  },
  {
    id: 'mobile',
    name: 'mobile-development',
    parentBranchId: 'main',
    startEvent: '5',
    status: 'ACTIVE',
  },
];

const sampleWorkflows = [
  {
    id: 'workflow1',
    name: 'Dark Mode Implementation',
    description: 'Workflow for implementing dark mode',
    eventId: '4',
    status: 'ACTIVE',
    steps: [
      {
        id: 'step1',
        type: 'DESIGN',
        config: {},
        nextSteps: ['step2'],
      },
      {
        id: 'step2',
        type: 'DEVELOPMENT',
        config: {},
        nextSteps: ['step3'],
      },
      {
        id: 'step3',
        type: 'TESTING',
        config: {},
        nextSteps: [],
      },
    ],
  },
];

interface TimelineEvent {
  id: string;
  // Add other properties as needed
}

const TimelineDemo: React.FC = () => {
  const handleEventClick = (event: TimelineEvent) => {
    // Handle event click
  };

  const handleCreateBranch = (fromEventId: string, name: string) => {
    // Handle branch creation
  };

  const handleMergeBranch = (fromEventId: string, toEventId: string) => {
    // Handle branch merging
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Timeline Demo</h1>
        <div className="bg-white rounded-xl shadow-xl p-6">
          <EnhancedTimelineView
            events={sampleEvents}
            branches={sampleBranches}
            workflows={sampleWorkflows}
            onEventClick={handleEventClick}
            onCreateBranch={handleCreateBranch}
            onMergeBranch={handleMergeBranch}
          />
        </div>
      </div>
    </div>
  );
};

export default TimelineDemo;
