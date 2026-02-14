import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AgentListing } from '../services/ArcadeService';
import './AgentSession.css';

interface AgentSessionProps {
  agent: AgentListing;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const AgentSession: React.FC<AgentSessionProps> = ({ agent, onClose }) => {
  const { user, updateTokens } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionTokens, setSessionTokens] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    setMessages([
      {
        id: '1',
        role: 'system',
        content: `🎮 Connected to ${agent.name}. Ready to play! Each interaction costs ${agent.pricePerRun} tokens.`,
        timestamp: new Date(),
      },
    ]);
  }, [agent]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulate agent response (in production, this would call the actual agent API)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const tokenCost = Math.ceil(agent.pricePerRun * 100);
      setSessionTokens((prev) => prev + tokenCost);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateMockResponse(input, agent),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Deduct tokens from user
      if (user) {
        await updateTokens(-tokenCost);
      }
    } catch (error) {
      console.error('Session error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'system',
          content: '❌ Connection error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="session-overlay">
      <div className="session-container">
        <div className="session-header">
          <div className="session-agent-info">
            <div className="session-agent-avatar">{agent.name.charAt(0)}</div>
            <div>
              <h3>{agent.name}</h3>
              <span className="session-status">● ONLINE</span>
            </div>
          </div>
          <div className="session-stats">
            <div className="session-tokens">
              <span className="token-icon">🪙</span>
              <span>{sessionTokens} tokens used</span>
            </div>
            <button className="session-close" onClick={onClose}>
              End Session
            </button>
          </div>
        </div>

        <div className="session-messages">
          {messages.map((message) => (
            <div key={message.id} className={`message message-${message.role}`}>
              <div className="message-content">{message.content}</div>
              <div className="message-time">{message.timestamp.toLocaleTimeString()}</div>
            </div>
          ))}
          {isLoading && (
            <div className="message message-assistant">
              <div className="message-content loading">
                <span className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="session-input-area">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            rows={3}
            disabled={isLoading}
          />
          <button
            className="send-button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? '⏳' : '➤'}
          </button>
        </div>

        <div className="session-footer">
          <span>Cost: {agent.pricePerRun} tokens/message</span>
          {user && <span>Balance: {user.tokens} tokens</span>}
        </div>
      </div>
    </div>
  );
};

// Mock response generator for demo
function generateMockResponse(input: string, agent: AgentListing): string {
  const responses = {
    CODER: [
      `Analyzing your code request: "${input}"\n\nHere's my suggestion:\n\`\`\`javascript\n// Optimized solution\nconst result = input.split('').reverse().join('');\nreturn result;\n\`\`\`\n\nThis approach has O(n) time complexity.`,
      `I've reviewed your request. Here are the key improvements:\n\n1. Use async/await for better readability\n2. Add error handling\n3. Consider memoization for performance\n\nWould you like me to implement these changes?`,
    ],
    ANALYZER: [
      `📊 Data Analysis Results:\n\nBased on your query "${input}", I've identified:\n\n- 3 key patterns\n- 2 potential optimizations\n- 1 anomaly detected\n\nDetailed report available upon request.`,
      `Analysis complete! Here's what I found:\n\n📈 Trend: Upward momentum\n📉 Risk Level: Moderate\n💡 Recommendation: Monitor closely`,
    ],
    STRATEGIST: [
      `Strategic Assessment:\n\nYour query "${input}" suggests a multi-phase approach:\n\nPhase 1: Research & Planning\nPhase 2: Implementation\nPhase 3: Testing & Optimization\n\nShall I elaborate on any phase?`,
      `🎯 Strategic Recommendation:\n\nBased on current parameters, I suggest:\n\n1. Prioritize core functionality\n2. Allocate resources efficiently\n3. Set measurable milestones\n\nExecution timeline: 2-3 weeks`,
    ],
    GENERIC: [
      `I understand you're asking about "${input}". Let me help you with that.\n\nHere's what I can do:\n- Analyze the request\n- Provide recommendations\n- Execute specific tasks\n\nWhat would you like to focus on?`,
      `Processing your request: "${input}"\n\n✅ Task acknowledged\n✅ Resources allocated\n✅ Execution started\n\nResults will be available shortly.`,
    ],
  };

  const agentResponses = responses[agent.type] || responses.GENERIC;
  return agentResponses[Math.floor(Math.random() * agentResponses.length)];
}

export default AgentSession;
