import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FaRobot, FaTools, FaCode, FaDatabase, FaGlobe, FaWaveSquare, FaBell, FaSearch, FaFileAlt, FaMemory } from 'react-icons/fa';
// Temporarily commenting out the prompt template node import to debug build issues
// import { PromptTemplateNode as BasePromptTemplateNode } from '@the-new-fuse/prompt-templating';
// Wrapper for the prompt template node to match React Flow's expected interface
// const PromptTemplateNodeWrapper = ({ data, id, selected }) => {
//   return (
//     <BasePromptTemplateNode
//       id={id}
//       data={data}
//       selected={selected}
//     />
//   );
// };
// Standard workflow node component
export var StandardNode = function (_a) {
    var data = _a.data;
    return (_jsx("div", { className: "px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "rounded-full w-12 h-12 flex justify-center items-center bg-gray-100", children: data.icon && _jsx(data.icon, {}) }), _jsxs("div", { className: "ml-2", children: [_jsx("div", { className: "text-lg font-bold", children: data.label }), _jsx("div", { className: "text-gray-500", children: data.description })] })] }) }));
};
// LLM Node for AI completions
export var LLMNode = function (_a) {
    var data = _a.data;
    return (_jsx("div", { className: "px-4 py-2 shadow-md rounded-md bg-blue-50 border-2 border-blue-400", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "rounded-full w-12 h-12 flex justify-center items-center bg-blue-100", children: _jsx(FaRobot, { className: "text-blue-600" }) }), _jsxs("div", { className: "ml-2", children: [_jsx("div", { className: "text-lg font-bold text-blue-800", children: data.label }), _jsx("div", { className: "text-blue-600", children: data.model || 'Default Model' })] })] }) }));
};
// Tool Node for AI tool execution
export var ToolNode = function (_a) {
    var data = _a.data;
    return (_jsx("div", { className: "px-4 py-2 shadow-md rounded-md bg-green-50 border-2 border-green-400", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "rounded-full w-12 h-12 flex justify-center items-center bg-green-100", children: _jsx(FaTools, { className: "text-green-600" }) }), _jsxs("div", { className: "ml-2", children: [_jsx("div", { className: "text-lg font-bold text-green-800", children: data.label }), _jsx("div", { className: "text-green-600", children: data.tool || 'Select Tool' })] })] }) }));
};
// Data Transform Node
export var TransformNode = function (_a) {
    var data = _a.data;
    return (_jsx("div", { className: "px-4 py-2 shadow-md rounded-md bg-yellow-50 border-2 border-yellow-400", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "rounded-full w-12 h-12 flex justify-center items-center bg-yellow-100", children: _jsx(FaCode, { className: "text-yellow-600" }) }), _jsxs("div", { className: "ml-2", children: [_jsx("div", { className: "text-lg font-bold text-yellow-800", children: data.label }), _jsx("div", { className: "text-yellow-600", children: data.transform || 'Transform Data' })] })] }) }));
};
// Data Source Node
export var DataNode = function (_a) {
    var data = _a.data;
    return (_jsx("div", { className: "px-4 py-2 shadow-md rounded-md bg-purple-50 border-2 border-purple-400", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "rounded-full w-12 h-12 flex justify-center items-center bg-purple-100", children: _jsx(FaDatabase, { className: "text-purple-600" }) }), _jsxs("div", { className: "ml-2", children: [_jsx("div", { className: "text-lg font-bold text-purple-800", children: data.label }), _jsx("div", { className: "text-purple-600", children: data.source || 'Data Source' })] })] }) }));
};
// Storage Node
export var StorageNode = function (_a) {
    var data = _a.data;
    return (_jsx("div", { className: "px-4 py-2 shadow-md rounded-md bg-indigo-50 border-2 border-indigo-400", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "rounded-full w-12 h-12 flex justify-center items-center bg-indigo-100", children: _jsx(FaMemory, { className: "text-indigo-600" }) }), _jsxs("div", { className: "ml-2", children: [_jsx("div", { className: "text-lg font-bold text-indigo-800", children: data.label }), _jsx("div", { className: "text-indigo-600", children: data.storage || 'Store Data' })] })] }) }));
};
// API Node
export var APINode = function (_a) {
    var data = _a.data;
    return (_jsx("div", { className: "px-4 py-2 shadow-md rounded-md bg-cyan-50 border-2 border-cyan-400", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "rounded-full w-12 h-12 flex justify-center items-center bg-cyan-100", children: _jsx(FaGlobe, { className: "text-cyan-600" }) }), _jsxs("div", { className: "ml-2", children: [_jsx("div", { className: "text-lg font-bold text-cyan-800", children: data.label }), _jsx("div", { className: "text-cyan-600", children: data.endpoint || 'API Endpoint' })] })] }) }));
};
// Webhook Node
export var WebhookNode = function (_a) {
    var data = _a.data;
    return (_jsx("div", { className: "px-4 py-2 shadow-md rounded-md bg-orange-50 border-2 border-orange-400", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "rounded-full w-12 h-12 flex justify-center items-center bg-orange-100", children: _jsx(FaWaveSquare, { className: "text-orange-600" }) }), _jsxs("div", { className: "ml-2", children: [_jsx("div", { className: "text-lg font-bold text-orange-800", children: data.label }), _jsx("div", { className: "text-orange-600", children: data.webhook || 'Webhook URL' })] })] }) }));
};
// Notification Node
export var NotificationNode = function (_a) {
    var data = _a.data;
    return (_jsx("div", { className: "px-4 py-2 shadow-md rounded-md bg-red-50 border-2 border-red-400", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "rounded-full w-12 h-12 flex justify-center items-center bg-red-100", children: _jsx(FaBell, { className: "text-red-600" }) }), _jsxs("div", { className: "ml-2", children: [_jsx("div", { className: "text-lg font-bold text-red-800", children: data.label }), _jsx("div", { className: "text-red-600", children: data.channel || 'Notification Channel' })] })] }) }));
};
// Vector Store Node
export var VectorStoreNode = function (_a) {
    var data = _a.data;
    return (_jsx("div", { className: "px-4 py-2 shadow-md rounded-md bg-emerald-50 border-2 border-emerald-400", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "rounded-full w-12 h-12 flex justify-center items-center bg-emerald-100", children: _jsx(FaSearch, { className: "text-emerald-600" }) }), _jsxs("div", { className: "ml-2", children: [_jsx("div", { className: "text-lg font-bold text-emerald-800", children: data.label }), _jsx("div", { className: "text-emerald-600", children: data.vectorStore || 'Vector Database' })] })] }) }));
};
// Document Processing Node
export var DocumentProcessingNode = function (_a) {
    var data = _a.data;
    return (_jsx("div", { className: "px-4 py-2 shadow-md rounded-md bg-slate-50 border-2 border-slate-400", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "rounded-full w-12 h-12 flex justify-center items-center bg-slate-100", children: _jsx(FaFileAlt, { className: "text-slate-600" }) }), _jsxs("div", { className: "ml-2", children: [_jsx("div", { className: "text-lg font-bold text-slate-800", children: data.label }), _jsx("div", { className: "text-slate-600", children: data.processor || 'Document Processor' })] })] }) }));
};
// Condition Node
export var ConditionNode = function (_a) {
    var data = _a.data;
    return (_jsx("div", { className: "px-4 py-2 shadow-md rounded-md bg-amber-50 border-2 border-amber-400", children: _jsxs("div", { className: "flex", children: [_jsx("div", { className: "rounded-full w-12 h-12 flex justify-center items-center bg-amber-100", children: _jsx(FaCode, { className: "text-amber-600" }) }), _jsxs("div", { className: "ml-2", children: [_jsx("div", { className: "text-lg font-bold text-amber-800", children: data.label }), _jsx("div", { className: "text-amber-600", children: data.condition || 'If/Then Logic' })] })] }) }));
};
// Export all node types for ReactFlow
export var nodeTypes = {
    default: StandardNode,
    llm: LLMNode,
    tool: ToolNode,
    transform: TransformNode,
    data: DataNode,
    storage: StorageNode,
    api: APINode,
    webhook: WebhookNode,
    notification: NotificationNode,
    vectorStore: VectorStoreNode,
    documentProcessing: DocumentProcessingNode,
    condition: ConditionNode,
    // promptTemplate: PromptTemplateNodeWrapper, // Temporarily commented out
};
export default nodeTypes;
