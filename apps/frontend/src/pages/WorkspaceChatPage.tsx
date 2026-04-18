import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  PremiumButton,
  PremiumInput,
} from '@/components/ui';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Ban,
  Bot,
  CheckCheck,
  Clock,
  Globe,
  Hash,
  Info,
  Loader2,
  Lock,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Search,
  Send,
  Settings,
  Smile,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

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
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
}

interface Member {
  id: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
  status: 'online' | 'away' | 'offline';
}

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive';
}

interface Workspace {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private';
  members: Member[];
  agents: Agent[];
}

// ⚡ Bolt: Wrapped MessageItem in React.memo to prevent O(n) re-renders
// of the entire message list on every keystroke in the chat input.
// Wrapped in React.forwardRef to allow AnimatePresence to pass refs to motion.div without warnings.
// This significantly improves typing performance in long chat rooms.
const MessageItem = React.memo(
  React.forwardRef<
    HTMLDivElement,
    {
      message: Message;
      index: number;
      formatTime: (date: Date) => string;
      getStatusIcon: (status: string) => React.ReactNode;
    }
  >(({ message, index, formatTime, getStatusIcon }, ref) => {
    const isOwnMessage = message.sender.type === 'user' && message.sender.id === 'current-user';
    const isAgent = message.sender.type === 'agent';

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-xs lg:max-w-md rounded-md p-4 ${
            isOwnMessage
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
              : isAgent
                ? 'bg-purple-500/20 border border-purple-500/30 text-white'
                : 'bg-transparent/10 backdrop-blur-sm border border-white/10 text-white'
          }`}
        >
          {!isOwnMessage && (
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isAgent ? 'bg-purple-500' : 'bg-blue-500'
                }`}
              >
                {isAgent ? (
                  <Bot className="w-3 h-3 text-white" />
                ) : (
                  <User className="w-3 h-3 text-white" />
                )}
              </div>
              <span className="text-sm font-medium">{message.sender.name}</span>
            </div>
          )}

          <p className="text-sm">{message.content}</p>

          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 p-2 bg-black/20 rounded-md"
                >
                  <Paperclip className="w-4 h-4" />
                  <span className="text-sm">{attachment.name}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
            {isOwnMessage && getStatusIcon(message.status)}
          </div>
        </div>
      </motion.div>
    );
  })
);
MessageItem.displayName = 'MessageItem';

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(date);
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'sending':
      return <Clock className="w-3 h-3 text-gray-400" />;
    case 'sent':
    case 'delivered':
    case 'read':
      return (
        <CheckCheck
          className={`w-3 h-3 ${status === 'read' ? 'text-blue-400' : 'text-gray-400'}`}
        />
      );
    case 'failed':
      return <X className="w-3 h-3 text-red-400" />;
    default:
      return null;
  }
};

const WorkspaceChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTyping] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || '';
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const getCurrentUserId = () => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return 'current-user';
      const parsed = JSON.parse(raw);
      return String(parsed?.id || 'current-user');
    } catch {
      return 'current-user';
    }
  };

  const mapMessage = (raw: any): Message => ({
    id: String(raw?.id || Date.now()),
    content: String(raw?.content || ''),
    sender: {
      id: String(raw?.sender?.id || raw?.senderId || 'unknown'),
      name: String(raw?.sender?.name || raw?.senderName || 'Unknown'),
      avatar: raw?.sender?.avatar,
      type: String(raw?.sender?.type || raw?.senderType || 'user') === 'agent' ? 'agent' : 'user',
    },
    timestamp: new Date(raw?.createdAt || raw?.timestamp || Date.now()),
    status: 'sent',
    attachments: Array.isArray(raw?.attachments) ? raw.attachments : [],
  });

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        await fetchWorkspaceData();
        await fetchMessages();
      } catch (error: any) {
        setLoadError(error?.message || 'Workspace chat data unavailable');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchWorkspaceData = async () => {
    const wsResponse = await fetch('/api/workspaces', {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!wsResponse.ok) {
      throw new Error(`Workspace list unavailable (${wsResponse.status})`);
    }
    const workspaces = await wsResponse.json();
    const current = Array.isArray(workspaces) && workspaces.length > 0 ? workspaces[0] : null;

    if (!current) {
      setWorkspace(null);
      return;
    }

    const [membersRes, agentsRes] = await Promise.all([
      fetch(`/api/workspaces/${current.id}/members`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      }),
      fetch('/api/agents', { headers: getAuthHeaders(), credentials: 'include' }),
    ]);

    const membersRaw = membersRes.ok ? await membersRes.json() : [];
    const agentsRaw = agentsRes.ok ? await agentsRes.json() : [];
    const agentRows = Array.isArray(agentsRaw)
      ? agentsRaw
      : Array.isArray(agentsRaw?.data)
        ? agentsRaw.data
        : [];

    setWorkspace({
      id: String(current.id),
      name: String(current.name || 'Workspace'),
      description: String(current.description || 'No description'),
      type: 'private',
      members: (Array.isArray(membersRaw) ? membersRaw : []).map((member: any) => ({
        id: String(member?.userId || member?.id || ''),
        name: String(member?.email || member?.name || 'Member'),
        role: String(member?.role || 'member') as Member['role'],
        status: 'online',
      })),
      agents: agentRows.map((agent: any) => ({
        id: String(agent?.id || ''),
        name: String(agent?.name || 'Agent'),
        type: String(agent?.type || 'general'),
        status: String(agent?.status || '').toLowerCase() === 'active' ? 'active' : 'inactive',
      })),
    });
  };

  const fetchMessages = async () => {
    const roomsResponse = await fetch('/api/chat/rooms', {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!roomsResponse.ok) {
      throw new Error(`Chat rooms unavailable (${roomsResponse.status})`);
    }

    const rooms = await roomsResponse.json();
    const room = Array.isArray(rooms) && rooms.length > 0 ? rooms[0] : null;
    if (!room?.id) {
      setRoomId(null);
      setMessages([]);
      return;
    }

    setRoomId(String(room.id));
    const messagesResponse = await fetch(
      `/api/chat/rooms/${encodeURIComponent(room.id)}/messages?limit=100&offset=0`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      }
    );
    if (!messagesResponse.ok) {
      throw new Error(`Chat messages unavailable (${messagesResponse.status})`);
    }

    const payload = await messagesResponse.json();
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.messages)
        ? payload.messages
        : [];
    setMessages(rows.map(mapMessage));
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: { id: getCurrentUserId(), name: 'You', type: 'user' },
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage('');

    try {
      if (!roomId) {
        throw new Error('No chat room is available for this workspace.');
      }

      const response = await fetch(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          content: newMessage,
          type: 'text',
          metadata: selectedAgent ? { agentId: selectedAgent } : {},
        }),
      });

      if (response.ok) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === message.id ? { ...msg, status: 'delivered' } : msg))
        );
      } else {
        throw new Error(`Failed to send message (${response.status})`);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === message.id ? { ...msg, status: 'failed' } : msg))
      );
      toast.error(error?.message || 'Failed to send message');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-12 h-12 text-purple-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Sidebar */}
      <div className="relative z-10 w-80 border-r border-white/10 bg-black/20 backdrop-blur-md flex flex-col">
        {/* Workspace Header */}
        <div className="p-4 border-b border-white/10">
          {loadError && (
            <div className="mb-3 rounded-md border border-amber-300 bg-amber-100/80 px-3 py-2 text-xs text-amber-900">
              {loadError}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center border border-white/10">
                {workspace?.type === 'private' ? (
                  <Lock className="w-5 h-5 text-purple-400" />
                ) : (
                  <Globe className="w-5 h-5 text-blue-400" />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-white">{workspace?.name}</h2>
                <p className="text-xs text-gray-400">{workspace?.description}</p>
              </div>
            </div>
            <button
              onClick={() => toast('Workspace Settings coming soon!', { icon: '⚙️' })}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-transparent/10"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <PremiumInput
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Members & Agents */}
        <div className="flex-1 overflow-y-auto">
          {/* Members */}
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Members ({workspace?.members.length})
            </h3>
            <div className="space-y-2">
              {workspace?.members.map((member: Member) => (
                <motion.div
                  key={member.id}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-transparent/5 transition-colors cursor-pointer"
                >
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                        member.status === 'online'
                          ? 'bg-emerald-500'
                          : member.status === 'away'
                            ? 'bg-amber-500'
                            : 'bg-transparent0'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{member.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{member.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* AI Agents */}
          <div className="p-4 border-t border-white/10">
            <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Bot className="w-4 h-4" />
              AI Agents ({workspace?.agents.length})
            </h3>
            <div className="space-y-2">
              {workspace?.agents.map((agent: Agent) => (
                <motion.div
                  key={agent.id}
                  whileHover={{ x: 4 }}
                  onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                  className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all ${
                    selectedAgent === agent.id
                      ? 'bg-purple-500/20 border border-purple-500/30'
                      : 'hover:bg-transparent/5'
                  }`}
                >
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                        agent.status === 'active' ? 'bg-emerald-500' : 'bg-transparent0'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{agent.name}</p>
                    <p className="text-xs text-gray-400">{agent.type}</p>
                  </div>
                  {selectedAgent === agent.id && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                      Active
                    </Badge>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b border-white/10 bg-black/20 backdrop-blur-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Hash className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="font-semibold text-white flex items-center gap-2">
                  General
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                </h3>
                <p className="text-sm text-gray-400">
                  {workspace?.members.length ?? 0} members
                  {selectedAgent &&
                    ` • Chatting with ${workspace?.agents.find((a) => a.id === selectedAgent)?.name}`}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-transparent/10">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-white">
                <DropdownMenuItem
                  onClick={() => toast('Channel info', { icon: 'ℹ️' })}
                  className="hover:bg-transparent/10 cursor-pointer"
                >
                  <Info className="w-4 h-4 mr-2" />
                  Channel Info
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setMessages([]);
                    toast.success('Chat history cleared');
                  }}
                  className="hover:bg-transparent/10 cursor-pointer text-red-400 focus:text-red-400"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear History
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => toast.error('User blocked')}
                  className="hover:bg-transparent/10 cursor-pointer text-red-400 focus:text-red-400"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Block User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message: Message, index: number) => (
              <MessageItem
                key={message.id}
                message={message}
                index={index}
                formatTime={formatTime}
                getStatusIcon={getStatusIcon}
              />
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-purple-500/20 border border-purple-500/30 rounded-md p-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex gap-1">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                      className="w-2 h-2 bg-purple-400 rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
                      className="w-2 h-2 bg-purple-400 rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                      className="w-2 h-2 bg-purple-400 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-white/10 bg-black/20 backdrop-blur-md p-4">
          {selectedAgent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-purple-300 flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  Chatting with {workspace?.agents.find((a) => a.id === selectedAgent)?.name}
                </p>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="p-1 text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                className="w-full p-4 pr-20 bg-transparent/5 border border-white/10 rounded-md text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none"
                rows={1}
                style={{ minHeight: '56px', maxHeight: '120px' }}
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-1">
                <button
                  onClick={handleFileUpload}
                  className="p-2 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-transparent/10"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toast('Emoji picker coming soon!', { icon: '😃' })}
                  className="p-2 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-transparent/10"
                >
                  <Smile className="w-4 h-4" />
                </button>
              </div>
            </div>
            <PremiumButton
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              variant="gradient"
              size="lg"
              icon={Send}
              className="h-14"
            >
              Send
            </PremiumButton>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              console.log('Files selected:', e.target.files);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default WorkspaceChat;
