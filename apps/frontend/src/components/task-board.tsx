'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { webSocketService } from '../services/websocket';
import { Draggable } from './ui/draggable';
import { ScrollArea } from './ui/scroll-area';

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'inProgress' | 'done';
}

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    webSocketService.on('tasksUpdate', (updatedTasks: Task[]) => {
      setTasks(updatedTasks);
    });
    return () => {
      webSocketService.off('tasksUpdate', () => {});
    };
  }, []);

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      const newTask = {
        id: `task_${Date.now()}`,
        title: newTaskTitle,
        status: 'todo',
      };
      webSocketService.send('addTask', newTask);
      setNewTaskTitle('');
    }
  };

  const handleDragEnd = (taskId: string, newStatus: string) => {
    webSocketService.send('updateTaskStatus', { taskId, newStatus });
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>Task Board</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-full">
        <div className="flex space-x-2 mb-4">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="New task title"
            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
          />
          <Button onClick={handleAddTask}>Add Task</Button>
        </div>
        <div className="flex-grow flex space-x-4">
          {['todo', 'inProgress', 'done'].map((status) => (
            <div key={status} className="flex-1 bg-gray-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">
                {status === 'todo' ? 'To Do' : status === 'inProgress' ? 'In Progress' : 'Done'}
              </h3>
              <ScrollArea className="h-full">
                {tasks
                  .filter((task) => task.status === status)
                  .map((task) => (
                    <Draggable
                      key={task.id}
                      id={task.id}
                      onDragEnd={(newStatus) => handleDragEnd(task.id, newStatus)}
                    >
                      <Card className="mb-2 p-2">
                        <p>{task.title}</p>
                      </Card>
                    </Draggable>
                  ))}
              </ScrollArea>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
