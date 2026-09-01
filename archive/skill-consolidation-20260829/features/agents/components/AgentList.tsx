import React from 'react';
import { useQuery } from 'react-query';
import { useApi } from '../../hooks/useApi';
import { AgentCard } from './AgentCard.js';
import { AgentSearch } from './AgentSearch.js';
import { AgentFilters } from './AgentFilters';

const AgentList: React.FC = () => {
  const api = useApi();

  const { data: agents, isLoading, isError } = useQuery('agents', api.getAgents);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading agents</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <AgentSearch />
        <AgentFilters />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents?.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
};

export default AgentList;