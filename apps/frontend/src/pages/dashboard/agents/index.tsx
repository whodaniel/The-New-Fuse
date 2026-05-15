// @ts-nocheck
import { GlassCard } from '@/components/ui';
import { AgentFilters } from '@/components/agents/AgentFilters';
import { AgentForm } from '@/components/agents/AgentForm';
import { AgentMetricsDisplay } from '@/components/agents/AgentMetrics';
import { BaseLayout } from '@/components/layout/BaseLayout';
import { useState } from 'react';
import { toast } from 'react-toastify';
export default function AgentsPage() {
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
  });
  const handleAgentSubmit = async (data) => {
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create agent');
      toast.success('Agent created successfully');
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error('Failed to create agent');
    }
  };
  const handleMetricsUpdate = (metrics) => {};
  return (
    <BaseLayout className="p-4" showSidebar={true} showHeader={true}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <GlassCard className="p-4">
            <div className="p-4">
              <h2 className="text-2xl font-bold mb-4">Create New Agent</h2>
              <AgentForm
                onSubmit={handleAgentSubmit}
                availableModels={['gpt-4', 'gpt-3.5-turbo', 'claude-v1']}
                availableCapabilities={[
                  'text-generation',
                  'code-generation',
                  'image-generation',
                  'audio-processing',
                ]}
              />
            </div>
          </GlassCard>

          {selectedAgentId && (
            <GlassCard className="mt-6 p-4">
              <div className="p-4">
                <h2 className="text-2xl font-bold mb-4">Agent Metrics</h2>
                <AgentMetricsDisplay
                  agentId={selectedAgentId}
                  refreshInterval={30000}
                  onMetricsUpdate={handleMetricsUpdate}
                />
              </div>
            </GlassCard>
          )}
        </div>

        <div>
          <AgentFilters
            filters={filters}
            onFilterChange={setFilters}
            availableCapabilities={[
              'text-generation',
              'code-generation',
              'image-generation',
              'audio-processing',
            ]}
            availableModels={['gpt-4', 'gpt-3.5-turbo', 'claude-v1']}
          />
        </div>
      </div>
    </BaseLayout>
  );
}
