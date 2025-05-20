"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
const AgentLogs = ({ agentId }) => {
    const [logs, setLogs] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const fetchLogs = async () => ;
        () => ;
        () => {
            try {
                const response = await fetch(`/api/agents/${agentId}/logs`);
                const data = await response.json();
                setLogs(data);
            }
            catch (error) {
                console.error('Failed to fetch logs:', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [agentId]);
    if (loading) {
        return Loading;
        logs;
        /div>;
    }
    return className = "p-4" >
        className;
    "space-y-2" >
        { logs, : .map((log) => key = { log, : .id }, className = {} `p-2 rounded ${log.level === 'error'
                ? 'bg-red-100'
                : log.level === 'warn'
                    ? 'bg-yellow-100'
                    : 'bg-gray-100'}`) } >
        className;
    "flex justify-between text-sm" >
        className;
    "font-mono" > { new: Date(log.timestamp).toLocaleString() } < /span>
        < span;
    className = "uppercase text-xs font-bold" > { log, : .level } < /span>
        < /div>
        < div;
    className = "mt-1" > { log, : .message } < /div>
        < /div>;
};
/div>
    < /CardContent>
    < /Card>;
;
;
exports.default = AgentLogs;
//# sourceMappingURL=AgentLogs.js.map
//# sourceMappingURL=AgentLogs.js.map