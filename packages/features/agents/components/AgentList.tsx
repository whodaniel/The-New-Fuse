'use client';

import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { AgentCard } from './AgentCard';
import { AgentFilters } from './AgentFilters';
import { AgentSearch } from './AgentSearch';
import { Agent, AgentFilters as AgentFiltersType } from './types';

interface AgentListProps {
  onAgentClick?: (agent: Agent) => void;
  filters?: AgentFiltersType;
  onFiltersChange?: (filters: AgentFiltersType) => void;
}

const fetchAgents = async (): Promise<Agent[]> => {
  const response = await fetch('/api/agents');
  if (!response.ok) throw new Error('Failed to fetch agents');
  return response.json();
};

export const AgentList: React.FC<AgentListProps> = ({
  onAgentClick,
  filters = {},
  onFiltersChange,
}) => {
  const {
    data: agents,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
  });

  const handleSearch = (query: string) => {
    onFiltersChange?.({ ...filters, search: query });
  };

  const filteredAgents = agents?.filter((agent) => {
    if (filters.status && agent.status !== filters.status) return false;
    if (filters.capability && !agent.capabilities?.includes(filters.capability)) return false;
    if (filters.model && agent.configuration?.model !== filters.model) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        agent.name.toLowerCase().includes(searchLower) ||
        agent.description?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center text-red-500">Error loading agents. Please try again.</div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <AgentSearch onSearch={handleSearch} />
        <AgentFilters filters={filters} onFilterChange={onFiltersChange || (() => {})} />
      </div>

      {filteredAgents && filteredAgents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onClick={onAgentClick} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No agents found matching your criteria.
        </div>
      )}
    </div>
  );
};
