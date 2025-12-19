/**
 * Agent Store - State management for agents
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService } from '../services/api';
import type { Agent } from '../types';

interface AgentState {
  agents: Agent[];
  loading: boolean;
  error: string | null;
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

// Mock data for development when API is unavailable
const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Research Assistant',
    type: 'perplexity',
    status: 'active',
    description: 'Searches the web and summarizes information',
    capabilities: ['web-search', 'summarization', 'citation'],
    lastActive: 'Now',
    tasks: 15,
    config: {
      model: 'perplexity-online',
      temperature: 0.7,
      maxTokens: 4096,
      systemPrompt: 'You are a helpful research assistant.',
      tools: ['web-search', 'document-reader'],
    },
  },
  {
    id: '2',
    name: 'Code Reviewer',
    type: 'claude',
    status: 'idle',
    description: 'Reviews code and suggests improvements',
    capabilities: ['code-review', 'refactoring', 'documentation'],
    lastActive: '5 min ago',
    tasks: 42,
    config: {
      model: 'claude-3-sonnet',
      temperature: 0.3,
      maxTokens: 8192,
      systemPrompt: 'You are an expert code reviewer.',
      tools: ['code-execution', 'git-integration'],
    },
  },
  {
    id: '3',
    name: 'Content Writer',
    type: 'gpt',
    status: 'active',
    description: 'Creates blog posts, documentation, and marketing copy',
    capabilities: ['writing', 'editing', 'seo-optimization'],
    lastActive: 'Now',
    tasks: 28,
    config: {
      model: 'gpt-4-turbo',
      temperature: 0.8,
      maxTokens: 4096,
      systemPrompt: 'You are a professional content writer.',
      tools: ['grammar-check', 'plagiarism-check'],
    },
  },
  {
    id: '4',
    name: 'Data Analyst',
    type: 'gemini',
    status: 'error',
    description: 'Analyzes data and creates visualizations',
    capabilities: ['data-analysis', 'visualization', 'reporting'],
    lastActive: '1 hour ago',
    tasks: 7,
    config: {
      model: 'gemini-pro',
      temperature: 0.5,
      maxTokens: 4096,
      systemPrompt: 'You are a data analyst expert.',
      tools: ['python-executor', 'chart-generator'],
    },
  },
  {
    id: '5',
    name: 'DevOps Bot',
    type: 'custom',
    status: 'idle',
    description: 'Manages deployments and infrastructure',
    capabilities: ['deployment', 'monitoring', 'ci-cd'],
    lastActive: '30 min ago',
    tasks: 156,
    config: {
      model: 'local-llama',
      temperature: 0.2,
      maxTokens: 2048,
      systemPrompt: 'You are a DevOps automation expert.',
      tools: ['shell-executor', 'docker-integration', 'kubernetes-manager'],
    },
  },
];

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      agents: mockAgents, // Start with mock data
      loading: false,
      error: null,
      selectedAgentId: null,

      fetchAgents: async () => {
        set({ loading: true, error: null });
        const response = await apiService.getAgents();
        if (response.success && response.data) {
          set({ agents: response.data, loading: false });
        } else {
          // Keep mock data on error, but log it
          console.warn('Failed to fetch agents, using mock data:', response.error);
          set({ loading: false });
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
          // Create locally if API fails
          const newAgent: Agent = {
            id: Date.now().toString(),
            name: agent.name || 'New Agent',
            type: agent.type || 'custom',
            status: 'idle',
            description: agent.description || '',
            capabilities: agent.capabilities || [],
            lastActive: 'Never',
            tasks: 0,
            config: agent.config || {
              model: '',
              temperature: 0.7,
              maxTokens: 4096,
              systemPrompt: '',
              tools: [],
            },
          };
          set((state) => ({
            agents: [...state.agents, newAgent],
            loading: false,
          }));
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
          // Update locally if API fails
          set((state) => ({
            agents: state.agents.map((a) => (a.id === id ? { ...a, ...agent } : a)),
            loading: false,
          }));
        }
      },

      deleteAgent: async (id) => {
        set({ loading: true, error: null });
        await apiService.deleteAgent(id);
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== id),
          loading: false,
          selectedAgentId: state.selectedAgentId === id ? null : state.selectedAgentId,
        }));
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
          // Update locally anyway for demo
          set((state) => ({
            agents: state.agents.map((a) =>
              a.id === id ? { ...a, status: 'active' as const, lastActive: 'Now' } : a
            ),
          }));
        }
      },

      stopAgent: async (id) => {
        const response = await apiService.stopAgent(id);
        if (response.success) {
          set((state) => ({
            agents: state.agents.map((a) => (a.id === id ? { ...a, status: 'idle' as const } : a)),
          }));
        } else {
          // Update locally anyway for demo
          set((state) => ({
            agents: state.agents.map((a) => (a.id === id ? { ...a, status: 'idle' as const } : a)),
          }));
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
      partialize: (state) => ({ selectedAgentId: state.selectedAgentId }),
    }
  )
);
