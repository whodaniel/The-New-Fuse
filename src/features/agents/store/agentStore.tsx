import create from "zustand";
import { Agent } from '../types.js';
import { AgentService } from '../services/AgentService.js';

interface AgentState {
  agents: Agent[];
  selectedAgent: Agent | null;
  loading: boolean;
  error: string | null;
  fetchAgents: () => Promise<void>;
  selectAgent: (id: string) => void;
  updateAgent: (agent: Agent) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  selectedAgent: null,
  loading: false,
  error: null,

  fetchAgents: async () => {
    set({ loading: true });
    try {
      const agents = await AgentService.getAgents();
      set({ agents, loading: false });
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message, loading: false });
      } else {
        set({ error: 'An unknown error occurred', loading: false });
      }
    }
  },

  selectAgent: (id: string) => {
    const agent = get().agents.find((a) => a.id === id);
    set({ selectedAgent: agent || null });
  },

  updateAgent: async (agent: Agent) => {
    set({ loading: true });
    try {
      const updated = await AgentService.updateAgent(agent);
      set((state) => ({
        agents: state.agents.map((a) => (a.id === updated.id ? updated : a)),
        selectedAgent: updated,
        loading: false,
      }));
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message, loading: false });
      } else {
        set({ error: 'An unknown error occurred', loading: false });
      }
    }
  },

  deleteAgent: async (id: string) => {
    set({ loading: true });
    try {
      await AgentService.deleteAgent(id);
      set((state) => ({
        agents: state.agents.filter((a) => a.id !== id),
        selectedAgent: state.selectedAgent?.id === id ? null : state.selectedAgent,
        loading: false,
      }));
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message, loading: false });
      } else {
        set({ error: 'An unknown error occurred', loading: false });
      }
    }
  },
}));
