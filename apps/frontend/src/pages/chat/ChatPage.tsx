import React, { useState, useEffect, useRef, useCallback, createContext, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Settings, Play, Pause, Download, Sparkles, Copy, X, Lightbulb, Bot, RefreshCw, Users, Zap, Eraser } from 'lucide-react';
import { chatApiService, type Message, type ChatAgent, type ConversationRule, type SynthesisJob } from '../../services/chatApi';

// Context for shared state
const ChatContext = createContext<any>(null);

// Enhanced Chat Provider Component
const EnhancedChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [agents, setAgents] = useState<ChatAgent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [rules, setRules] = useState<ConversationRule[]>([]);
  const [synthesisJobs, setSynthesisJobs] = useState<SynthesisJob[]>([]);
  const [conversationGoal, setConversationGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutomating, setIsAutomating] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [isPaused, setIsPaused] = useState(true);
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);
  const [voices, setVoices] = useState<any[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Load voices for TTS
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis?.getVoices() || [];
      setVoices(availableVoices.map(v => ({ 
        name: v.name, 
        lang: v.lang,
        voice: v
      })));
    };
    
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
      setTimeout(loadVoices, 100);
    }
  }, []);

  // Text-to-speech function
  const speak = useCallback((text: string, voiceName?: string) => {
    return new Promise<void>((resolve) => {
      if (!isTtsEnabled || !text || typeof text !== 'string' || text.trim() === '') {
        resolve();
        return;
      }
      
      const allVoices = window.speechSynthesis?.getVoices() || [];
      if (allVoices.length === 0) {
        resolve();
        return;
      }
      
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      
      const utterance = new SpeechSynthesisUtterance(text.replace(/\*/g, ''));
      utterance.voice = allVoices.find(v => v.name === voiceName) || 
                       allVoices.find(v => v.lang.startsWith('en') && v.default) || 
                       allVoices[0];
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      
      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch (error) {
          console.warn('TTS failed:', error);
          resolve();
        }
      }, 100);
    });
  }, [isTtsEnabled]);

  // API call functions using the backend service
  const callTextApi = useCallback(async (prompt: string, systemPrompt = "You are a helpful assistant.") => {
    try {
      return await chatApiService.callTextApi(prompt, systemPrompt);
    } catch (error) {
      console.error('Text API error:', error);
      return 'I apologize, but I encountered an error while processing your request.';
    }
  }, []);

  const addMessage = useCallback(async (message: Omit<Message, 'id'>) => {
    try {
      // Add to local state immediately for real-time UI
      const newMessage = {
        ...message,
        id: Date.now().toString()
      };
      setMessages(prev => [...prev, newMessage]);
      
      // Sync with backend if we have a chat ID
      if (currentChatId) {
        await chatApiService.addMessage(currentChatId, message);
      }
      
      return newMessage;
    } catch (error) {
      console.error('Error adding message:', error);
      return {
        ...message,
        id: Date.now().toString()
      };
    }
  }, [currentChatId, setMessages]);

  const getAgentById = useCallback((id: string) => {
    return agents.find(a => a.id === id);
  }, [agents]);

  const contextValue = {
    agents, setAgents,
    messages, setMessages,
    rules, setRules,
    synthesisJobs, setSynthesisJobs,
    conversationGoal, setConversationGoal,
    isGenerating, setIsGenerating,
    isAutomating, setIsAutomating,
    isSynthesizing, setIsSynthesizing,
    mode, setMode,
    isPaused, setIsPaused,
    isTtsEnabled, setIsTtsEnabled,
    voices,
    speak,
    callTextApi,
    addMessage,
    getAgentById,
    currentChatId,
    setCurrentChatId
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

function ChatPage() {
  const [newMessage, setNewMessage] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('general');
  const [loading, setLoading] = useState(true);
  const [senderId, setSenderId] = useState('You');
  const [recipientAgentId, setRecipientAgentId] = useState('');
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    agents, setAgents,
    messages, setMessages,
    rules,
    conversationGoal, setConversationGoal,
    isGenerating, setIsGenerating,
    isAutomating, setIsAutomating,
    isSynthesizing,
    mode, setMode,
    isPaused, setIsPaused,
    isTtsEnabled, setIsTtsEnabled,
    voices,
    speak,
    callTextApi,
    addMessage,
    getAgentById,
    currentChatId,
    setCurrentChatId
  } = useContext(ChatContext) || {};

  // Initialize default agents if none exist
  useEffect(() => {
    if (agents && agents.length === 0) {
      const defaultAgents: ChatAgent[] = [
        {
          id: 'general',
          name: 'General Assistant',
          avatar: '🤖',
          status: 'online',
          type: 'assistant',
          systemPrompt: 'You are a helpful general assistant.',
          model: 'GPT-4',
          voice: voices[0]?.name || ''
        },
        {
          id: 'codehelper',
          name: 'Code Helper',
          avatar: '👨‍💻',
          status: 'online',
          type: 'specialist',
          systemPrompt: 'You are a coding specialist who helps with programming questions.',
          model: 'GPT-4',
          voice: voices[0]?.name || ''
        },
        {
          id: 'dataanalyst',
          name: 'Data Analyst',
          avatar: '📊',
          status: 'online',
          type: 'specialist',
          systemPrompt: 'You are a data analysis expert.',
          model: 'Claude-3',
          voice: voices[0]?.name || ''
        },
        {
          id: 'support',
          name: 'Support Agent',
          avatar: '🛠️',
          status: 'busy',
          type: 'admin',
          systemPrompt: 'You provide technical support and help resolve issues.',
          model: 'GPT-3.5',
          voice: voices[0]?.name || ''
        }
      ];
      setAgents(defaultAgents);
    }
  }, [agents, setAgents, voices]);

  // Initialize with welcome messages if messages are empty
  useEffect(() => {
    if (messages && messages.length === 0) {
      setTimeout(() => {
        addMessage({
          content: 'Hello! I\'m your General Assistant. How can I help you today?',
          sender: 'agent',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          agentId: 'general',
          agentName: 'General Assistant',
          agentAvatar: '🤖',
          type: 'text'
        });
        addMessage({
          content: 'Welcome to The New Fuse Enhanced Chat! You can now interact with multiple AI agents simultaneously, set conversation goals, and use automation features.',
          sender: 'system',
          timestamp: new Date(Date.now() - 240000).toISOString(),
          type: 'text'
        });
        setLoading(false);
      }, 1000);
    } else if (messages) {
      setLoading(false);
    }
  }, [messages, addMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-response logic for multi-agent conversations
  useEffect(() => {
    if (mode !== 'auto' || isGenerating || !messages || messages.length === 0 || isPaused) {
      return;
    }
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.sender === 'You' || lastMessage.sender === 'system' || !lastMessage.agentId) {
      return;
    }
    
    const nextRule = rules?.find(rule => rule.sourceId === lastMessage.agentId);
    if (!nextRule?.targetId) return;
    
    const nextAgent = getAgentById(nextRule.targetId);
    if (!nextAgent) return;
    
    const timeoutId = setTimeout(async () => {
      try {
        setIsGenerating(true);
        const history = messages.slice(-10).map(m => `${m.sender}: ${m.content}`).join('\n');
        const goalPrompt = conversationGoal ? `The current conversation goal is: "${conversationGoal}".` : '';
        const finalPrompt = `${goalPrompt}\n\nPrevious conversation:\n${history}\n\nYour turn, ${nextAgent.name}. What is your response? Keep it conversational and concise.`;
        
        const botText = await callTextApi(finalPrompt, nextAgent.systemPrompt);
        await addMessage({ 
          content: botText, 
          sender: 'agent', 
          timestamp: new Date().toISOString(),
          agentId: nextAgent.id,
          agentName: nextAgent.name,
          agentAvatar: nextAgent.avatar,
          type: 'text'
        });
        
        await speak(botText, nextAgent.voice);
      } catch (error) {
        console.error('Auto-response error:', error);
      } finally {
        setIsGenerating(false);
      }
    }, 1500);
    
    return () => clearTimeout(timeoutId);
  }, [mode, messages, rules, isGenerating, isPaused, conversationGoal, getAgentById, callTextApi, addMessage, speak]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !recipientAgentId) return;
    
    const respondingAgent = getAgentById(recipientAgentId);
    if (!respondingAgent) return;
    
    const userMessage = { 
      content: newMessage, 
      sender: senderId === 'You' ? 'You' : getAgentById(senderId)?.name || 'You',
      timestamp: new Date().toISOString(),
      type: 'text' as const
    };
    setNewMessage('');
    
    try {
      await addMessage(userMessage);
      setIsGenerating(true);
      
      const history = [...messages, userMessage].slice(-10)
        .map(m => `${m.sender}: ${m.content}`)
        .join('\n');
        
      const goalPrompt = conversationGoal ? `The current conversation goal is: "${conversationGoal}".` : '';
      const finalPrompt = `${goalPrompt}\n\nPrevious conversation:\n${history}\n\nYour turn, ${respondingAgent.name}. What is your response?`;
      
      const botText = await callTextApi(finalPrompt, respondingAgent.systemPrompt);
      await addMessage({ 
        content: botText, 
        sender: 'agent',
        timestamp: new Date().toISOString(),
        agentId: respondingAgent.id,
        agentName: respondingAgent.name,
        agentAvatar: respondingAgent.avatar,
        type: 'text'
      });
      
      await speak(botText, respondingAgent.voice);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsGenerating(false);
    }
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
            <button 
              onClick={() => setIsAgentModalOpen(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
            >
              <Users size={16} className="mr-2" />
              Agents ({agents?.length || 0})
            </button>
            <button 
              onClick={() => setIsGoalModalOpen(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center"
            >
              <Lightbulb size={16} className="mr-2" />
              Set Goal
            </button>
            <button 
              onClick={() => setIsRuleModalOpen(true)}
              className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center"
            >
              <Copy size={16} className="mr-2" />
              Rules
            </button>
            <button 
              className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors flex items-center"
              disabled={isSynthesizing}
            >
              <Sparkles size={16} className="mr-2" />
              {isSynthesizing ? 'Synthesizing...' : 'Creative Synthesis'}
            </button>
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

            {/* Enhanced Controls */}
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Conversation Controls</h3>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Mode:</span>
                <button 
                  onClick={() => setMode(mode === 'manual' ? 'auto' : 'manual')}
                  className={`px-3 py-1 rounded-full text-sm ${mode === 'auto' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  {mode === 'auto' ? 'Auto' : 'Manual'}
                </button>
              </div>
              
              {mode === 'auto' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto-responses:</span>
                  <button 
                    onClick={() => setIsPaused(!isPaused)}
                    className="p-2 text-gray-400 hover:text-white rounded-full"
                  >
                    {isPaused ? <Play size={16} /> : <Pause size={16} />}
                  </button>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Text-to-Speech:</span>
                <button 
                  onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                  className={`px-3 py-1 rounded-full text-sm ${isTtsEnabled ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                >
                  {isTtsEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              
              <div className="space-y-2">
                <Link
                  to="/agents"
                  className="block w-full text-left p-2 text-sm text-purple-600 hover:bg-purple-50 rounded"
                >
                  🤖 Manage All Agents
                </Link>
                <Link
                  to="/agents/new"
                  className="block w-full text-left p-2 text-sm text-green-600 hover:bg-green-50 rounded"
                >
                  ➕ Create New Agent
                </Link>
                <Link
                  to="/tasks/new"
                  className="block w-full text-left p-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
                >
                  📋 Create Task
                </Link>
                <button
                  onClick={() => setIsGalleryOpen(true)}
                  className="block w-full text-left p-2 text-sm text-green-600 hover:bg-green-50 rounded"
                >
                  🎬 Synthesis Gallery
                </button>
              </div>
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
              
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">🤖</span>
                      <span className="text-xs font-medium text-gray-600">
                        Agent thinking...
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

            {/* Enhanced Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <label className="text-sm">From:</label>
                <select 
                  value={senderId}
                  onChange={e => setSenderId(e.target.value)}
                  className="flex-1 p-2 border rounded-lg bg-gray-50 border-gray-300 text-sm"
                >
                  <option value="You">You</option>
                  {agents?.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                
                <label className="text-sm">To:</label>
                <select 
                  value={recipientAgentId}
                  onChange={e => setRecipientAgentId(e.target.value)}
                  className="flex-1 p-2 border rounded-lg bg-gray-50 border-gray-300 text-sm"
                >
                  <option value="">Select Agent</option>
                  {agents?.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isGenerating ? "Thinking..." : "Type a message..."}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isGenerating || !agents || agents.length === 0}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isGenerating || !agents || agents.length === 0 || !recipientAgentId}
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

// Wrap the main component with the enhanced provider
const WrappedChatPage = () => (
  <EnhancedChatProvider>
    <ChatPage />
  </EnhancedChatProvider>
);

export default WrappedChatPage;
