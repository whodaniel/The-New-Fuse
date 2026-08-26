import { MessageSquare, PanelLeft, Settings, Sparkles } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import AgentDetailModal from '../components/chat/AgentDetailModal';
import AgentSelectorPanel from '../components/chat/AgentSelectorPanel';
import ChatInputArea from '../components/chat/ChatInputArea';
import ChatMessageItem from '../components/chat/ChatMessageItem';
import ChatSessionSidebar from '../components/chat/ChatSessionSidebar';
import PageShell from '../components/layout/PageShell';
import { useRoute } from '../components/route-context';
import { useOperatorSynergy } from '../hooks/useOperatorSynergy';
import FederationNodeService, {
  type FederationChannelMessage,
} from '../services/FederationNodeService';
import localChatEngine from '../services/localChatEngine';
import { wsService } from '../services/websocket';
import { useAgentStore } from '../stores/agentStore';
import { useChatStore } from '../stores/chatStore';
import type { Agent, ChatMessage } from '../types';

/**
 * Enhanced Multi-Agent Chat Page
 * Features persistent sessions, markdown rendering, code syntax highlighting,
 * 4 execution modes, agent detail configuration, and offline JIT simulation.
 */
const MultiAgentChat: React.FC = () => {
  const { navigate } = useRoute();
  const { unifiedAgents, state: synergy, sendFederationMessage } = useOperatorSynergy();
  const { agents: apiAgents, fetchAgents, updateAgent, apiOffline } = useAgentStore();

  const {
    sessions,
    activeSessionId,
    createSession,
    setActiveSession,
    addMessage,
    deleteMessage,
    setSelectedAgents,
    mode,
    setExecutionMode,
    temperature,
    setTemperature,
    systemPromptOverride,
    useLocalFallback,
  } = useChatStore();

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const selectedAgents = activeSession?.agents || [];

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1680
  );
  const [inspectedAgent, setInspectedAgent] = useState<Agent | null>(null);

  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const loadingTimeoutRef = useRef<number | null>(null);
  // Seed defaults once per session so Clear All is not immediately undone.
  const seededAgentSessionsRef = useRef<Set<string>>(new Set());

  const activeAgents = unifiedAgents.filter((a) => a.status !== 'error' && a.status !== 'offline');

  useEffect(() => {
    void fetchAgents();
  }, [fetchAgents]);

  // Initialize active session if missing
  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSession(sessions[0].id);
    }
  }, [activeSessionId, sessions, setActiveSession]);

  // Seed default agents once per session id (never re-fight Clear All).
  useEffect(() => {
    if (!activeSession) return;
    if (seededAgentSessionsRef.current.has(activeSession.id)) return;
    const pool =
      unifiedAgents.length > 0
        ? unifiedAgents
        : apiAgents.map((a) => ({ id: a.id, status: a.status }));
    if (pool.length === 0) return;
    seededAgentSessionsRef.current.add(activeSession.id);
    if (activeSession.agents.length > 0) return;
    setSelectedAgents(
      activeSession.id,
      pool
        .filter((a) => a.status !== 'error' && a.status !== 'offline')
        .slice(0, 2)
        .map((a) => a.id)
    );
  }, [activeSession, unifiedAgents, apiAgents, setSelectedAgents]);

  // WebSocket Connection
  useEffect(() => {
    wsService.connect();
    const unsubConnection = wsService.onConnection(setIsConnected);

    const unsubMessages = wsService.on('chat:message', (data: ChatMessage) => {
      if (activeSessionId) {
        addMessage(activeSessionId, data);
      }
      stopLoading();
    });

    return () => {
      unsubConnection();
      unsubMessages();
      clearLoadingTimeout();
    };
  }, [activeSessionId, addMessage]);

  // Scroll to bottom on new messages
  useEffect(() => {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;

    // Keep scrolling confined to the feed. scrollIntoView() also scrolls the
    // page shell and sibling panels, which used to push the chat chrome off-screen.
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth';
    if (typeof viewport.scrollTo === 'function') {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior });
    } else {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [activeSession?.messages, isLoading]);

  // Listen for Federation Channel messages
  useEffect(() => {
    const handler = (raw?: unknown) => {
      const payload = raw as FederationChannelMessage | undefined;
      if (!payload?.content || payload.from === FederationNodeService.getState().agentId) return;

      const agent = unifiedAgents.find((entry) => entry.id === payload.from);

      if (selectedAgents.length > 0 && !selectedAgents.includes(payload.from)) return;

      const incoming: ChatMessage = {
        id: payload.id || `${Date.now()}-fed`,
        role: 'agent',
        content: payload.content,
        agentId: payload.from,
        agentName: agent?.name || payload.from,
        timestamp: new Date(payload.timestamp || Date.now()).toISOString(),
      };

      if (activeSessionId) {
        addMessage(activeSessionId, incoming);
      }
      stopLoading();
    };

    FederationNodeService.on('channel_message', handler);
    return () => {
      FederationNodeService.off('channel_message', handler);
    };
  }, [selectedAgents, unifiedAgents, activeSessionId, addMessage]);

  const clearLoadingTimeout = () => {
    if (loadingTimeoutRef.current !== null) {
      window.clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  };

  const stopLoading = () => {
    clearLoadingTimeout();
    setIsLoading(false);
  };

  const armLoadingTimeout = (ms: number, notice: string) => {
    clearLoadingTimeout();
    loadingTimeoutRef.current = window.setTimeout(() => {
      loadingTimeoutRef.current = null;
      setIsLoading(false);
      if (activeSessionId) {
        addMessage(activeSessionId, {
          id: `${Date.now()}-timeout`,
          role: 'system',
          content: notice,
          timestamp: new Date().toISOString(),
        });
      }
    }, ms);
  };

  const handleSend = async (messageText: string) => {
    if (!messageText.trim() || selectedAgents.length === 0 || !activeSession) return;

    const currentSessionId = activeSession.id;
    const generationOpts = {
      temperature,
      systemPrompt: systemPromptOverride || undefined,
      mode,
    };

    const userMsg: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
      metadata: generationOpts,
    };

    addMessage(currentSessionId, userMsg);
    setIsLoading(true);

    const selectedSources = selectedAgents
      .map((agentId) => {
        const unified = unifiedAgents.find((agent) => agent.id === agentId);
        if (unified) return unified.source;
        return apiAgents.some((agent) => agent.id === agentId) ? 'local-api' : null;
      })
      .filter((source): source is 'federation' | 'local-api' => source !== null);
    const apiTargetsOnly =
      selectedSources.length === selectedAgents.length &&
      selectedSources.every((source) => source === 'local-api');
    const hasFederationTarget = selectedSources.includes('federation');

    if (apiTargetsOnly && isConnected && synergy.apiOnline && !apiOffline) {
      wsService.sendChatMessage(currentSessionId, messageText, selectedAgents, generationOpts);
      armLoadingTimeout(30000, '⚠️ No response from REST API within 30s.');
    } else if (hasFederationTarget && synergy.relayRegistered) {
      const joined = FederationNodeService.getState().joinedChannels;
      const channelId = joined[0] || 'general';
      sendFederationMessage(
        channelId,
        JSON.stringify({
          type: 'operator_chat',
          content: messageText,
          targets: selectedAgents,
          mode,
          temperature,
          ...(systemPromptOverride ? { systemPrompt: systemPromptOverride } : {}),
          from: FederationNodeService.getState().agentId,
        })
      );
      armLoadingTimeout(8000, '⚠️ Federation channel message timed out.');
    } else if (useLocalFallback) {
      // Fallback: Local JIT Agent Simulator
      const selectedAgentObjs = unifiedAgents
        .filter((a) => selectedAgents.includes(a.id))
        .map((a) => ({ id: a.id, name: a.name, platform: a.platform }));

      await localChatEngine.generateResponses(
        messageText,
        selectedAgentObjs,
        mode,
        (agentMsg) => {
          addMessage(currentSessionId, {
            ...agentMsg,
            metadata: { ...(agentMsg.metadata || {}), ...generationOpts },
          });
        },
        { temperature, systemPrompt: systemPromptOverride }
      );
      stopLoading();
    } else {
      stopLoading();
      addMessage(currentSessionId, {
        id: `${Date.now()}-offline`,
        role: 'system',
        content:
          '⚠️ Relay and API are offline — local JIT fallback is disabled. Connect relay from Dashboard or enable Local Fallback in chat settings.',
        timestamp: new Date().toISOString(),
      });
    }
  };

  const mappedAgents: Agent[] = (() => {
    const fromFederation: Agent[] = unifiedAgents.map((ua) => ({
      id: ua.id,
      name: ua.name,
      type: (ua.platform.toLowerCase() as Agent['type']) || 'custom',
      status: (ua.status as Agent['status']) || 'idle',
      description: ua.source === 'federation' ? 'Federated Swarm Node' : 'Local API Agent',
      capabilities: ua.capabilities || [],
      lastActive: 'Now',
      tasks: 0,
      config: {
        model: ua.platform,
        temperature: 0.7,
        maxTokens: 4096,
        systemPrompt: '',
        tools: ua.capabilities || [],
      },
    }));

    if (fromFederation.length > 0) return fromFederation;

    return apiAgents.map((agent) => ({
      ...agent,
      description: agent.description || 'API agent',
      lastActive: agent.lastActive || 'Now',
      tasks: agent.tasks || 0,
    }));
  })();

  const fleetCountLabel =
    mappedAgents.length > 0
      ? `${mappedAgents.filter((a) => a.status !== 'error' && a.status !== 'offline').length} of ${mappedAgents.length}`
      : `${activeAgents.length} of ${unifiedAgents.length}`;

  const runtimeLabel =
    mappedAgents.length === 0
      ? 'No Chat Agents Available'
      : synergy.apiOnline && isConnected && !apiOffline
        ? 'API Connected'
        : synergy.relayRegistered
          ? 'Federation Active'
          : mappedAgents.length > 0 && useLocalFallback
            ? 'Local JIT Engine'
            : 'Runtime Setup Required';

  const toggleAgent = (agentId: string) => {
    if (!activeSession) return;
    const current = activeSession.agents;
    const updated = current.includes(agentId)
      ? current.filter((id) => id !== agentId)
      : [...current, agentId];
    setSelectedAgents(activeSession.id, updated);
  };

  const handleSelectAllAgents = () => {
    if (!activeSession) return;
    setSelectedAgents(
      activeSession.id,
      mappedAgents.filter((a) => a.status !== 'error' && a.status !== 'offline').map((a) => a.id)
    );
  };

  const handleClearAllAgents = () => {
    if (!activeSession) return;
    setSelectedAgents(activeSession.id, []);
  };

  const getAgentColor = (platform: string) => {
    const colors: Record<string, string> = {
      nvidia: '#f97316',
      groq: '#10b981',
      sambanova: '#3b82f6',
      cerebras: '#eab308',
      deepseek: '#8b5cf6',
      gemini: '#6366f1',
      openai: '#0ea5e9',
      openrouter: '#64748b',
      custom: '#64748b',
      local: '#eab308',
      'tauri-desktop': '#6366f1',
      'federation-node': '#8b5cf6',
    };
    return colors[platform.toLowerCase()] || '#6366f1';
  };

  const getAgentPlatform = (agentId?: string) => {
    if (!agentId) return 'custom';
    const found = unifiedAgents.find((a) => a.id === agentId);
    return found?.platform || 'custom';
  };

  return (
    <PageShell
      className="page-fill"
      title="Multi-Agent Swarm Chat"
      subtitle={`${fleetCountLabel} agents reachable · Mode: ${mode.toUpperCase()} · ${runtimeLabel}`}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="secondary-button flex items-center gap-1.5"
          >
            <PanelLeft className="w-4 h-4" />
            <span>{showSidebar ? 'Hide History' : 'Show History'}</span>
          </button>
          <button
            onClick={() => createSession()}
            className="primary-button flex items-center gap-1.5"
          >
            <MessageSquare className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>
      }
    >
      <div
        className="page-fill-body chat-layout flex h-full overflow-hidden"
        style={{ background: 'var(--tnf-obsidian)', color: 'var(--tnf-text-primary)' }}
      >
        {/* Sessions Sidebar */}
        <ChatSessionSidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />

        {/* Agent Fleet Selector */}
        <AgentSelectorPanel
          agents={mappedAgents}
          selectedAgents={selectedAgents}
          onToggleAgent={toggleAgent}
          onSelectAll={handleSelectAllAgents}
          onClearAll={handleClearAllAgents}
          onInspectAgent={setInspectedAgent}
          getAgentColor={getAgentColor}
          synergy={synergy}
          isConnected={isConnected}
          localFallbackReady={mappedAgents.length > 0 && useLocalFallback}
        />

        {/* Main Chat Area */}
        <main
          className="flex-1 flex flex-col min-w-0 relative"
          style={{ background: 'var(--tnf-obsidian)' }}
        >
          {/* Header Bar */}
          <header
            className="p-4 border-b backdrop-blur-md flex items-center justify-between"
            style={{
              borderColor: 'var(--tnf-border)',
              background: 'var(--tnf-surface-card, var(--tnf-surface))',
            }}
          >
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              <span className="text-xs font-bold text-slate-400 uppercase mr-1">Active Swarm:</span>
              {selectedAgents.map((id) => {
                const agent = unifiedAgents.find((a) => a.id === id);
                if (!agent) return null;
                return (
                  <span
                    key={id}
                    className="px-2.5 py-1 rounded-xl text-xs border font-medium bg-slate-900/80 flex items-center gap-1.5 shrink-0"
                    style={{ borderColor: getAgentColor(agent.platform) }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: getAgentColor(agent.platform) }}
                    />
                    {agent.name}
                  </span>
                );
              })}
              {selectedAgents.length === 0 && (
                <span className="text-xs text-amber-400 italic">
                  Select agents to begin chatting
                </span>
              )}
            </div>
          </header>

          {/* Messages Feed */}
          <div
            ref={messagesViewportRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin"
            aria-live="polite"
            aria-label="Conversation messages"
          >
            {!activeSession || activeSession.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-3xl shadow-lg">
                  <Sparkles className="w-8 h-8 text-indigo-400" />
                </div>
                <div className="w-full max-w-sm">
                  <h3 className="font-bold text-white text-lg">
                    {mappedAgents.length > 0
                      ? 'Multi-Agent Swarm Arena'
                      : 'Connect your agent runtime'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    {mappedAgents.length > 0
                      ? 'Select agents, choose an execution mode, and type a prompt to start collaborating.'
                      : 'No reachable agents were found. Configure the API or relay connection, then return here to start a conversation.'}
                  </p>
                  {mappedAgents.length === 0 && (
                    <button
                      type="button"
                      onClick={() => navigate('/settings')}
                      className="primary-button mt-4 inline-flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Open Runtime Settings
                    </button>
                  )}
                </div>
              </div>
            ) : (
              activeSession.messages.map((msg) => (
                <ChatMessageItem
                  key={msg.id}
                  message={msg}
                  getAgentColor={getAgentColor}
                  getAgentPlatform={getAgentPlatform}
                  onDelete={(id) => activeSessionId && deleteMessage(activeSessionId, id)}
                  onRegenerate={(msg) => handleSend(`Re-evaluate: ${msg.content}`)}
                />
              ))
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start items-center gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800 w-fit animate-pulse">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Swarm agents generating response...
                </span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <ChatInputArea
            onSend={handleSend}
            disabled={selectedAgents.length === 0}
            isLoading={isLoading}
            mode={mode}
            onModeChange={setExecutionMode}
            temperature={temperature}
            onTemperatureChange={setTemperature}
            selectedAgentCount={selectedAgents.length}
          />
        </main>
      </div>

      {/* Agent Detail Modal */}
      {inspectedAgent && (
        <AgentDetailModal
          agent={inspectedAgent}
          onClose={() => setInspectedAgent(null)}
          onUpdateAgent={updateAgent}
        />
      )}
    </PageShell>
  );
};

export default MultiAgentChat;
