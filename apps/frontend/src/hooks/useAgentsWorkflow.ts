// @ts-nocheck
import {
  AgentCategory,
  CategoryIcons,
  CategoryLabels,
  getAllCategories,
  PREDEFINED_AGENTS,
  PredefinedAgent,
} from '@/data/predefined-agents';
import { Agent, agentService } from '@/services/AgentService';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Combined agent type that works with both API and predefined agents
export interface WorkflowAgent {
  id: string;
  name: string;
  type: string;
  description?: string;
  category?: AgentCategory;
  capabilities: string[];
  status: 'active' | 'inactive' | 'error';
  isPredefined: boolean;
  tools?: string[];
  color?: string;
}

// Convert API agent to workflow agent
const toWorkflowAgent = (agent: Agent): WorkflowAgent => ({
  id: agent.id,
  name: agent.name,
  type: agent.type,
  description: agent.description,
  capabilities: agent.capabilities,
  status: agent.status,
  isPredefined: false,
});

// Convert predefined agent to workflow agent
const predefinedToWorkflowAgent = (agent: PredefinedAgent): WorkflowAgent => ({
  id: agent.id,
  name: agent.name,
  type: agent.type,
  description: agent.description,
  category: agent.category,
  capabilities: agent.capabilities,
  status: agent.status,
  isPredefined: true,
  tools: agent.tools,
  color: agent.color,
});

export const useAgentsWorkflow = () => {
  const [apiAgents, setApiAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AgentCategory | 'all'>('all');

  // Load agents from API
  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedAgents = await agentService.getAgents();
      setApiAgents(fetchedAgents);
    } catch (err) {
      // API might not be available, which is okay - we have predefined agents
      console.warn('Could not fetch agents from API, using predefined agents:', err);
      setApiAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load agents on mount
  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  // Convert predefined agents to workflow agents
  const predefinedAgents = useMemo(() => PREDEFINED_AGENTS.map(predefinedToWorkflowAgent), []);

  // Convert API agents to workflow agents
  const convertedApiAgents = useMemo(() => apiAgents.map(toWorkflowAgent), [apiAgents]);

  // Combine all agents (API agents first, then predefined)
  const allAgents = useMemo(() => {
    // Remove duplicates - prefer API agents over predefined
    const apiAgentIds = new Set(convertedApiAgents.map((a) => a.id));
    const filteredPredefined = predefinedAgents.filter((a) => !apiAgentIds.has(a.id));
    return [...convertedApiAgents, ...filteredPredefined];
  }, [convertedApiAgents, predefinedAgents]);

  // Filter agents by search and category
  const filteredAgents = useMemo(() => {
    let result = allAgents;

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((a) => a.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.description?.toLowerCase().includes(query) ||
          a.type.toLowerCase().includes(query) ||
          a.capabilities.some((cap) => cap.toLowerCase().includes(query))
      );
    }

    return result;
  }, [allAgents, selectedCategory, searchQuery]);

  // Group agents by category for display
  const agentsByCategory = useMemo(() => {
    const grouped: Record<AgentCategory, WorkflowAgent[]> = {} as Record<
      AgentCategory,
      WorkflowAgent[]
    >;

    for (const category of getAllCategories()) {
      grouped[category] = allAgents.filter((a) => a.category === category);
    }

    return grouped;
  }, [allAgents]);

  // Get categories with agent counts
  const categoriesWithCounts = useMemo(() => {
    return getAllCategories().map((category) => ({
      id: category,
      label: CategoryLabels[category],
      icon: CategoryIcons[category],
      count: agentsByCategory[category]?.length || 0,
    }));
  }, [agentsByCategory]);

  return {
    // All agents (combined)
    agents: filteredAgents,
    allAgents,

    // Separate agent sources
    apiAgents: convertedApiAgents,
    predefinedAgents,

    // Grouped by category
    agentsByCategory,
    categoriesWithCounts,

    // Search and filter
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,

    // State
    loading,
    error,
    loadAgents,

    // Category helpers
    CategoryLabels,
    CategoryIcons,
  };
};

export default useAgentsWorkflow;
