import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, Lock, Globe, Zap, Archive } from 'lucide-react';

interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  topic?: string;
  type: string;
  isPrivate: boolean;
  isEphemeral: boolean;
  participantCount?: number;
  messageCount?: number;
  lastMessageAt?: Date;
  isActive: boolean;
}

interface ChatRoomManagerProps {
  onRoomSelect: (roomId: string) => void;
  userId: string;
  apiBaseUrl?: string;
}

export const ChatRoomManager: React.FC<ChatRoomManagerProps> = ({
  onRoomSelect,
  userId,
  apiBaseUrl = '/api',
}) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<ChatRoom[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    filterRooms();
  }, [searchQuery, filterType, rooms]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/chat-rooms`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRooms = () => {
    let filtered = rooms;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (room) =>
          room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          room.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((room) => room.type === filterType);
    }

    setFilteredRooms(filtered);
  };

  const getRoomIcon = (room: ChatRoom) => {
    if (room.isPrivate) return <Lock className="w-4 h-4" />;
    if (room.type === 'AGENT_ONLY') return <Zap className="w-4 h-4" />;
    if (room.isEphemeral) return <Archive className="w-4 h-4" />;
    return <Globe className="w-4 h-4" />;
  };

  const formatLastMessageTime = (date?: Date) => {
    if (!date) return 'No messages';
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Chat Rooms
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Room</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {['all', 'PUBLIC', 'PRIVATE', 'AGENT_ONLY', 'EPHEMERAL'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                filterType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {type === 'all' ? 'All' : type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <Users className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">No rooms found</p>
            <p className="text-sm">Create a new room to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onRoomSelect(room.id)}
                className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getRoomIcon(room)}
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {room.name}
                      </h3>
                      {room.type === 'AGENT_ONLY' && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                          Agents
                        </span>
                      )}
                      {room.isEphemeral && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                          Ephemeral
                        </span>
                      )}
                    </div>
                    {room.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">
                        {room.description}
                      </p>
                    )}
                    {room.topic && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 truncate mb-2">
                        Topic: {room.topic}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {room.participantCount || 0} participants
                      </span>
                      <span>{room.messageCount || 0} messages</span>
                      <span>{formatLastMessageTime(room.lastMessageAt)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(room) => {
            setRooms([room, ...rooms]);
            setShowCreateModal(false);
            onRoomSelect(room.id);
          }}
          apiBaseUrl={apiBaseUrl}
        />
      )}
    </div>
  );
};

interface CreateRoomModalProps {
  onClose: () => void;
  onCreated: (room: ChatRoom) => void;
  apiBaseUrl: string;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  onClose,
  onCreated,
  apiBaseUrl,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    topic: '',
    purpose: '',
    type: 'PUBLIC',
    isPrivate: false,
    isEphemeral: false,
    maxParticipants: 50,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/chat-rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create room');

      const room = await response.json();
      onCreated(room);
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create Chat Room
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Room Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., The New Fuse Development"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                placeholder="Brief description of the room's purpose"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Topic
                </label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Current discussion topic"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Room Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                  <option value="PERSISTENT">Persistent</option>
                  <option value="EPHEMERAL">Ephemeral</option>
                  <option value="AGENT_ONLY">Agent Only</option>
                  <option value="MIXED">Mixed (Agents + Humans)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) =>
                    setFormData({ ...formData, isPrivate: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Private (invite-only)
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isEphemeral}
                  onChange={(e) =>
                    setFormData({ ...formData, isEphemeral: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Ephemeral (auto-delete)
                </span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatRoomManager;
