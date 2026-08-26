import { useCallback, useState } from 'react';
import { Channel } from '../types/federation';

export interface ChannelManagerProps {
  channels: Map<string, Channel>;
  onSendMessage: (channelId: string, content: string) => Promise<void>;
  connected: boolean;
}

interface ChannelUI extends Channel {
  unreadCount: number;
}

export function ChannelManager({ channels, onSendMessage, connected }: ChannelManagerProps) {
  const [newChannelName, setNewChannelName] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [channelMessages, setChannelMessages] = useState<Record<string, string[]>>({});

  const handleCreateChannel = useCallback(async () => {
    if (!newChannelName.trim()) return;

    // In a real implementation, this would call the federation client
    console.log('[ChannelManager] Creating channel:', newChannelName);
    setNewChannelName('');
  }, [newChannelName]);

  const handleSendMessage = useCallback(async () => {
    if (!selectedChannel || !messageInput.trim()) return;

    await onSendMessage(selectedChannel, messageInput);

    setChannelMessages((prev) => ({
      ...prev,
      [selectedChannel]: [...(prev[selectedChannel] || []), messageInput],
    }));

    setMessageInput('');
  }, [selectedChannel, messageInput, onSendMessage]);

  const channelList = Array.from(channels.values());

  return (
    <div className="tnf-channel-manager">
      <div className="channel-header">
        <h3>📡 Federation Channels</h3>
        <button
          onClick={handleCreateChannel}
          disabled={!connected || !newChannelName.trim()}
          className="btn btn-sm btn-primary"
        >
          Create Channel
        </button>
      </div>

      {connected ? (
        <div className="channel-grid">
          {channelList.length === 0 ? (
            <div className="empty-state">
              <p>No channels available. Create one to start messaging.</p>
            </div>
          ) : (
            channelList.map((channel) => (
              <div
                key={channel.id}
                onClick={() => setSelectedChannel(channel.id)}
                className={`channel-card ${selectedChannel === channel.id ? 'active' : ''}`}
              >
                <div className="channel-name">{channel.name}</div>
                <div className="channel-meta">
                  <span>{channel.memberCount ?? 0} members</span>
                  {(channel.unreadCount ?? 0) > 0 && (
                    <span className="unread-count">{channel.unreadCount}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="disconnected-message">
          <p>Connect to the federation relay to see channels</p>
        </div>
      )}

      {selectedChannel && (
        <div className="channel-chat">
          <div className="chat-messages">
            {(channelMessages[selectedChannel] || []).map((msg, idx) => (
              <div key={idx} className="message-bubble">
                {msg}
              </div>
            ))}
          </div>

          <div className="chat-input">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
              className="btn btn-primary"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
