"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
const AgentTasks = ({ agentId }) => {
    const [tasks, setTasks] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const fetchTasks = async () => ;
        () => ;
        () => {
            try {
                const response = await fetch(`/api/agents/${agentId}/tasks`);
                const data = await response.json();
                setTasks(data);
            }
            catch (error) {
                console.error('Failed to fetch tasks:', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, [agentId]);
    if (loading) {
        return Loading;
        tasks;
        /div>;
    }
    return className = "p-4" >
        className;
    "space-y-4" >
        { tasks, : .map((task) => key = { task, : .id }, className = "border rounded p-4 hover:bg-gray-50 transition-colors" >
                className, "flex justify-between items-start" >
                className, "font-medium" > { task, : .type } < /h4>
                < p, className = "text-sm text-gray-500" > { task, : .status } < /p>
                < /div>
                < div, className = "text-right text-sm text-gray-500" >
                { new: Date(task.createdAt).toLocaleDateString() } < /div>
                < div > { task, : .priority } < /div>
                < /div>
                < /div>, { task, : .output && className, "mt-2 text-sm":  >
                    className, "font-medium":  > Output } < /div>
                < pre, className = "bg-gray-100 p-2 rounded mt-1 overflow-x-auto" >
                { JSON, : .stringify(task.output, null, 2) }
                < /pre>
                < /div>) }
        < /div>;
};
/div>
    < /CardContent>
    < /Card>;
;
;
exports.default = AgentTasks;
//# sourceMappingURL=AgentTasks.js.map
//# sourceMappingURL=AgentTasks.js.map