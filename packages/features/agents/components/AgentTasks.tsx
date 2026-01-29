'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React, { useEffect, useState } from 'react';
import { AgentTask } from './types';

interface AgentTasksProps {
  agentId: string;
}

export const AgentTasks: React.FC<AgentTasksProps> = ({ agentId }) => {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`/api/agents/${agentId}/tasks`);
        const data = await response.json();
        setTasks(data);
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [agentId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded" />
            <div className="h-20 bg-gray-200 rounded" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Tasks</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {tasks.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No tasks available</p>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{task.type}</h4>
                    <Badge variant="outline" className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-gray-500">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </div>
                    <div className={`font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority} priority
                    </div>
                  </div>
                </div>
                {task.output && (
                  <div className="mt-3">
                    <div className="text-sm font-medium mb-1">Output:</div>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(task.output, null, 2)}
                    </pre>
                  </div>
                )}
                {task.error && (
                  <div className="mt-3 p-2 bg-red-50 text-red-700 rounded text-sm">
                    <span className="font-medium">Error:</span> {task.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
