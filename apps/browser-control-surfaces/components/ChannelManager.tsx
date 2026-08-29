import React, { useState } from 'react';
import { Agent, Channel, TnfChannelMessage } from '../types/federation';

export interface ChannelManagerProps {
  channels: Channel[];
  agents: Map<string, Agent>;
  messages: TnfChannelMessage[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
  onCreateChannel: (name: string, description?: string) => void;
  onJoinChannel: (channelId: string) => void;
  onLeaveChannel: (channelId: string) => void;
  onSendMessage: (channelId: string, content: string) => void;
  isConnected?: boolean;
  isRegistered?: boolean;
}

export const ChannelManager: React.FC<ChannelManagerProps> = ({
  channels,
  agents,
  messages,
  selectedChannelId,
  onSelectChannel,
  onCreateChannel,
  onJoinChannel,
  onLeaveChannel,
  onSendMessage,
  isConnected,
  isRegistered,
}) => {
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter messages for the selected channel
  const channelMessages = selectedChannelId
    ? messages.filter((m) => m.channelId === selectedChannelId)
    : [];

  const selectedChannel = selectedChannelId
    ? channels.find((c) => c.id === selectedChannelId)
    : null;

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChannelName.trim()) {
      onCreateChannel(newChannelName.trim(), newChannelDescription.trim() || undefined);
      setNewChannelName('');
      setNewChannelDescription('');
      setShowCreateModal(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedChannelId && messageInput.trim()) {
      onSendMessage(selectedChannelId, messageInput.trim());
      setMessageInput('');
    }
  };

  const isMember = (channel: Channel) => {
    return (channel.memberCount ?? 0) > 0;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      {/* Channel List */}
      <div style={{ flex: '0 0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Channels</h3>
          <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
            {isConnected && <span style={{ color: '#4caf50' }}>● Connected</span>}
            {isRegistered && <span style={{ color: '#2196f3' }}>● Registered</span>}
            {!isConnected && <span style={{ color: '#f44336' }}>● Disconnected</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '6px 12px',
              background: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            + Create Channel
          </button>
        </div>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {channels.map((channel) => (
            <li
              key={channel.id}
              onClick={() => onSelectChannel(channel.id)}
              style={{
                padding: '8px 12px',
                marginBottom: '4px',
                background: selectedChannelId === channel.id ? '#e3f2fd' : '#f5f5f5',
                borderRadius: '4px',
                cursor: 'pointer',
                border: selectedChannelId === channel.id ? '2px solid #0066cc' : '1px solid #ddd',
                transition: 'all 0.2s',
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <strong style={{ fontSize: '13px' }}>{channel.name}</strong>
                  {channel.description && (
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                      {channel.description}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#666' }}>
                    {channel.memberCount} members
                  </span>
                  {!isMember(channel) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onJoinChannel(channel.id);
                      }}
                      style={{
                        padding: '2px 8px',
                        fontSize: '11px',
                        background: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                      }}
                    >
                      Join
                    </button>
                  )}
                  {isMember(channel) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLeaveChannel(channel.id);
                      }}
                      style={{
                        padding: '2px 8px',
                        fontSize: '11px',
                        background: '#ff9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                      }}
                    >
                      Leave
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '8px',
              width: '400px',
              maxWidth: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px 0' }}>Create Channel</h3>
            <form onSubmit={handleCreateChannel}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                  Channel Name *
                </label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="e.g., general, dev, random"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newChannelDescription}
                  onChange={(e) => setNewChannelDescription(e.target.value)}
                  placeholder="Brief description of channel purpose"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '8px 16px',
                    background: '#f5f5f5',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    background: '#0066cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {selectedChannel ? (
          <>
            <div
              style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: '4px 4px 0 0' }}
            >
              <strong>{selectedChannel.name}</strong>
              {selectedChannel.description && (
                <span style={{ marginLeft: '8px', color: '#666', fontSize: '13px' }}>
                  {selectedChannel.description}
                </span>
              )}
            </div>
            <div
              style={{
                flex: '1 1 auto',
                overflowY: 'auto',
                padding: '12px',
                border: '1px solid #ddd',
                borderTop: 'none',
                background: '#fafafa',
              }}
            >
              {channelMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {channelMessages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        padding: '8px 12px',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #eee',
                        maxWidth: '80%',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '13px' }}>{msg.senderId}</strong>
                        <span style={{ fontSize: '11px', color: '#999' }}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: 1.4 }}>{msg.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <form
              onSubmit={handleSendMessage}
              style={{ display: 'flex', gap: '8px', marginTop: '8px' }}
            >
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
                disabled={!selectedChannelId}
              />
              <button
                type="submit"
                disabled={!selectedChannelId || !messageInput.trim()}
                style={{
                  padding: '8px 16px',
                  background: selectedChannelId && messageInput.trim() ? '#0066cc' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: selectedChannelId && messageInput.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
            }}
          >
            Select a channel to start chatting
          </div>
        )}
      </div>
    </div>
  );
};
