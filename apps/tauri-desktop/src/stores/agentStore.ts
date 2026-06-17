/**
 * Agent Store - State management for agents
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '../lib/safeStorage';
import { apiService } from '../services/api';
import type { Agent } from '../types';

interface AgentState {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  apiOffline: boolean;
  selectedAgentId: string | null;

  // Actions
  fetchAgents: () => Promise<void>;
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
    (set) => ({
      agents: [],
      loading: false,
      error: null,
      apiOffline: false,
      selectedAgentId: null,

      fetchAgents: async () => {
        set({ loading: true, error: null });
        const response = await apiService.getAgents();
        if (response.success && response.data) {
          set({ agents: response.data, loading: false, apiOffline: false, error: null });
        } else {
          set({
            agents: [],
            loading: false,
            apiOffline: true,
            error:
              response.error ||
              'REST API unavailable at localhost:3001. Use Federated Swarm below or start the TNF API.',
          });
        }
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
