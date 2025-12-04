var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
var TodoApp = function () {
    var _a = (0, react_1.useState)([]), todos = _a[0], setTodos = _a[1];
    var _b = (0, react_1.useState)(''), newTodo = _b[0], setNewTodo = _b[1];
    var addTodo = function () {
        if (newTodo.trim() !== '') {
            var newTodoItem = {
                id: Date.now().toString(),
                title: newTodo,
                description: '',
                status: 'TODO',
                createdAt: new Date(),
            };
            setTodos(__spreadArray(__spreadArray([], todos, true), [newTodoItem], false));
            setNewTodo('');
        }
    };
    var toggleTodo = function (id) {
        var newTodos = todos.map(function (todo) { return todo.id === id ? Object.assign(Object.assign({}, todo), { status: todo.status === 'TODO' ? 'DONE' : 'TODO' }) : todo; });
        setTodos(newTodos);
    };
    var removeTodo = function (id) {
        var newTodos = todos.filter(function (todo) { return todo.id !== id; });
        setTodos(newTodos);
    };
    return (_jsxs("div", { children: [_jsx("h1", { children: "Todo App" }), _jsx("input", { type: "text", value: newTodo, onChange: function (e) { return setNewTodo(e.target.value); }, placeholder: "Add a new todo" }), _jsx("button", { onClick: addTodo, children: "Add" }), _jsx("ul", { children: todos.map(function (todo) { return (_jsxs("li", { children: [_jsx("span", { style: { textDecoration: todo.status === 'DONE' ? 'line-through' : 'none' }, onClick: function () { return toggleTodo(todo.id); }, children: todo.title }), _jsx("button", { onClick: function () { return removeTodo(todo.id); }, children: "Remove" })] }, todo.id)); }) })] }));
};
exports.default = TodoApp;
