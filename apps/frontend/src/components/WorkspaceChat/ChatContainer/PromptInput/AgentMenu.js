import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Bot, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
var AgentMenu = function (_a) {
    var _b;
    var _c = _a.selectedAgent, selectedAgent = _c === void 0 ? 'default' : _c, onAgentChange = _a.onAgentChange, className = _a.className;
    var agents = [
        { id: 'default', name: 'Default Agent', icon: Bot },
        { id: 'coder', name: 'Code Assistant', icon: Bot },
        { id: 'analyst', name: 'Data Analyst', icon: Bot },
    ];
    return (_jsx("div", { className: cn("relative", className), children: _jsxs("button", { className: "flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-md transition-colors", onClick: function () {
                // Basic toggle for now - can be expanded to dropdown
                if (onAgentChange) {
                    var nextAgent = selectedAgent === 'default' ? 'coder' : 'default';
                    onAgentChange(nextAgent);
                }
            }, children: [_jsx(Bot, { className: "w-4 h-4" }), _jsx("span", { children: ((_b = agents.find(function (a) { return a.id === selectedAgent; })) === null || _b === void 0 ? void 0 : _b.name) || 'Select Agent' }), _jsx(ChevronDown, { className: "w-3 h-3" })] }) }));
};
// AvailableAgents component for the dropdown
export var AvailableAgents = function (_a) {
    var showing = _a.showing, setShowing = _a.setShowing, sendCommand = _a.sendCommand, _promptRef = _a.promptRef;
    var agents = [
        { id: 'default', name: 'Default Agent', command: '@default' },
        { id: 'coder', name: 'Code Assistant', command: '@coder' },
        { id: 'analyst', name: 'Data Analyst', command: '@analyst' },
    ];
    if (!showing)
        return null;
    return (_jsx("div", { className: "absolute bottom-full mb-2 left-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2 min-w-[200px]", children: agents.map(function (agent) { return (_jsx("button", { className: "w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md", onClick: function () {
                sendCommand(agent.command);
                setShowing(false);
            }, children: agent.name }, agent.id)); }) }));
};
// AvailableAgentsButton component
export var AvailableAgentsButton = function (_a) {
    var showing = _a.showing, setShowAgents = _a.setShowAgents;
    return (_jsx("button", { className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors", onClick: function () { return setShowAgents(!showing); }, title: "Select agent", children: _jsx(Bot, { className: "w-4 h-4" }) }));
};
// Hook for managing agent state
export var useAvailableAgents = function () {
    var _a = useState(false), showAgents = _a[0], setShowAgents = _a[1];
    return { showAgents: showAgents, setShowAgents: setShowAgents };
};
export default AgentMenu;
