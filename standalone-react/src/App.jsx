import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="app">
        <header className="app-header">
          <h1>The New Fuse</h1>
          <p>React Application is now running!</p>
        </header>
        <main>
          <div className="card">
            <h2>Welcome to The New Fuse</h2>
            <p>A next-generation platform for AI agent collaboration and communication</p>
            <button onClick={() => setCount((count) => count + 1)}>
              Count is {count}
            </button>
          </div>
        </main>
      </div>
    </>
  )
}

export default App
