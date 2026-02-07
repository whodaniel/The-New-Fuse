import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="arcade-container">
      <h1>🕹️ AI Arcade</h1>
      <div className="card">
        <p>
          Welcome to the future of AI interaction.
        </p>
        <button onClick={() => setCount((count) => count + 1)}>
          Insert Coin ({count})
        </button>
      </div>
      <p className="read-the-docs">
        Powered by The New Fuse
      </p>
    </div>
  )
}

export default App
