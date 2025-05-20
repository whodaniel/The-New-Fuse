"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskBoard = TaskBoard;
import react_1 from 'react';
import card_1 from '@/components/ui/card';
import button_1 from '@/components/ui/button';
import input_1 from '@/components/ui/input';
import scroll_area_1 from '@/components/ui/scroll-area';
import draggable_1 from '@/components/ui/draggable';
import websocket_1 from '../services/websocket.js';
function TaskBoard() {
    const [tasks, setTasks] = (0, react_1.useState)([]);
    const [newTaskTitle, setNewTaskTitle] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        websocket_1.webSocketService.on('tasksUpdate', (updatedTasks) => {
            setTasks(updatedTasks);
        });
        return () => {
            websocket_1.webSocketService.off('tasksUpdate', () => { });
        };
    }, []);
    const handleAddTask = () => {
        if (newTaskTitle.trim()) {
            const newTask = {
                id: `task_${Date.now()}`,
                title: newTaskTitle,
                status: 'todo'
            };
            websocket_1.webSocketService.send('addTask', newTask);
            setNewTaskTitle('');
        }
    };
    const handleDragEnd = (taskId, newStatus) => {
        websocket_1.webSocketService.send('updateTaskStatus', { taskId, newStatus });
    };
    return (<card_1.Card className="w-full h-full">
      <card_1.CardHeader>
        <card_1.CardTitle>Task Board</card_1.CardTitle>
      </card_1.CardHeader>
      <card_1.CardContent className="flex flex-col h-full">
        <div className="flex space-x-2 mb-4">
          <input_1.Input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="New task title" onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}/>
          <button_1.Button onClick={handleAddTask}>Add Task</button_1.Button>
        </div>
        <div className="flex-grow flex space-x-4">
          {['todo', 'inProgress', 'done'].map((status) => (<div key={status} className="flex-1 bg-gray-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">
                {status === 'todo' ? 'To Do' : status === 'inProgress' ? 'In Progress' : 'Done'}
              </h3>
              <scroll_area_1.ScrollArea className="h-full">
                {tasks
                .filter((task) => task.status === status)
                .map((task) => (<draggable_1.Draggable key={task.id} id={task.id} onDragEnd={(newStatus) => handleDragEnd(task.id, newStatus)}>
                      <card_1.Card className="mb-2 p-2">
                        <p>{task.title}</p>
                      </card_1.Card>
                    </draggable_1.Draggable>))}
              </scroll_area_1.ScrollArea>
            </div>))}
        </div>
      </card_1.CardContent>
    </card_1.Card>);
}
export {};
//# sourceMappingURL=task-board.js.map