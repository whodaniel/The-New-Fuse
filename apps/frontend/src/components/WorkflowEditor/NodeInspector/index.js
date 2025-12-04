import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Tab } from '@headlessui/react';
import { ConfigurationPanel } from './ConfigurationPanel';
import { InputsPanel } from './InputsPanel';
import { OutputsPanel } from './OutputsPanel';
import { HistoryPanel } from './HistoryPanel';
export var NodeInspector = function (_a) {
    var node = _a.node, onUpdate = _a.onUpdate;
    return (_jsxs("div", { className: "node-inspector w-80 border-l bg-secondary", children: [_jsxs("div", { className: "p-4 border-b", children: [_jsx("h3", { className: "font-semibold", children: node.data.label }), _jsx("p", { className: "text-sm text-gray-500", children: node.type })] }), _jsxs(Tab.Group, { children: [_jsxs(Tab.List, { className: "flex border-b", children: [_jsx(Tab, { className: "flex-1 p-2 ui-selected:border-b-2 ui-selected:border-primary", children: "Configuration" }), _jsx(Tab, { className: "flex-1 p-2 ui-selected:border-b-2 ui-selected:border-primary", children: "Inputs" }), _jsx(Tab, { className: "flex-1 p-2 ui-selected:border-b-2 ui-selected:border-primary", children: "Outputs" }), _jsx(Tab, { className: "flex-1 p-2 ui-selected:border-b-2 ui-selected:border-primary", children: "History" })] }), _jsxs(Tab.Panels, { className: "overflow-y-auto h-[calc(100vh-200px)]", children: [_jsx(Tab.Panel, { children: _jsx(ConfigurationPanel, { node: node, onUpdate: onUpdate }) }), _jsx(Tab.Panel, { children: _jsx(InputsPanel, { node: node, onUpdate: onUpdate }) }), _jsx(Tab.Panel, { children: _jsx(OutputsPanel, { node: node }) }), _jsx(Tab.Panel, { children: _jsx(HistoryPanel, { nodeId: node.id }) })] })] })] }));
};
