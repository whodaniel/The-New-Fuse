/**
 * Chat Store - Persistent State Management for Multi-Agent Chat Sessions
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '../lib/safeStorage';
import type { ChatMessage, ChatSession } from '../types';

export type OrchestrationMode = 'direct' | 'broadcast' | 'round-robin' | 'consensus';

/** Keep persisted chat history from blowing past localStorage quotas. */
export const MAX_CHAT_SESSIONS = 50;
export const MAX_MESSAGES_PER_SESSION = 200;

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  mode: OrchestrationMode;
  systemPromptOverride: string;
  temperature: number;
  useLocalFallback: boolean;

  // Actions
  createSession: (title?: string, initialAgents?: string[]) => string;
  setActiveSession: (id: string | null) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  clearSessionMessages: (id: string) => void;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  updateMessage: (sessionId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  deleteMessage: (sessionId: string, messageId: string) => void;
  setSelectedAgents: (sessionId: string, agentIds: string[]) => void;
  setExecutionMode: (mode: OrchestrationMode) => void;
  setSystemPromptOverride: (prompt: string) => void;
  setTemperature: (temp: number) => void;
  setUseLocalFallback: (enabled: boolean) => void;
  exportSession: (sessionId: string, format: 'json' | 'markdown') => string;
}

const createDefaultSession = (): ChatSession => ({
  id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  title: 'New Workspace Chat',
  messages: [],
  agents: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

function pruneSessions(sessions: ChatSession[]): ChatSession[] {
  return sessions.slice(0, MAX_CHAT_SESSIONS).map((session) => ({
    ...session,
    messages:
      session.messages.length > MAX_MESSAGES_PER_SESSION
        ? session.messages.slice(-MAX_MESSAGES_PER_SESSION)
        : session.messages,
  }));
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [createDefaultSession()],
      activeSessionId: null,
      mode: 'broadcast',
      systemPromptOverride: '',
      temperature: 0.7,
      useLocalFallback: true,

      createSession: (title, initialAgents = []) => {
        const id = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const newSession: ChatSession = {
          id,
          title: title || `Session ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          messages: [],
          agents: initialAgents,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          sessions: pruneSessions([newSession, ...state.sessions]),
          activeSessionId: id,
        }));

        return id;
      },

      setActiveSession: (id) => set({ activeSessionId: id }),

      deleteSession: (id) =>
        set((state) => {
          const remaining = state.sessions.filter((s) => s.id !== id);
          const nextActive =
            state.activeSessionId === id
              ? remaining.length > 0
                ? remaining[0].id
                : null
              : state.activeSessionId;

          return {
            sessions: remaining.length > 0 ? remaining : [createDefaultSession()],
            activeSessionId: nextActive,
          };
        }),

      renameSession: (id, title) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, title, updatedAt: new Date().toISOString() } : s
          ),
        })),

      clearSessionMessages: (id) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, messages: [], updatedAt: new Date().toISOString() } : s
          ),
        })),

      addMessage: (sessionId, message) =>
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            // Auto-generate title from first user message if default
            const updatedTitle =
              s.messages.length === 0 && message.role === 'user'
                ? message.content.slice(0, 32) + (message.content.length > 32 ? '…' : '')
                : s.title;

            const nextMessages = [...s.messages, message];
            return {
              ...s,
              title: updatedTitle,
              messages:
                nextMessages.length > MAX_MESSAGES_PER_SESSION
                  ? nextMessages.slice(-MAX_MESSAGES_PER_SESSION)
                  : nextMessages,
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      updateMessage: (sessionId, messageId, updates) =>
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            return {
              ...s,
              messages: s.messages.map((m) => (m.id === messageId ? { ...m, ...updates } : m)),
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      deleteMessage: (sessionId, messageId) =>
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            return {
              ...s,
              messages: s.messages.filter((m) => m.id !== messageId),
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      setSelectedAgents: (sessionId, agentIds) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, agents: agentIds, updatedAt: new Date().toISOString() } : s
          ),
        })),

      setExecutionMode: (mode) => set({ mode }),
      setSystemPromptOverride: (prompt) => set({ systemPromptOverride: prompt }),
      setTemperature: (temp) => set({ temperature: temp }),
      setUseLocalFallback: (enabled) => set({ useLocalFallback: enabled }),

      exportSession: (sessionId, format) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        if (!session) return '';

        if (format === 'json') {
          return JSON.stringify(session, null, 2);
        }

        let markdown = `# ${session.title}\n\n`;
        markdown += `*Created: ${new Date(session.createdAt).toLocaleString()}*\n\n`;
        markdown += `---\n\n`;

        session.messages.forEach((msg) => {
          const sender = msg.role === 'user' ? 'User' : msg.agentName || msg.agentId || msg.role;
          markdown += `### **${sender}** *(${new Date(msg.timestamp).toLocaleTimeString()})*\n\n`;
          markdown += `${msg.content}\n\n`;
        });

        return markdown;
      },
    }),
    {
      name: 'tnf-multiagent-chat-store',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        sessions: pruneSessions(state.sessions),
        activeSessionId: state.activeSessionId,
        mode: state.mode,
        temperature: state.temperature,
        systemPromptOverride: state.systemPromptOverride,
        useLocalFallback: state.useLocalFallback,
      }),
      merge: (persisted, current) => {
        const incoming = (persisted || {}) as Partial<ChatState>;
        const sessions = pruneSessions(
          Array.isArray(incoming.sessions) && incoming.sessions.length > 0
            ? incoming.sessions
            : current.sessions
        );
        const activeSessionId =
          incoming.activeSessionId && sessions.some((s) => s.id === incoming.activeSessionId)
            ? incoming.activeSessionId
            : sessions[0]?.id ?? null;

        return {
          ...current,
          ...incoming,
          sessions,
          activeSessionId,
        };
      },
    }
  )
);
