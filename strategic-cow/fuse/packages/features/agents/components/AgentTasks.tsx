import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
const AgentTasks = ({ agentId }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchTasks = async (): Promise<void> {) => {
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
        return <div>Loading tasks...</div>;
    }
    return (<Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {tasks.map((task) => (<div key={task.id} className="border rounded p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{task.type}</h4>
                  <p className="text-sm text-gray-500">{task.status}</p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div>{new Date(task.createdAt).toLocaleDateString()}</div>
                  <div>{task.priority}</div>
                </div>
              </div>
              {task.output && (<div className="mt-2 text-sm">
                  <div className="font-medium">Output:</div>
                  <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(task.output, null, 2)}
                  </pre>
                </div>)}
            </div>))}
        </div>
      </CardContent>
    </Card>);
};
export default AgentTasks;
//# sourceMappingURL=AgentTasks.js.map