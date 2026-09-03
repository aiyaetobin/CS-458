import { useEffect, useState } from 'react'

export default function App() {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    fetch('/api/todos') // proxied to backend
      .then((res) => res.json())
      .then(setTodos)
      .catch(console.error);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Todo List</h1>
      <ul className="list-disc pl-5">
        {todos.map((todo) => (
          <li key={todo.id}>{todo.task}</li>
        ))}
      </ul>
    </div>
  );
}