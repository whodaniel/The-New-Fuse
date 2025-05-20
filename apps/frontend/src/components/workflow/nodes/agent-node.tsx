import React, { memo, useEffect, useState } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './base-node.js';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAgents, Agent } from '@/hooks/useAgents';

const AgentNode: React.React.FC<NodeProps> = memo(({ id, data }) => {
  const { agents, loading } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  
  // Load selected agent details
  useEffect(() => {
    if (data.config?.agentId && agents.length > 0) {
      const agent = agents.find(a => a.id === data.config.agentId);
      if (agent) {
        setSelectedAgent(agent);
      }
    }
  }, [data.config, agents]);
  
  // Update node when agent selection changes
  const handleAgentChange = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    setSelectedAgent(agent || null);
    
    if (data.onUpdate) {
      data.onUpdate({
        name: agent?.name || 'Agent',
        config: {
          ...data.config,
          agentId
        }
      });
    }
  };
  
  const inputHandles = [
    { id: 'default', label: 'Input' }
  ];
  
  const outputHandles = [
    { id: 'default', label: 'Output' },
    { id: 'error', label: 'Error' }
  ];
  
  const renderContent = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor={`agent-${id}`} className="text-xs">Agent</Label>
        <Select
          value={data.config?.agentId || ''}
          onValueChange={handleAgentChange}
          disabled={loading}
        >
          <SelectTrigger id={`agent-${id}`} className="text-xs h-8">
            <SelectValue placeholder="Select agent" />
          </SelectTrigger>
          <SelectContent>
            {agents.map(agent => (
              <SelectItem key={agent.id} value={agent.id} className="text-xs">
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedAgent && (
          <div className="text-xs text-muted-foreground mt-2">
            <p><strong>Type:</strong> {selectedAgent.type}</p>
            {selectedAgent.description && (
              <p className="mt-1 line-clamp-2">{selectedAgent.description}</p>
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
        renderContent
      }}
      inputHandles={inputHandles}
      outputHandles={outputHandles}
    />
  );
});

AgentNode.displayName = 'AgentNode';

export { AgentNode };