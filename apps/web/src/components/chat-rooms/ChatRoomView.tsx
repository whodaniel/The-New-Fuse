import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Send,
  Code,
  Paperclip,
  CheckCheck,
  Pin,
  MoreVertical,
  Users,
  Settings,
  Search,
  Download,
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  type: string;
  role: string;
  senderId?: string;
  senderName?: string;
  agentId?: string;
  timestamp: Date;
  isEdited: boolean;
  isPinned: boolean;
  codeSnippet?: {
    language: string;
    code: string;
  };
  taskAssignment?: {
    assignedTo: string;
    dueDate?: string;
    priority?: string;
  };
  readCount?: number;
}

interface Participant {
  id: string;
  userId?: string;
  agentId?: string;
  role: string;
  isTyping: boolean;
}

interface ChatRoomViewProps {
  roomId: string;
  userId: string;
  isAgent?: boolean;
  apiBaseUrl?: string;
  wsUrl?: string;
}

export const ChatRoomView: React.FC<ChatRoomViewProps> = ({
  roomId,
  userId,
  isAgent = false,
  apiBaseUrl = '/api',
  wsUrl = 'http://localhost:3001',
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [messageType, setMessageType] = useState('TEXT');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [showParticipants, setShowParticipants] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [codeContent, setCodeContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io(`${wsUrl}/chat-rooms`, {
      auth: { userId: isAgent ? undefined : userId, agentId: isAgent ? userId : undefined },
      query: { userId: isAgent ? undefined : userId, agentId: isAgent ? userId : undefined },
    });

    newSocket.on('connected', (data) => {
      console.log('Connected to chat rooms:', data);
    });

    newSocket.on('room:joined', (data) => {
      console.log('Joined room:', data);
    });

    newSocket.on('message:new', (data) => {
      if (data.roomId === roomId) {
        setMessages((prev) => [...prev, data.message]);
        scrollToBottom();
      }
    });

    newSocket.on('message:updated', (data) => {
      if (data.roomId === roomId) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === data.message.id ? data.message : msg))
        );
      }
    });

    newSocket.on('message:deleted', (data) => {
      if (data.roomId === roomId) {
        setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
      }
    });

    newSocket.on('typing:started', (data) => {
      if (data.roomId === roomId && data.userId !== userId) {
        setTypingUsers((prev) => new Set(prev).add(data.userId));
      }
    });

    newSocket.on('typing:stopped', (data) => {
      if (data.roomId === roomId) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    });

    newSocket.on('user:joined', (data) => {
      if (data.roomId === roomId) {
        console.log('User joined:', data.userId);
      }
    });

    newSocket.on('user:left', (data) => {
      if (data.roomId === roomId) {
        console.log('User left:', data.userId);
      }
    });

    setSocket(newSocket);

    // Join the room
    newSocket.emit('room:join', { roomId });

    return () => {
      newSocket.emit('room:leave', { roomId });
      newSocket.disconnect();
    };
  }, [roomId, userId, isAgent, wsUrl]);

  useEffect(() => {
    fetchMessages();
    fetchParticipants();
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/chat-rooms/${roomId}/messages`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setMessages(data.messages.reverse());
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/chat-rooms/${roomId}/participants`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setParticipants(data);
    } catch (error) {
      console.error('Failed to fetch participants:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);

    // Handle typing indicator
    if (!isTyping && e.target.value) {
      setIsTyping(true);
      socket?.emit('typing:start', { roomId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('typing:stop', { roomId });
    }, 2000);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() && !codeContent) return;

    const messageData: any = {
      content: inputMessage || 'Code snippet',
      type: messageType,
    };

    if (messageType === 'CODE' && codeContent) {
      messageData.codeSnippet = {
        language: codeLanguage,
        code: codeContent,
      };
    }

    socket?.emit('message:send', {
      roomId,
      message: messageData,
    });

    setInputMessage('');
    setCodeContent('');
    setShowCodeEditor(false);
    setIsTyping(false);
    socket?.emit('typing:stop', { roomId });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.senderId === userId || message.agentId === userId;
    const senderName = message.senderName || message.senderId || message.agentId || 'Unknown';
    const isAgentMessage = !!message.agentId;

    return (
      <div
        key={message.id}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
          {/* Sender Name */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-medium ${
                isAgentMessage
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {isAgentMessage && '🤖 '}
              {senderName}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
            {message.isPinned && <Pin className="w-3 h-3 text-yellow-500" />}
          </div>

          {/* Message Bubble */}
          <div
            className={`rounded-lg px-4 py-2 ${
              isOwnMessage
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
            }`}
          >
            {message.type === 'CODE' && message.codeSnippet ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs opacity-75">
                    {message.codeSnippet.language}
                  </span>
                  <Code className="w-4 h-4" />
                </div>
                <pre className="bg-black bg-opacity-20 p-2 rounded overflow-x-auto">
                  <code>{message.codeSnippet.code}</code>
                </pre>
              </div>
            ) : message.type === 'TASK' && message.taskAssignment ? (
              <div>
                <div className="font-semibold mb-1">Task Assignment</div>
                <div className="text-sm opacity-90">{message.content}</div>
                {message.taskAssignment.dueDate && (
                  <div className="text-xs opacity-75 mt-1">
                    Due: {new Date(message.taskAssignment.dueDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}

            {message.isEdited && (
              <span className="text-xs opacity-75 block mt-1">(edited)</span>
            )}
          </div>

          {/* Read Receipts */}
          {message.readCount && message.readCount > 0 && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <CheckCheck className="w-3 h-3" />
              <span>{message.readCount} read</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chat Room</h2>
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Users className="w-4 h-4" />
            <span className="text-sm">{participants.length}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Download className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(renderMessage)}

        {/* Typing Indicators */}
        {typingUsers.size > 0 && (
          <div className="text-sm text-gray-500 italic">
            {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'}{' '}
            typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Code Editor Modal */}
      {showCodeEditor && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-2">
            <select
              value={codeLanguage}
              onChange={(e) => setCodeLanguage(e.target.value)}
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
            </select>
            <button
              onClick={() => setShowCodeEditor(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <textarea
            value={codeContent}
            onChange={(e) => setCodeContent(e.target.value)}
            className="w-full h-32 p-3 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            placeholder="Paste your code here..."
          />
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setMessageType('CODE');
                setShowCodeEditor(!showCodeEditor);
              }}
              className={`p-2 rounded-lg ${
                showCodeEditor
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title="Add code snippet"
            >
              <Code className="w-5 h-5" />
            </button>
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>

          <textarea
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            style={{ maxHeight: '120px' }}
          />

          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() && !codeContent}
            className="p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Participants Sidebar */}
      {showParticipants && (
        <div className="fixed right-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Participants</h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                    {participant.agentId ? '🤖' : (participant.userId?.[0] || '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {participant.userId || participant.agentId}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {participant.role}
                    </div>
                  </div>
                  {participant.isTyping && (
                    <div className="text-xs text-blue-600">typing...</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoomView;
