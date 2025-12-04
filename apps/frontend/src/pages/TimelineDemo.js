import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Simple local types to avoid dependency issues
var SuggestionPriority;
(function (SuggestionPriority) {
    SuggestionPriority["LOW"] = "LOW";
    SuggestionPriority["MEDIUM"] = "MEDIUM";
    SuggestionPriority["HIGH"] = "HIGH";
    SuggestionPriority["CRITICAL"] = "CRITICAL";
})(SuggestionPriority || (SuggestionPriority = {}));
// Mock EnhancedTimelineView component to avoid dependency issues
var EnhancedTimelineView = function (_a) {
    var events = _a.events, onEventClick = _a.onEventClick;
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Timeline Events" }), _jsx("div", { className: "space-y-2", children: events.map(function (event, index) {
                    var _a, _b, _c, _d, _e, _f;
                    return (_jsxs("div", { className: "p-4 border rounded-lg cursor-pointer hover:bg-gray-50", onClick: function () { return onEventClick === null || onEventClick === void 0 ? void 0 : onEventClick(event); }, children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium", children: ((_a = event.data) === null || _a === void 0 ? void 0 : _a.title) || "Event ".concat(index + 1) }), _jsx("p", { className: "text-sm text-gray-600", children: ((_b = event.data) === null || _b === void 0 ? void 0 : _b.description) || 'No description' })] }), _jsx("span", { className: "text-xs text-gray-500", children: (_c = event.timestamp) === null || _c === void 0 ? void 0 : _c.toLocaleDateString() })] }), _jsx("div", { className: "mt-2", children: _jsx("span", { className: "inline-block px-2 py-1 text-xs rounded ".concat(((_d = event.data) === null || _d === void 0 ? void 0 : _d.priority) === 'HIGH' ? 'bg-red-100 text-red-800' :
                                        ((_e = event.data) === null || _e === void 0 ? void 0 : _e.priority) === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-green-100 text-green-800'), children: ((_f = event.data) === null || _f === void 0 ? void 0 : _f.priority) || 'NORMAL' }) })] }, event.id || index));
                }) })] }));
};
// Sample data for the timeline demonstration
var sampleEvents = [
    {
        id: '1',
        type: 'SUGGESTION',
        timestamp: new Date('2025-01-01'),
        data: {
            title: 'Add Dark Mode Support',
            description: 'Implement system-wide dark mode with user preferences',
            priority: 'HIGH',
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
            priority: 'MEDIUM',
            item: { id: 'sugg2' }
        }
    }
];
var sampleBranches = [
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
var sampleWorkflows = [
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
var TimelineDemo = function () {
    var handleEventClick = function (event) {
        // Handle event click
    };
    var handleCreateBranch = function (fromEventId, name) {
        // Handle branch creation
    };
    var handleMergeBranch = function (fromEventId, toEventId) {
        // Handle branch merging
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-50 p-8", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-8", children: "Timeline Demo" }), _jsx("div", { className: "bg-white rounded-xl shadow-xl p-6", children: _jsx(EnhancedTimelineView, { events: sampleEvents, branches: sampleBranches, workflows: sampleWorkflows, onEventClick: handleEventClick, onCreateBranch: handleCreateBranch, onMergeBranch: handleMergeBranch }) })] }) }));
};
export default TimelineDemo;
