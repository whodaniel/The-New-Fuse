import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ConnectionManager } from '../components/ConnectionManager';
import { StatusMonitor } from '../components/StatusMonitor';
import { ActivityFeed } from '../components/ActivityFeed';
import { AgentWorkflowManager } from '../components/AgentWorkflowManager';
export function WorkflowDashboard() {
    return (_jsxs("div", { className: "container mx-auto p-6", children: [_jsx("h1", { className: "text-2xl font-bold mb-6", children: "Workflow Dashboard" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-6", children: [_jsx(StatusMonitor, {}), _jsx(ConnectionManager, {})] }), _jsxs("div", { className: "space-y-6", children: [_jsx(AgentWorkflowManager, {}), _jsx(ActivityFeed, {})] })] })] }));
}
