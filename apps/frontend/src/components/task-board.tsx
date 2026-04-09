'use client';
import { GlassCard, PremiumButton, PremiumInput } from '@/components/ui/premium';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { webSocketService } from '../services/websocket';
import { Draggable } from './ui/draggable';
import { ScrollArea } from './ui/scroll-area';

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'inProgress' | 'done';
}

// ⚡ Bolt: Extract Draggable inner component and wrap in React.memo to prevent O(n) renders
// on high-frequency state updates like input changes.
const TaskItem = React.memo(({ task, onDragEnd }: { task: Task; onDragEnd: (taskId: string, status: string) => void }) => {
  const handleDragEnd = useCallback(
    (newStatus: string) => {
      onDragEnd(task.id, newStatus);
    },
    [onDragEnd, task.id]
  );

  return (
    <Draggable id={task.id} onDragEnd={handleDragEnd}>
      <GlassCard className="mb-2 p-2">
        <p>{task.title}</p>
      </GlassCard>
    </Draggable>
  );
});
TaskItem.displayName = 'TaskItem';

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

  const handleAddTask = useCallback(() => {
    if (newTaskTitle.trim()) {
      const newTask = {
        id: `task_${Date.now()}`,
        title: newTaskTitle,
        status: 'todo',
      };
      webSocketService.send('addTask', newTask);
      setNewTaskTitle('');
    }
  }, [newTaskTitle]);

  const handleDragEnd = useCallback((taskId: string, newStatus: string) => {
    webSocketService.send('updateTaskStatus', { taskId, newStatus });
  }, []);

  // ⚡ Bolt: Memoize the grouped tasks so filtering doesn't re-run O(n) on keystrokes
  const tasksByStatus = useMemo(() => {
    return {
      todo: tasks.filter((t) => t.status === 'todo'),
      inProgress: tasks.filter((t) => t.status === 'inProgress'),
      done: tasks.filter((t) => t.status === 'done'),
    };
  }, [tasks]);

  return (
    <GlassCard title="Task Board" className="w-full h-full">
      <div className="flex space-x-2 mb-4">
        <PremiumInput
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="New task title"
          onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
        />
        <PremiumButton onClick={handleAddTask}>Add Task</PremiumButton>
      </div>
      <div className="flex-grow flex space-x-4">
        {['todo', 'inProgress', 'done'].map((status) => (
          <div key={status} className="flex-1 bg-gray-100 p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-2">
              {status === 'todo' ? 'To Do' : status === 'inProgress' ? 'In Progress' : 'Done'}
            </h3>
            <ScrollArea className="h-full">
              {tasksByStatus[status].map((task) => (
                <TaskItem key={task.id} task={task} onDragEnd={handleDragEnd} />
              ))}
            </ScrollArea>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
