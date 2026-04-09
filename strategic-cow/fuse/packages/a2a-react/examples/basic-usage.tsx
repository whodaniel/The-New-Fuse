import React, { useState } from 'react';
import { A2AProvider, useA2AAgents, useA2AMessages, useA2AContext } from '../src';

// Configuration for the A2A connection
const config = {
  url: 'ws://localhost:8080/a2a',
  agentId: 'react-example-app',
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
};

// Agent registration details
const agentRegistration = {
  name: 'React Example App',
  type: 'frontend',
  version: '1.0.0',
  description: 'A React application demonstrating A2A communication',
  capabilities: [
    {
      id: 'chat',
      name: 'Chat Interface',
      description: 'Provides a chat interface for agent communication',
      version: '1.0.0',
    },
  ],
};

// Connection status component
function ConnectionStatus() {
  const { connectionState, connect, disconnect } = useA2AContext();
  
  return (
    <div style={{ padding: '20px', borderBottom: '1px solid #ccc' }}>
      <h3>Connection Status</h3>
      <p>
        Status:{' '}
        <span style={{ color: connectionState.connected ? 'green' : 'red' }}>
          {connectionState.connected ? 'Connected' : 'Disconnected'}
        </span>
      </p>
      {connectionState.error && (
        <p style={{ color: 'red' }}>Error: {connectionState.error}</p>
      )}
      <button onClick={connect} disabled={connectionState.connected}>
        Connect
      </button>
      <button onClick={disconnect} disabled={!connectionState.connected}>
        Disconnect
      </button>
    </div>
  );
}

// Agent list component
function AgentList() {
  const { agents } = useA2AAgents();
  
  return (
    <div style={{ padding: '20px', borderBottom: '1px solid #ccc' }}>
      <h3>Available Agents</h3>
      {agents.length === 0 ? (
        <p>No agents available</p>
      ) : (
        <ul>
          {agents.map(agent => (
            <li key={agent.agentId}>
              <strong>{agent.name}</strong> ({agent.type})
              <br />
              Status: {agent.status}
              <br />
              Capabilities: {agent.capabilities.map(c => c.name).join(', ')}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Chat component
function Chat() {
  const { messages, sendMessage } = useA2AMessages();
  const [input, setInput] = useState('');
  const [targetAgent, setTargetAgent] = useState('');
  
  const handleSend = () => {
    if (!input.trim() || !targetAgent) return;
    
    sendMessage({
      type: 'REQUEST' as any,
      payload: { text: input },
      toAgent: targetAgent,
    });
    setInput('');
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <h3>Chat</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <label>
          Target Agent:
          <input
            type="text"
            value={targetAgent}
            onChange={(e) => setTargetAgent(e.target.value)}
            placeholder="Enter agent ID"
            style={{ marginLeft: '10px' }}
          />
        </label>
      </div>
      
      <div style={{
        height: '300px',
        overflowY: 'scroll',
        border: '1px solid #ccc',
        padding: '10px',
        marginBottom: '10px'
      }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ marginBottom: '10px' }}>
            <strong>{msg.fromAgent} → {msg.toAgent || 'broadcast'}</strong>
            <br />
            <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
            <br />
            {JSON.stringify(msg.payload, null, 2)}
          </div>
        ))}
      </div>
      
      <div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          style={{ width: '300px', marginRight: '10px' }}
        />
        <button onClick={handleSend} disabled={!targetAgent}>
          Send
        </button>
      </div>
    </div>
  );
}

// Main app component
function App() {
  return (
    <A2AProvider 
      config={config} 
      autoConnect 
      autoRegister 
      agentRegistration={agentRegistration}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1>A2A React Example</h1>
        <ConnectionStatus />
        <AgentList />
        <Chat />
      </div>
    </A2AProvider>
  );
}

export default App;