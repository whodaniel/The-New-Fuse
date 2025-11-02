import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, MoreVertical, Users, Settings, Search, Hash, Lock, Globe, Bot, User, Clock, CheckCheck } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    type: 'user' | 'agent';
  };
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
}

interface Workspace {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private';
  members: Array<{
    id: string;
    name: string;
    avatar?: string;
    role: 'owner' | 'admin' | 'member';
    status: 'online' | 'away' | 'offline';
  }>;
  agents: Array<{
    id: string;
    name: string;
    type: string;
    status: 'active' | 'inactive';
  }>;
}

const WorkspaceChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchWorkspaceData();
    fetchMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchWorkspaceData = async () => {
    try {
      // API call to backend workspace controller
      const response = await fetch('/api/workspaces/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWorkspace(data);
      } else {
        // Mock data for development
        setWorkspace({
          id: '1',
          name: 'Product Development',
          description: 'Collaborative workspace for product development team',
          type: 'private',
          members: [
            {
              id: '1',
              name: 'John Doe',
              avatar: '/avatars/john.jpg',
              role: 'owner',
              status: 'online'
            },
            {
              id: '2',
              name: 'Jane Smith',
              avatar: '/avatars/jane.jpg',
              role: 'admin',
              status: 'online'
            },
            {
              id: '3',
              name: 'Mike Johnson',
              role: 'member',
              status: 'away'
            }
          ],
          agents: [
            {
              id: 'agent1',
              name: 'Code Assistant',
              type: 'Development',
              status: 'active'
            },
            {
              id: 'agent2',
              name: 'Project Manager',
              type: 'Management',
              status: 'active'
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error fetching workspace data:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      // API call to backend chat controller
      const response = await fetch('/api/workspaces/1/messages', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        // Mock data for development
        setMessages([
          {
            id: '1',
            content: 'Welcome to the Product Development workspace! Let\'s collaborate on our latest project.',
            sender: {
              id: '1',
              name: 'John Doe',
              type: 'user'
            },
            timestamp: new Date(Date.now() - 3600000),
            status: 'read'
          },
          {
            id: '2',
            content: 'I can help you with code reviews, documentation, and technical analysis. What would you like to work on?',
            sender: {
              id: 'agent1',
              name: 'Code Assistant',
              type: 'agent'
            },
            timestamp: new Date(Date.now() - 3000000),
            status: 'read'
          },
          {
            id: '3',
            content: 'Great! I\'ve uploaded the latest design mockups for review.',
            sender: {
              id: '2',
              name: 'Jane Smith',
              type: 'user'
            },
            timestamp: new Date(Date.now() - 1800000),
            status: 'read',
            attachments: [
              {
                id: 'att1',
                name: 'design-mockups.pdf',
                type: 'application/pdf',
                url: '/files/design-mockups.pdf'
              }
            ]
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: {
        id: 'current-user',
        name: 'You',
        type: 'user'
      },
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    try {
      // API call to send message
      const response = await fetch('/api/workspaces/1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newMessage,
          agentId: selectedAgent
        })
      });

      if (response.ok) {
        const sentMessage = await response.json();
        setMessages(prev => prev.map(msg => 
          msg.id === message.id ? { ...msg, ...sentMessage, status: 'sent' } : msg
        ));

        // If agent is selected, simulate agent response
        if (selectedAgent) {
          setTimeout(() => {
            setIsTyping(true);
            setTimeout(() => {
              const agentResponse: Message = {
                id: Date.now().toString() + '_agent',
                content: `I understand your message: "${newMessage}". How can I assist you further?`,
                sender: {
                  id: selectedAgent,
                  name: workspace?.agents.find(a => a.id === selectedAgent)?.name || 'Agent',
                  type: 'agent'
                },
                timestamp: new Date(),
                status: 'sent'
              };
              setMessages(prev => [...prev, agentResponse]);
              setIsTyping(false);
            }, 2000);
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'sent' } : msg
      ));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sending': return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent': return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'delivered': return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'read': return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Workspace Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                {workspace?.type === 'private' ? (
                  <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">{workspace?.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{workspace?.description}</p>
              </div>
            </div>
            <button 
              title="Workspace Settings"
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Members */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Members ({workspace?.members.length})
            </h3>
            <div className="space-y-2">
              {workspace?.members.map((member) => (
                <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <div className="relative">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                      member.status === 'online' ? 'bg-green-500' : 
                      member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Agents */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <Bot className="w-4 h-4 mr-2" />
              AI Agents ({workspace?.agents.length})
            </h3>
            <div className="space-y-2">
              {workspace?.agents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                  className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedAgent === agent.id 
                      ? 'bg-blue-100 dark:bg-blue-900' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="relative">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                      agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{agent.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{agent.type}</p>
                  </div>
                  {selectedAgent === agent.id && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Hash className="w-5 h-5 text-gray-400" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">General</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {workspace?.members.length} members
                  {selectedAgent && ` • Chatting with ${workspace?.agents.find(a => a.id === selectedAgent)?.name}`}
                </p>
              </div>
            </div>
            <button 
              title="Chat Options"
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender.type === 'user' && message.sender.id === 'current-user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md ${
                message.sender.type === 'user' && message.sender.id === 'current-user'
                  ? 'bg-blue-600 text-white'
                  : message.sender.type === 'agent'
                  ? 'bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100'
                  : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              } rounded-lg p-3 shadow-sm`}>
                {message.sender.type !== 'user' || message.sender.id !== 'current-user' ? (
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      message.sender.type === 'agent' ? 'bg-purple-500' : 'bg-blue-500'
                    }`}>
                      {message.sender.type === 'agent' ? (
                        <Bot className="w-3 h-3 text-white" />
                      ) : (
                        <User className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{message.sender.name}</span>
                  </div>
                ) : null}
                
                <p className="text-sm">{message.content}</p>
                
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-600 rounded">
                        <Paperclip className="w-4 h-4" />
                        <span className="text-sm">{attachment.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
                  {message.sender.id === 'current-user' && getStatusIcon(message.status)}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          {selectedAgent && (
            <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Chatting with {workspace?.agents.find(a => a.id === selectedAgent)?.name}
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  ✕
                </button>
              </p>
            </div>
          )}
          
          <div className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
              <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                <button
                  onClick={handleFileUpload}
                  title="Attach File"
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button 
                  title="Add Emoji"
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Smile className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              title="Send Message"
              className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            title="Upload Files"
            aria-label="Upload Files"
            className="hidden"
            onChange={(e) => {
              // Handle file upload
              console.log('Files selected:', e.target.files);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default WorkspaceChat;