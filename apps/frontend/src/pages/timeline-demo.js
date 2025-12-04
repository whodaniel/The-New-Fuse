import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
var timelineEvents = [
    {
        id: '1',
        date: '2025-01-01',
        title: 'Project Initiated',
        description: 'The New Fuse project was started with ambitious goals for multi-agent communication.',
        type: 'milestone'
    },
    {
        id: '2',
        date: '2025-02-15',
        title: 'Core Architecture Completed',
        description: 'Basic framework and routing system implemented.',
        type: 'development'
    },
    {
        id: '3',
        date: '2025-03-01',
        title: 'UI Components Added',
        description: 'Comprehensive component library and design system created.',
        type: 'feature'
    },
    {
        id: '4',
        date: '2025-04-01',
        title: 'Multi-Agent Chat Launched',
        description: 'Real-time chat system with multiple AI agents now functional.',
        type: 'feature'
    }
];
var getTypeColor = function (type) {
    switch (type) {
        case 'milestone': return 'bg-blue-500';
        case 'development': return 'bg-green-500';
        case 'feature': return 'bg-purple-500';
        default: return 'bg-gray-500';
    }
};
var TimelineDemo = function () {
    return (_jsxs("div", { className: "container mx-auto px-4 py-8", children: [_jsx("h1", { className: "text-3xl font-bold mb-8 text-center", children: "\uD83D\uDCC5 Timeline Demo" }), _jsx("div", { className: "max-w-4xl mx-auto", children: _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300" }), timelineEvents.map(function (event, index) { return (_jsxs("div", { className: "relative flex items-start mb-8", children: [_jsx("div", { className: "flex-shrink-0 w-4 h-4 rounded-full ".concat(getTypeColor(event.type), " border-4 border-white shadow-lg z-10") }), _jsxs("div", { className: "ml-6 bg-white rounded-lg shadow-md p-6 flex-grow", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: event.title }), _jsx("span", { className: "text-sm text-gray-500", children: event.date })] }), _jsx("p", { className: "text-gray-700 mb-2", children: event.description }), _jsx("span", { className: "inline-block px-2 py-1 rounded-full text-xs font-medium text-white ".concat(getTypeColor(event.type)), children: event.type })] })] }, event.id)); })] }) }), _jsx("div", { className: "text-center mt-8", children: _jsx("p", { className: "text-gray-600", children: "This timeline showcases key milestones in The New Fuse development." }) })] }));
};
export default TimelineDemo;
