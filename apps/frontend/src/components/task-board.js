"use strict";
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskBoard = TaskBoard;
import react_1 from 'react';
import card_1 from '@/components/ui/card';
import button_1 from '@/components/ui/button';
import input_1 from '@/components/ui/input';
import scroll_area_1 from '@/components/ui/scroll-area';
import draggable_1 from '@/components/ui/draggable';
import websocket_1 from '../services/websocket';
function TaskBoard() {
    var _a = (0, react_1.useState)([]), tasks = _a[0], setTasks = _a[1];
    var _b = (0, react_1.useState)(''), newTaskTitle = _b[0], setNewTaskTitle = _b[1];
    (0, react_1.useEffect)(function () {
        websocket_1.webSocketService.on('tasksUpdate', function (updatedTasks) {
            setTasks(updatedTasks);
        });
        return function () {
            websocket_1.webSocketService.off('tasksUpdate', function () { });
        };
    }, []);
    var handleAddTask = function () {
        if (newTaskTitle.trim()) {
            var newTask = {
                id: "task_".concat(Date.now()),
                title: newTaskTitle,
                status: 'todo'
            };
            websocket_1.webSocketService.send('addTask', newTask);
            setNewTaskTitle('');
        }
    };
    var handleDragEnd = function (taskId, newStatus) {
        websocket_1.webSocketService.send('updateTaskStatus', { taskId: taskId, newStatus: newStatus });
    };
    return (_jsxs(card_1.Card, { className: "w-full h-full", children: [_jsx(card_1.CardHeader, { children: _jsx(card_1.CardTitle, { children: "Task Board" }) }), _jsxs(card_1.CardContent, { className: "flex flex-col h-full", children: [_jsxs("div", { className: "flex space-x-2 mb-4", children: [_jsx(input_1.Input, { value: newTaskTitle, onChange: function (e) { return setNewTaskTitle(e.target.value); }, placeholder: "New task title", onKeyPress: function (e) { return e.key === 'Enter' && handleAddTask(); } }), _jsx(button_1.Button, { onClick: handleAddTask, children: "Add Task" })] }), _jsx("div", { className: "flex-grow flex space-x-4", children: ['todo', 'inProgress', 'done'].map(function (status) { return (_jsxs("div", { className: "flex-1 bg-gray-100 p-4 rounded-lg", children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: status === 'todo' ? 'To Do' : status === 'inProgress' ? 'In Progress' : 'Done' }), _jsx(scroll_area_1.ScrollArea, { className: "h-full", children: tasks
                                        .filter(function (task) { return task.status === status; })
                                        .map(function (task) { return (_jsx(draggable_1.Draggable, { id: task.id, onDragEnd: function (newStatus) { return handleDragEnd(task.id, newStatus); }, children: _jsx(card_1.Card, { className: "mb-2 p-2", children: _jsx("p", { children: task.title }) }) }, task.id)); }) })] }, status)); }) })] })] }));
}
