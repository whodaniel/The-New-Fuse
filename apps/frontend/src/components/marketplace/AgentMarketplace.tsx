import React from 'react';
import { Card } from '@/components/ui/card';
import { SearchInput } from '@/components/ui/search';
import { useAgentMarketplace } from '@/hooks/useAgentMarketplace';

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  rating: number;
  downloads: number;
}

export const AgentMarketplace: React.FC = () => {
  const { agents, loading, search } = useAgentMarketplace();
  const [filter, setFilter] = React.useState('');

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <SearchInput
          value={filter}
          onChange={setFilter}
          placeholder="Search agents..."
        />
        
        <Select
          value={sortBy}
          onChange={setSortBy}
          options={[
            { label: 'Most Popular', value: 'downloads' },
            { label: 'Highest Rated', value: 'rating' },
            { label: 'Newest', value: 'created' }
          ]}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Card key={agent.id} className="p-4">
            <h3>{agent.name}</h3>
            <p>{agent.description}</p>
            <div className="flex gap-2">
              {agent.capabilities.map((cap) => (
                <Badge key={cap}>{cap}</Badge>
              ))}
            </div>
            <div className="mt-4 flex justify-between">
              <StarRating value={agent.rating} />
              <span>{agent.downloads} downloads</span>
            </div>
            <Button
              className="mt-4 w-full"
              onClick={() => {/* Install agent */}}
            >
              Install Agent
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};