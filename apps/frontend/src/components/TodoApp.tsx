Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
import { Todo } from '../../../../packages/types/src/types'; // Import Todo interface
const TodoApp = () => {
    const [todos, setTodos] = (0, react_1.useState)([]);
    const [newTodo, setNewTodo] = (0, react_1.useState)('');
    const addTodo = () => {
        if (newTodo.trim() !== '') {
            const newTodoItem = {
                id: Date.now().toString(),
                title: newTodo,
                description: '',
                status: 'TODO',
                createdAt: new Date(),
            };
            setTodos([...todos, newTodoItem]);
            setNewTodo('');
        }
    };
    const toggleTodo = (id) => {
        const newTodos = todos.map(todo => todo.id === id ? Object.assign(Object.assign({}, todo), { status: todo.status === 'TODO' ? 'DONE' : 'TODO' }) : todo);
        setTodos(newTodos);
    };
    const removeTodo = (id) => {
        const newTodos = todos.filter(todo => todo.id !== id);
        setTodos(newTodos);
    };
    return (<div>
      <h1>Todo App</h1>
      <input type="text" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} placeholder="Add a new todo"/>
      <button onClick={addTodo}>Add</button>
      <ul>
        {todos.map((todo) => (<li key={todo.id}>
            <span style={{ textDecoration: todo.status === 'DONE' ? 'line-through' : 'none' }} onClick={() => toggleTodo(todo.id)}>
              {todo.title}
            </span>
            <button onClick={() => removeTodo(todo.id)}>Remove</button>
          </li>))}
      </ul>
    </div>);
};
exports.default = TodoApp;
export {};
//# sourceMappingURL=TodoApp.js.map