import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent' | 'system';
  timestamp: string;
  agentName?: string;
  agentAvatar?: string;
  type?: 'text' | 'code' | 'image' | 'file';
}

interface ChatAgent {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy';
  type: 'assistant' | 'specialist' | 'admin';
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('general');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const agents: ChatAgent[] = [
    {
      id: 'general',
      name: 'General Assistant',
      avatar: '🤖',
      status: 'online',
      type: 'assistant'
    },
    {
      id: 'codehelper',
      name: 'Code Helper',
      avatar: '👨‍💻',
      status: 'online',
      type: 'specialist'
    },
    {
      id: 'dataanalyst',
      name: 'Data Analyst',
      avatar: '📊',
      status: 'online',
      type: 'specialist'
    },
    {
      id: 'support',
      name: 'Support Agent',
      avatar: '🛠️',
      status: 'busy',
      type: 'admin'
    }
  ];

  // Mock initial messages
  useEffect(() => {
    setTimeout(() => {
      setMessages([
        {
          id: '1',
          content: 'Hello! I\'m your General Assistant. How can I help you today?',
          sender: 'agent',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          agentName: 'General Assistant',
          agentAvatar: '🤖',
          type: 'text'
        },
        {
          id: '2',
          content: 'Welcome to The New Fuse chat system! You can interact with various AI agents to get help with different tasks.',
          sender: 'system',
          timestamp: new Date(Date.now() - 240000).toISOString(),
          type: 'text'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    // Simulate agent response
    setTimeout(() => {
      const selectedAgentInfo = agents.find(a => a.id === selectedAgent);
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAgentResponse(newMessage, selectedAgent),
        sender: 'agent',
        timestamp: new Date().toISOString(),
        agentName: selectedAgentInfo?.name || 'Assistant',
        agentAvatar: selectedAgentInfo?.avatar || '🤖',
        type: 'text'
      };
      
      setMessages(prev => [...prev, agentResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const generateAgentResponse = (userInput: string, agentId: string): string => {
    const input = userInput.toLowerCase();
    
    switch (agentId) {
      case 'codehelper':
        if (input.includes('code') || input.includes('programming') || input.includes('bug')) {
          return `I can help you with coding! Here are some suggestions:\n\n\`\`\`javascript\n// Example code structure\nfunction solveProblem() {\n  // Your solution here\n  return result;\n}\n\`\`\`\n\nWould you like me to help with a specific programming language or framework?`;
        }
        return 'I\'m the Code Helper! I can assist with programming, debugging, code reviews, and technical implementation. What coding challenge are you working on?';
        
      case 'dataanalyst':
        if (input.includes('data') || input.includes('analytics') || input.includes('chart')) {
          return 'I can help you analyze data and create insights! I can assist with:\n\n• Data visualization\n• Statistical analysis\n• Report generation\n• KPI tracking\n• Trend analysis\n\nWhat kind of data analysis do you need?';
        }
        return 'Hello! I\'m the Data Analyst agent. I specialize in data analysis, visualization, and generating actionable insights from your data. How can I help you today?';
        
      case 'support':
        return 'Hi! I\'m here to provide technical support and help resolve any issues you might be experiencing. Please describe the problem you\'re facing, and I\'ll do my best to assist you.';
        
      default:
        if (input.includes('hello') || input.includes('hi')) {
          return 'Hello! I\'m happy to help you today. I can assist with general questions, provide information about The New Fuse platform, or direct you to the right specialist agent.';
        }
        if (input.includes('task') || input.includes('project')) {
          return 'I can help you with task and project management! Would you like me to:\n\n• Create a new task\n• Check project status\n• Assign team members\n• Set deadlines\n• Track progress\n\nWhat would you like to do?';
        }
        if (input.includes('agent') || input.includes('ai')) {
          return 'I can help you work with AI agents! You can:\n\n• Deploy new agents\n• Monitor agent performance\n• Configure agent settings\n• View agent analytics\n\nWhich agent-related task interests you?';
        }
        return `I understand you said: "${userInput}"\n\nI'm here to help! I can assist with various tasks including:\n• General questions about the platform\n• Task and project management\n• Agent coordination\n• Workspace management\n\nWhat would you like to know more about?`;
    }
  };

  const getStatusBadge = (status: ChatAgent['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'offline':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: ChatAgent['status']) => {
    switch (status) {
      case 'online': return '🟢';
      case 'busy': return '🟡';
      case 'offline': return '⚫';
      default: return '⚪';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">💬 Chat Center</h1>
            <p className="text-gray-600">Communicate with AI agents and get instant help</p>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/multi-agent-chat"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              🤖 Multi-Agent Chat
            </Link>
            <Link
              to="/agents"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              📋 Manage Agents
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Agent Selection Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Agents</h2>
            <div className="space-y-3">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedAgent === agent.id
                      ? 'bg-blue-100 border-blue-200 border-2'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{agent.avatar}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{agent.name}</div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full border ${getStatusBadge(agent.status)}`}>
                          {getStatusIcon(agent.status)} {agent.status}
                        </span>
                        <span className="text-xs text-gray-500">{agent.type}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Quick Actions</h3>
              <Link
                to="/tasks/new"
                className="block w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                📋 Create Task
              </Link>
              <Link
                to="/agents/new"
                className="block w-full text-left p-2 text-sm text-purple-600 hover:bg-purple-50 rounded"
              >
                🤖 Deploy Agent
              </Link>
              <Link
                to="/workspace/analytics"
                className="block w-full text-left p-2 text-sm text-green-600 hover:bg-green-50 rounded"
              >
                📊 View Analytics
              </Link>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-lg flex flex-col h-[600px]">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {agents.find(a => a.id === selectedAgent)?.avatar}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {agents.find(a => a.id === selectedAgent)?.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {agents.find(a => a.id === selectedAgent)?.type} • {' '}
                      <span className={getStatusBadge(agents.find(a => a.id === selectedAgent)?.status || 'offline')}>
                        {agents.find(a => a.id === selectedAgent)?.status}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
                    📎
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded">
                    ⚙️
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.sender === 'system'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                  >
                    {message.sender === 'agent' && (
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{message.agentAvatar}</span>
                        <span className="text-xs font-medium text-gray-600">
                          {message.agentName}
                        </span>
                      </div>
                    )}
                    {message.sender === 'system' && (
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        System Message
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">
                      {message.content.includes('```') ? (
                        <div className="space-y-2">
                          {message.content.split('```').map((part, index) => 
                            index % 2 === 0 ? (
                              <div key={index}>{part}</div>
                            ) : (
                              <div key={index} className="bg-gray-800 text-green-400 p-2 rounded text-sm font-mono overflow-x-auto">
                                {part}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        message.content
                      )}
                    </div>
                    <div
                      className={`text-xs mt-1 ${
                        message.sender === 'user'
                          ? 'text-blue-200'
                          : 'text-gray-500'
                      }`}
                    >
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">
                        {agents.find(a => a.id === selectedAgent)?.avatar}
                      </span>
                      <span className="text-xs font-medium text-gray-600">
                        {agents.find(a => a.id === selectedAgent)?.name}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={`Message ${agents.find(a => a.id === selectedAgent)?.name}...`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isTyping}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>Press Enter to send</span>
                <span>{newMessage.length}/500</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
