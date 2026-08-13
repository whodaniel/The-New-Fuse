/**
 * Agent Store - State management for agents
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '../lib/safeStorage';
import { apiService } from '../services/api';
import type { Agent } from '../types';

/** Coalesce StrictMode / multi-surface bootstraps so we don't 429 /api/agents. */
const FETCH_TTL_MS = 15_000;
const RATE_LIMIT_HOLD_MS = 20_000;
let lastSuccessfulFetchAt = 0;
let rateLimitedUntil = 0;
let inflightFetch: Promise<void> | null = null;

function isRateLimitedError(error?: string): boolean {
  return Boolean(error && /429|too many requests|rate.?limit/i.test(error));
}

function retryHoldMsFromError(error?: string): number {
  const match = error?.match(/retry after (\d+)/i);
  if (match) {
    const seconds = Number(match[1]);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.min(120_000, Math.max(1_000, Math.ceil(seconds * 1000)));
    }
  }
  return RATE_LIMIT_HOLD_MS;
}

interface AgentState {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  apiOffline: boolean;
  selectedAgentId: string | null;

  // Actions
  fetchAgents: (opts?: { force?: boolean }) => Promise<void>;
  selectAgent: (id: string | null) => void;
  createAgent: (agent: Partial<Agent>) => Promise<void>;
  updateAgent: (id: string, agent: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  startAgent: (id: string) => Promise<void>;
  stopAgent: (id: string) => Promise<void>;
  updateAgentStatus: (id: string, status: Agent['status']) => void;
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      agents: [],
      loading: false,
      error: null,
      apiOffline: false,
      selectedAgentId: null,

      fetchAgents: async (opts) => {
        const force = Boolean(opts?.force);
        const now = Date.now();

        if (!force && inflightFetch) {
          return inflightFetch;
        }

        if (!force && now < rateLimitedUntil) {
          return;
        }

        if (
          !force &&
          get().agents.length > 0 &&
          !get().apiOffline &&
          now - lastSuccessfulFetchAt < FETCH_TTL_MS
        ) {
          return;
        }

        const run = (async () => {
          set({ loading: true, error: null });
          const response = await apiService.getAgents();
          if (response.success && response.data) {
            lastSuccessfulFetchAt = Date.now();
            rateLimitedUntil = 0;
            set({ agents: response.data, loading: false, apiOffline: false, error: null });
            return;
          }

          if (isRateLimitedError(response.error)) {
            rateLimitedUntil = Date.now() + retryHoldMsFromError(response.error);
            // Keep any cached agents so the workflow palette stays usable.
            set({
              loading: false,
              apiOffline: get().agents.length === 0,
              error:
                'Agent list rate-limited (429). Using cached/federated agents — retry shortly.',
            });
            return;
          }

          set({
            agents: force ? [] : get().agents,
            loading: false,
            apiOffline: true,
            error:
              response.error ||
              'REST API unavailable at localhost:3001. Use Federated Swarm below or start the TNF API.',
          });
        })().finally(() => {
          inflightFetch = null;
        });

        inflightFetch = run;
        return run;
      },

      selectAgent: (id) => {
        set({ selectedAgentId: id });
      },

      createAgent: async (agent) => {
        set({ loading: true, error: null });
        const response = await apiService.createAgent(agent);
        if (response.success && response.data) {
          set((state) => ({
            agents: [...state.agents, response.data!],
            loading: false,
          }));
        } else {
          set({
            loading: false,
            error: response.error || 'Cannot create agent while REST API is offline.',
          });
        }
      },

      updateAgent: async (id, agent) => {
        set({ loading: true, error: null });
        const response = await apiService.updateAgent(id, agent);
        if (response.success && response.data) {
          set((state) => ({
            agents: state.agents.map((a) => (a.id === id ? { ...a, ...response.data } : a)),
            loading: false,
          }));
        } else {
          set({
            loading: false,
            error: response.error || 'Cannot update agent while REST API is offline.',
          });
        }
      },

      deleteAgent: async (id) => {
        set({ loading: true, error: null });
        const response = await apiService.deleteAgent(id);
        if (response.success) {
          set((state) => ({
            agents: state.agents.filter((a) => a.id !== id),
            loading: false,
            selectedAgentId: state.selectedAgentId === id ? null : state.selectedAgentId,
          }));
        } else {
          set({
            loading: false,
            error: response.error || 'Cannot delete agent while REST API is offline.',
          });
        }
      },

      startAgent: async (id) => {
        const response = await apiService.startAgent(id);
        if (response.success) {
          set((state) => ({
            agents: state.agents.map((a) =>
              a.id === id ? { ...a, status: 'active' as const, lastActive: 'Now' } : a
            ),
          }));
        } else {
          set({ error: response.error || 'Failed to start agent.' });
        }
      },

      stopAgent: async (id) => {
        const response = await apiService.stopAgent(id);
        if (response.success) {
          set((state) => ({
            agents: state.agents.map((a) => (a.id === id ? { ...a, status: 'idle' as const } : a)),
          }));
        } else {
          set({ error: response.error || 'Failed to stop agent.' });
        }
      },

      updateAgentStatus: (id, status) => {
        set((state) => ({
          agents: state.agents.map((a) => (a.id === id ? { ...a, status } : a)),
        }));
      },
    }),
    {
      name: 'tnf-agent-store',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ selectedAgentId: state.selectedAgentId }),
    }
  )
);
