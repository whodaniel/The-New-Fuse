"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
// Type guards to determine what kind of item we're dealing with
const isTodoItem = (item) => {
    return 'assignedTo' in item || item.status === 'TODO' || item.status === 'IN_PROGRESS' || item.status === 'DONE';
};
const isFeatureSuggestion = (item) => {
    return 'submittedBy' in item && 'votes' in item;
};
const KanbanBoard = ({ columns, onDragStart, onDragEnd, onItemClick }) => {
    const handleDragStart = (item, columnId) => {
        if (onDragStart)
            onDragStart(item, columnId);
    };
    const handleDragEnd = (item, sourceColumnId, targetColumnId) => {
        if (onDragEnd)
            onDragEnd(item, sourceColumnId, targetColumnId);
    };
    const handleItemClick = (item) => {
        if (onItemClick)
            onItemClick(item);
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex space-x-4 overflow-x-auto p-4", children: columns.map(column => ((0, jsx_runtime_1.jsxs)("div", { className: "flex-shrink-0 w-80 bg-gray-100 rounded-lg p-4", children: [(0, jsx_runtime_1.jsx)("h3", { className: "font-medium mb-4", children: column.title }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: column.items.map((item, index) => ((0, jsx_runtime_1.jsxs)("div", { draggable: true, onDragStart: () => handleDragStart(item, column.id), onClick: () => handleItemClick(item), className: "bg-white p-3 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-start mb-2", children: [(0, jsx_runtime_1.jsx)("h4", { className: "font-medium", children: item.title }), (0, jsx_runtime_1.jsx)("span", { className: `px-2 py-1 text-xs rounded-full ${item.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                                            item.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-blue-100 text-blue-800'}`, children: item.priority })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-600 mb-2", children: item.description }), isFeatureSuggestion(item) && item.tags && item.tags.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-1", children: item.tags.map((tag) => ((0, jsx_runtime_1.jsx)("span", { className: "px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full", children: tag }, tag))) })), isTodoItem(item) && item.assignedTo && ((0, jsx_runtime_1.jsxs)("div", { className: "mt-2 text-sm text-gray-500", children: ["Assigned to: ", item.assignedTo] }))] }, item.id))) })] }, column.id))) }));
};
exports.default = KanbanBoard;
//# sourceMappingURL=KanbanBoard.js.map