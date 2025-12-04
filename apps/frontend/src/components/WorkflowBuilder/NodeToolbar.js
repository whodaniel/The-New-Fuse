import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { FaRobot, FaTools, FaCode, FaDatabase, FaGlobe, FaWaveSquare, FaBell, FaSearch, FaFileAlt, FaMemory, FaChevronDown, FaPlus } from 'react-icons/fa';
import { FileText } from 'lucide-react';
var nodeCategories = [
    {
        name: 'AI',
        nodes: [
            { type: 'llm', label: 'LLM Completion', icon: FaRobot, description: 'Generate text using an LLM' },
            { type: 'tool', label: 'Tool Execution', icon: FaTools, description: 'Execute an AI tool' },
            { type: 'promptTemplate', label: 'Prompt Template', icon: FileText, description: 'Use a versioned prompt template' },
        ]
    },
    {
        name: 'Data',
        nodes: [
            { type: 'transform', label: 'Transform', icon: FaCode, description: 'Transform data (format, structure)' },
            { type: 'data', label: 'Data Source', icon: FaDatabase, description: 'Load data from a source' },
            { type: 'storage', label: 'Data Storage', icon: FaMemory, description: 'Store data' },
        ]
    },
    {
        name: 'Integration',
        nodes: [
            { type: 'api', label: 'API Call', icon: FaGlobe, description: 'Make HTTP requests to external APIs' },
            { type: 'webhook', label: 'Webhook', icon: FaWaveSquare, description: 'Send data to webhook endpoints' },
            { type: 'notification', label: 'Notification', icon: FaBell, description: 'Send notifications' },
        ]
    },
    {
        name: 'Advanced',
        nodes: [
            { type: 'vectorStore', label: 'Vector Store', icon: FaSearch, description: 'Work with vector databases' },
            { type: 'documentProcessing', label: 'Document Processing', icon: FaFileAlt, description: 'Process and chunk documents' },
            { type: 'condition', label: 'Condition', icon: FaCode, description: 'Conditional branching' },
        ]
    }
];
export var NodeToolbar = function (_a) {
    var onAddNode = _a.onAddNode;
    var _b = useState(null), hoveredNode = _b[0], setHoveredNode = _b[1];
    var _c = useState(null), expandedCategory = _c[0], setExpandedCategory = _c[1];
    var handleAddNode = function (nodeType) {
        // Calculate position - in a real app this might be based on the current view
        var position = {
            x: Math.random() * 300 + 100,
            y: Math.random() * 200 + 100
        };
        onAddNode(nodeType, position);
    };
    return (_jsx("div", { className: "absolute top-[70px] left-[10px] z-10 bg-white p-2 rounded-md border shadow-md", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("div", { className: "relative group", children: [_jsxs("button", { className: "flex items-center space-x-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors", children: [_jsx(FaPlus, { className: "w-3 h-3" }), _jsx("span", { children: "Add Node" })] }), _jsx("div", { className: "absolute bottom-full left-0 mb-1 px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap", children: "Add a node" })] }), nodeCategories.map(function (category) { return (_jsxs("div", { className: "relative", children: [_jsxs("div", { className: "relative group", children: [_jsxs("button", { className: "flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors", onClick: function () { return setExpandedCategory(expandedCategory === category.name ? null : category.name); }, children: [_jsx("span", { children: category.name }), _jsx(FaChevronDown, { className: "w-3 h-3" })] }), _jsxs("div", { className: "absolute bottom-full left-0 mb-1 px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap", children: ["Add ", category.name, " nodes"] })] }), expandedCategory === category.name && (_jsx("div", { className: "absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[200px]", children: category.nodes.map(function (node) { return (_jsxs("button", { className: "w-full flex items-center space-x-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors relative", onClick: function () {
                                    handleAddNode(node.type);
                                    setExpandedCategory(null);
                                }, onMouseEnter: function () { return setHoveredNode(node.type); }, onMouseLeave: function () { return setHoveredNode(null); }, children: [_jsx(node.icon, { className: "w-4 h-4" }), _jsx("span", { children: node.label }), hoveredNode === node.type && (_jsx("div", { className: "absolute right-[-220px] top-0 w-[200px] p-2 bg-gray-50 border border-gray-200 rounded-md shadow-md", children: _jsx("p", { className: "text-sm", children: node.description }) }))] }, node.type)); }) }))] }, category.name)); })] }) }));
};
