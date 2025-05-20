import React from 'react';
import { EnhancedTimelineView } from '@the-new-fuse/feature-suggestions';
import { SuggestionPriority } from '@the-new-fuse/feature-suggestions/src/types';
const sampleEvents = [
    {
        id: '1',
        type: 'SUGGESTION',
        timestamp: new Date('2025-01-01'),
        data: {
            title: 'Add Dark Mode Support',
            description: 'Implement system-wide dark mode with user preferences',
            priority: SuggestionPriority.HIGH,
            item: { id: 'sugg1' }
        }
    },
    {
        id: '2',
        type: 'TODO',
        timestamp: new Date('2025-01-05'),
        parentId: '1',
        data: {
            title: 'Create Color Palette',
            description: 'Design dark mode color scheme',
            item: { id: 'todo1' }
        }
    },
    {
        id: '3',
        type: 'FEATURE',
        timestamp: new Date('2025-01-10'),
        parentId: '2',
        data: {
            title: 'Theme Switcher',
            description: 'Implement theme switching mechanism',
            item: { id: 'feat1' }
        }
    },
    {
        id: '4',
        type: 'WORKFLOW_STEP',
        timestamp: new Date('2025-01-12'),
        parentId: '3',
        data: {
            title: 'User Testing',
            description: 'Conduct user testing for dark mode',
            item: { id: 'workflow1' }
        }
    },
    {
        id: '5',
        type: 'SUGGESTION',
        timestamp: new Date('2025-01-15'),
        data: {
            title: 'Add Mobile Support',
            description: 'Make the application responsive for mobile devices',
            priority: SuggestionPriority.MEDIUM,
            item: { id: 'sugg2' }
        }
    }
];
const sampleBranches = [
    {
        id: 'main',
        name: 'main',
        startEvent: '1',
        status: 'ACTIVE'
    },
    {
        id: 'mobile',
        name: 'mobile-development',
        parentBranchId: 'main',
        startEvent: '5',
        status: 'ACTIVE'
    }
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
                nextSteps: ['step2']
            },
            {
                id: 'step2',
                type: 'DEVELOPMENT',
                config: {},
                nextSteps: ['step3']
            },
            {
                id: 'step3',
                type: 'TESTING',
                config: {},
                nextSteps: []
            }
        ]
    }
];
const TimelineDemo = () => {
    const handleEventClick = (event) => {
        
    };
    const handleCreateBranch = (fromEventId, name) => {
        
    };
    const handleMergeBranch = (fromEventId, toEventId) => {
        
    };
    return (<div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Timeline Demo</h1>
        <div className="bg-white rounded-xl shadow-xl p-6">
          <EnhancedTimelineView events={sampleEvents} branches={sampleBranches} workflows={sampleWorkflows} onEventClick={handleEventClick} onCreateBranch={handleCreateBranch} onMergeBranch={handleMergeBranch}/>
        </div>
      </div>
    </div>);
};
export default TimelineDemo;
//# sourceMappingURL=timeline-demo.js.map