import React from 'react';
import { A2AProvider, useA2AAgents, useA2AMessages } from '../index';

const ChatComponent: React.FC = () => {
  const { agents } = useA2AAgents();
  const { messages, sendMessage } = useA2AMessages();

  const handleSendMessage = () => {
    sendMessage({
      type: 'REQUEST',
      fromAgent: 'user',
      toAgent: 'assistant',
      payload: { text: 'Hello, how can you help me?' }
    });
  };

  return (
    <div>
      <h2>Available Agents</h2>
      <ul>
        {agents.map(agent => (
          <li key={agent.id}>{agent.name} - {agent.status}</li>
        ))}
      </ul>
      
      <h2>Messages</h2>
      <div>
        {messages.map(message => (
          <div key={message.id}>
            <strong>{message.fromAgent} → {message.toAgent}:</strong>
            <pre>{JSON.stringify(message.payload, null, 2)}</pre>
          </div>
        ))}
      </div>
      
      <button onClick={handleSendMessage}>Send Test Message</button>
    </div>
  );
};

const ChatExample: React.FC = () => {
  return (
    <A2AProvider url="ws://localhost:8080">
      <ChatComponent />
    </A2AProvider>
  );
};

export default ChatExample;