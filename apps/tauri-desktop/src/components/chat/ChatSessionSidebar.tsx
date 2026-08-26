import { Download, Edit3, MessageSquare, Plus, Search, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { useChatStore } from '../../stores/chatStore';

interface ChatSessionSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatSessionSidebar: React.FC<ChatSessionSidebarProps> = ({ isOpen, onClose }) => {
  const {
    sessions,
    activeSessionId,
    createSession,
    setActiveSession,
    deleteSession,
    renameSession,
    exportSession,
  } = useChatStore();

  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim()) {
      renameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleExport = (id: string, format: 'json' | 'markdown', e: React.MouseEvent) => {
    e.stopPropagation();
    const content = exportSession(id, format);
    const blob = new Blob([content], {
      type: format === 'json' ? 'application/json' : 'text/markdown',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-session-${id}.${format === 'json' ? 'json' : 'md'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <aside className="w-72 bg-slate-900/95 border-r border-slate-800 flex flex-col h-full z-20 shrink-0 backdrop-blur-md">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          Chat History
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat history"
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* New Session Button */}
      <div className="p-3">
        <button
          type="button"
          onClick={() => createSession()}
          className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </button>
      </div>

      {/* Search Input */}
      <div className="px-3 mb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 py-1">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">No matching chats</div>
        ) : (
          filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isEditing = session.id === editingId;

            return (
              <div
                key={session.id}
                onClick={() => setActiveSession(session.id)}
                className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-200'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare
                    className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}
                  />

                  {isEditing ? (
                    <form onSubmit={(e) => handleSaveRename(session.id, e)} className="flex-1">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={(e) => handleSaveRename(session.id, e)}
                        autoFocus
                        className="w-full px-2 py-0.5 rounded bg-slate-950 border border-indigo-500 text-xs text-white focus:outline-none"
                      />
                    </form>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{session.title}</div>
                      <div className="text-[10px] text-slate-500">
                        {session.messages.length} msg ·{' '}
                        {new Date(session.updatedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Session Hover Controls */}
                {!isEditing && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => handleStartRename(session.id, session.title, e)}
                      title="Rename chat"
                      className="p-1 hover:text-indigo-400 hover:bg-slate-700/50 rounded"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleExport(session.id, 'markdown', e)}
                      title="Export Markdown"
                      className="p-1 hover:text-indigo-400 hover:bg-slate-700/50 rounded"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      title="Delete chat"
                      className="p-1 hover:text-red-400 hover:bg-slate-700/50 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

export default ChatSessionSidebar;
