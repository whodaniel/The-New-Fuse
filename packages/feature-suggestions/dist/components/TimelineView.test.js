"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@testing-library/react");
const TimelineView_1 = __importDefault(require("./TimelineView"));
// Helper function to convert TimelineWorkflow from the timeline.ts file
// to the format expected by the TimelineView component
const adaptWorkflowsForTimelineView = (workflows) => {
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
    default: jest.fn(() => (0, jsx_runtime_1.jsx)("div", { "data-testid": "timeline-slider" }))
}));
jest.mock('@the-new-fuse/EventDetails', () => ({
    __esModule: true,
    default: jest.fn(() => (0, jsx_runtime_1.jsx)("div", { "data-testid": "event-details" }))
}));
jest.mock('@the-new-fuse/BranchSelector', () => ({
    __esModule: true,
    default: jest.fn(() => (0, jsx_runtime_1.jsx)("div", { "data-testid": "branch-selector" }))
}));
const mockEvents = [
    {
        id: '1',
        type: 'FEATURE',
        timestamp: '2025-01-01T00:00:00Z',
        data: { title: 'Test Feature' }
    }
];
const mockBranches = [
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
const mockWorkflows = [
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
        (0, react_1.render)((0, jsx_runtime_1.jsx)(TimelineView_1.default, { events: mockEvents, branches: mockBranches, workflows: adaptWorkflowsForTimelineView(mockWorkflows), onEventClick: mockOnEventClick, onCreateBranch: mockOnCreateBranch, onMergeBranch: mockOnMergeBranch }));
        expect(react_1.screen.getByTestId('timeline-slider')).toBeInTheDocument();
    });
    it('displays events correctly', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(TimelineView_1.default, { events: mockEvents, branches: mockBranches, workflows: adaptWorkflowsForTimelineView(mockWorkflows), onEventClick: mockOnEventClick, onCreateBranch: mockOnCreateBranch, onMergeBranch: mockOnMergeBranch }));
        // Add assertions for event rendering
    });
    it('handles branch creation', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(TimelineView_1.default, { events: mockEvents, branches: mockBranches, workflows: adaptWorkflowsForTimelineView(mockWorkflows), onEventClick: mockOnEventClick, onCreateBranch: mockOnCreateBranch, onMergeBranch: mockOnMergeBranch }));
        // Add assertions for branch creation
    });
});
//# sourceMappingURL=TimelineView.test.js.map