import React, { useMemo, useState } from 'react';
import type { FederationNodeState } from '../../hooks/useFederationNode';

interface FederationChannelPanelProps {
  state: FederationNodeState;
  onConnect: () => Promise<boolean>;
  onRefresh: () => void;
  onSelectChannel: (channelId: string) => void;
  onCreateChannel: (name: string) => void;
  onJoinChannel: (channelId: string) => void;
  onLeaveChannel: (channelId: string) => void;
  onSendMessage: (content: string, channelId?: string) => void;
  onPauseChannel: (channelId: string) => void;
  onResumeChannel: (channelId: string) => void;
}

export const FederationChannelPanel: React.FC<FederationChannelPanelProps> = ({
  state,
  onConnect,
  onRefresh,
  onSelectChannel,
  onCreateChannel,
  onJoinChannel,
  onLeaveChannel,
  onSendMessage,
  onPauseChannel,
  onResumeChannel,
}) => {
  const [newChannelName, setNewChannelName] = useState('');
  const [messageDraft, setMessageDraft] = useState('');

  const selectedChannel = useMemo(
    () => state.channels.find((channel) => channel.id === state.selectedChannelId) || null,
    [state.channels, state.selectedChannelId]
  );

  const channelMessages = useMemo(
    () =>
      state.messages.filter(
        (message) => !state.selectedChannelId || message.channel === state.selectedChannelId
      ),
    [state.messages, state.selectedChannelId]
  );

  return (
    <section className="federation-panel">
      <header className="panel-header">
        <h2>Federation Node</h2>
        <p>Standalone relay operator — drives channels without Chrome extension</p>
      </header>

      <section className="panel-section">
        <h3>Node Status</h3>
        <div className="status-grid">
          <StatusPill label="Relay" ok={state.relayConnected} />
          <StatusPill label="Registered" ok={state.registered} />
          <StatusPill label="Standalone" ok={true} />
        </div>
        <p className="meta-line">Agent: {state.agentId || '—'}</p>
        {!state.relayConnected && (
          <button className="panel-btn primary" disabled={state.connecting} onClick={() => void onConnect()}>
            {state.connecting ? 'Connecting…' : 'Connect Federation Relay'}
          </button>
        )}
        {state.relayConnected && (
          <button className="panel-btn" onClick={onRefresh}>
            Refresh State
          </button>
        )}
        {state.lastError && <p className="panel-error">{state.lastError}</p>}
      </section>

      <section className="panel-section">
        <h3>Channels</h3>
        <div className="panel-row">
          <input
            className="panel-input"
            value={newChannelName}
            onChange={(event) => setNewChannelName(event.target.value)}
            placeholder="New channel name"
          />
          <button
            className="panel-btn"
            disabled={!newChannelName.trim() || !state.relayConnected}
            onClick={() => {
              onCreateChannel(newChannelName.trim());
              setNewChannelName('');
            }}
          >
            Create
          </button>
        </div>
        <select
          className="panel-input"
          value={state.selectedChannelId || ''}
          onChange={(event) => onSelectChannel(event.target.value)}
        >
          <option value="">Select channel…</option>
          {state.channels.map((channel) => (
            <option key={channel.id} value={channel.id}>
              {channel.name} ({channel.members.length})
            </option>
          ))}
        </select>
        {selectedChannel && (
          <div className="panel-row wrap">
            <button className="panel-btn" onClick={() => onJoinChannel(selectedChannel.id)}>
              Join
            </button>
            <button className="panel-btn" onClick={() => onLeaveChannel(selectedChannel.id)}>
              Leave
            </button>
            <button className="panel-btn" onClick={() => onPauseChannel(selectedChannel.id)}>
              Pause
            </button>
            <button className="panel-btn" onClick={() => onResumeChannel(selectedChannel.id)}>
              Resume
            </button>
          </div>
        )}
      </section>

      <section className="panel-section">
        <h3>Channel Message</h3>
        <textarea
          className="panel-textarea"
          value={messageDraft}
          onChange={(event) => setMessageDraft(event.target.value)}
          placeholder={
            selectedChannel
              ? `Broadcast to ${selectedChannel.name}…`
              : 'Select a channel to send federation messages'
          }
          rows={4}
        />
        <button
          className="panel-btn primary"
          disabled={!messageDraft.trim() || !state.selectedChannelId || !state.relayConnected}
          onClick={() => {
            onSendMessage(messageDraft);
            setMessageDraft('');
          }}
        >
          Send to Channel
        </button>
      </section>

      <section className="panel-section">
        <h3>Live Feed {selectedChannel ? `· ${selectedChannel.name}` : ''}</h3>
        <div className="feed">
          {channelMessages.length === 0 ? (
            <p className="panel-hint">No channel messages yet.</p>
          ) : (
            channelMessages.map((message) => (
              <article key={message.id} className="feed-item">
                <header>
                  <strong>{message.from}</strong>
                  <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                </header>
                <p>{message.content}</p>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="panel-section">
        <h3>Connected Agents ({state.agents.length})</h3>
        <ul className="agent-list">
          {state.agents.slice(0, 12).map((agent) => (
            <li key={agent.id}>
              <strong>{agent.name}</strong>
              <span>
                {agent.platform} · {agent.status}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel-section panel-log">
        <h3>Federation Activity</h3>
        <div className="log-stream">
          {state.activityLog.map((line, index) => (
            <div key={`${line}-${index}`} className="log-line">
              {line}
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .federation-panel { display: flex; flex-direction: column; }
        .meta-line { font-size: 11px; color: #94a3b8; margin: 8px 0; word-break: break-all; }
        .panel-textarea {
          width: 100%;
          box-sizing: border-box;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: white;
          border-radius: 8px;
          padding: 10px 12px;
          margin-bottom: 10px;
          resize: vertical;
        }
        .feed { max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
        .feed-item {
          padding: 8px 10px;
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
        }
        .feed-item header {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 11px;
          color: #94a3b8;
          margin-bottom: 4px;
        }
        .feed-item p { margin: 0; font-size: 13px; line-height: 1.4; }
        .agent-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 160px;
          overflow-y: auto;
        }
        .agent-list li {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 8px 10px;
          border-radius: 8px;
          background: rgba(255,255,255,0.03);
        }
        .agent-list span { font-size: 11px; color: #94a3b8; }
      `}</style>
    </section>
  );
};

const StatusPill: React.FC<{ label: string; ok: boolean }> = ({ label, ok }) => (
  <div className={`status-pill ${ok ? 'ok' : 'off'}`}>
    <span>{label}</span>
    <strong>{ok ? 'ON' : 'OFF'}</strong>
  </div>
);

export default FederationChannelPanel;
