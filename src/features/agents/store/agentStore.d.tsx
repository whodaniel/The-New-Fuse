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
export declare const useAgentStore: import("zustand").UseBoundStore<
  import("zustand").StoreApi<AgentState>
>;
export {};
