import { useA2AContext } from '../context/A2AContext';

export const useA2AAgents = () => {
  const context = useA2AContext();
  return {
    agents: context.agents,
    isConnected: context.isConnected,
  };
};