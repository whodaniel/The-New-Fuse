Object.defineProperty(exports, "__esModule", { value: true });
import react_1 from 'react';
const TodoApp = () => {
    const [todos, setTodos] = (0, react_1.useState)([]);
    const [newTodo, setNewTodo] = (0, react_1.useState)('');
    const addTodo = () => {
        if (newTodo.trim() !== '') {
            setTodos([...todos, { text: newTodo, completed: false }]);
            setNewTodo('');
        }
    };
    const toggleTodo = (index) => {
        const newTodos = [...todos];
        newTodos[index].completed = !newTodos[index].completed;
        setTodos(newTodos);
    };
    const removeTodo = (index) => {
        const newTodos = todos.filter((_, i) => i !== index);
        setTodos(newTodos);
    };
    return (<div>
      <h1>Todo App</h1>
      <input type="text" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} placeholder="Add a new todo"/>
      <button onClick={addTodo}>Add</button>
      <ul>
        {todos.map((todo, index) => (<li key={index}>
            <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }} onClick={() => toggleTodo(index)}>
              {todo.text}
            </span>
            <button onClick={() => removeTodo(index)}>Remove</button>
          </li>))}
      </ul>
    </div>);
};
exports.default = TodoApp;
export {};
//# sourceMappingURL=TodoApp.js.map