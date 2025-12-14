import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAgentsWorkflow } from '@/hooks/useAgentsWorkflow';
import { Agent } from '@/services/AgentService';
import React, { memo, useEffect, useState } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './base-node';

const AgentNode: React.FC<NodeProps> = memo(({ id, data }) => {
  const { agents, loading } = useAgentsWorkflow();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Load selected agent details
  useEffect(() => {
    if (data.config?.agentId && agents.length > 0) {
      const agent = agents.find((a) => a.id === data.config.agentId);
      if (agent) {
        setSelectedAgent(agent);
      }
    }
  }, [data.config, agents]);

  // Update node when agent selection changes
  const handleAgentChange = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    setSelectedAgent(agent || null);

    if (data.onUpdate) {
      data.onUpdate({
        name: agent?.name || 'Agent',
        config: {
          ...data.config,
          agentId,
        },
      });
    }
  };

  const inputHandles = [{ id: 'default', label: 'Input' }];

  const outputHandles = [
    { id: 'default', label: 'Output' },
    { id: 'error', label: 'Error' },
  ];

  const renderContent = () => (
    <>
      <div className="space-y-3">
        <div>
          <Label htmlFor={`agent-${id}`} className="text-xs font-medium text-slate-200">
            Agent
          </Label>
          <Select
            value={data.config?.agentId || ''}
            onValueChange={handleAgentChange}
            disabled={loading}
          >
            <SelectTrigger
              id={`agent-${id}`}
              className="text-xs h-9 mt-1.5 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              <SelectValue placeholder="Select agent" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {agents.map((agent) => (
                <SelectItem
                  key={agent.id}
                  value={agent.id}
                  className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700"
                >
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedAgent && (
          <div className="text-xs text-slate-300 bg-slate-700/50 p-2 rounded border border-slate-600">
            <p className="font-medium">
              <span className="text-slate-100">Type:</span> {selectedAgent.type}
            </p>
            {selectedAgent.description && (
              <p className="mt-1.5 text-slate-300 line-clamp-2 leading-relaxed">
                {selectedAgent.description}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );

  return (
    <BaseNode
      id={id}
      data={{
        ...data,
        name: selectedAgent?.name || data.name || 'Agent',
        type: 'agent',
        renderContent,
      }}
      inputHandles={inputHandles}
      outputHandles={outputHandles}
    />
  );
});

AgentNode.displayName = 'AgentNode';

export { AgentNode };
