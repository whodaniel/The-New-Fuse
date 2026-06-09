import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge } from '../components/Badge/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card/Card';
import { AGENT_EMOJIS, STATUS_COLORS, useTNFAgentStatus } from '../hooks/useTNFAgentStatus';
export const TNFAgentGrid = () => {
    const { data, loading, error } = useTNFAgentStatus(5000);
    if (loading) {
        return (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [1, 2, 3, 4].map((i) => (_jsx(Card, { className: "animate-pulse", children: _jsx(CardContent, { className: "h-32" }) }, i))) }));
    }
    if (error) {
        return (_jsx(Card, { className: "border-red-500", children: _jsx(CardContent, { className: "text-red-500 p-4", children: "Failed to connect to TNF Agent Registry" }) }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-4 text-sm text-gray-500", children: [_jsxs("span", { children: ["\uD83E\uDD16 ", data?.totalAgents, " Agents"] }), _jsxs("span", { children: ["\u26A1 ", data?.activeSessions, " Active"] }), _jsxs("span", { children: ["\uD83D\uDCCB ", data?.queuedTasks, " Queued Tasks"] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: data?.agents.map((agent) => (_jsxs(Card, { className: "hover:shadow-lg transition-shadow", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [_jsx("span", { className: "text-2xl", children: AGENT_EMOJIS[agent.name] || '🤖' }), agent.name] }), _jsx("div", { className: `w-3 h-3 rounded-full ${STATUS_COLORS[agent.status] || 'bg-gray-500'}`, title: agent.status })] }) }), _jsxs(CardContent, { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: agent.status === 'idle' ? 'success' : 'warning', children: agent.status }), agent.currentTask && (_jsx("span", { className: "text-xs text-gray-500 truncate", children: agent.currentTask }))] }), agent.capabilities.length > 0 && (_jsxs("div", { className: "flex flex-wrap gap-1", children: [agent.capabilities.slice(0, 3).map((cap) => (_jsx("span", { className: "text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded", children: cap }, cap))), agent.capabilities.length > 3 && (_jsxs("span", { className: "text-xs text-gray-400", children: ["+", agent.capabilities.length - 3] }))] })), _jsxs("div", { className: "text-xs text-gray-400", children: ["Last seen: ", new Date(agent.lastHeartbeat).toLocaleTimeString()] })] })] }, agent.id))) })] }));
};
export default TNFAgentGrid;
