// @ts-nocheck
import { Badge, Label } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { PremiumInput as Input } from '@/components/ui/premium/PremiumInput';
import { useAgentsWorkflow, WorkflowAgent } from '@/hooks/useAgentsWorkflow';
import { Bot, Search, Sparkles } from 'lucide-react';
import React, { memo, useEffect, useState } from 'react';
import { NodeProps } from 'reactflow';
import { BaseNode } from './base-node';

const AgentNode: React.FC<NodeProps> = memo(({ id, data }) => {
  const { agents, agentsByCategory, categoriesWithCounts, searchQuery, setSearchQuery, loading } =
    useAgentsWorkflow();

  const [selectedAgent, setSelectedAgent] = useState<WorkflowAgent | null>(null);

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
          agentType: agent?.type,
          agentCapabilities: agent?.capabilities,
        },
      });
    }
  };

  const inputHandles = [{ id: 'default', label: 'Input' }];

  const outputHandles = [
    { id: 'default', label: 'Output' },
    { id: 'error', label: 'Error' },
  ];

  // Get category color
  const getCategoryColor = (category?: string): string => {
    const colors: Record<string, string> = {
      orchestration: 'bg-purple-600',
      content: 'bg-blue-600',
      marketing: 'bg-green-600',
      social: 'bg-pink-600',
      analytics: 'bg-orange-600',
      technical: 'bg-cyan-600',
      business: 'bg-yellow-600',
      podcast: 'bg-red-600',
      video: 'bg-indigo-600',
      'ai-infrastructure': 'bg-violet-600',
    };
    return colors[category || ''] || 'bg-slate-600';
  };

  const renderContent = () => (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <Input
          type="text"
          placeholder="Search agents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 text-xs pl-8 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
        />
      </div>

      {/* Agent Selector with Grouped Options */}
      <div>
        <Label
          htmlFor={`agent-${id}`}
          className="text-xs font-medium text-slate-200 flex items-center gap-1.5"
        >
          <Bot className="h-3.5 w-3.5" />
          Select Agent
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
            <SelectValue placeholder={loading ? 'Loading agents...' : 'Choose an agent template'} />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600 max-h-80">
            {/* Group agents by category */}
            {categoriesWithCounts
              .filter((cat) => cat.count > 0)
              .map((category) => (
                <SelectGroup key={category.id}>
                  <SelectLabel className="text-xs text-slate-400 font-medium px-2 py-1.5 flex items-center gap-1.5">
                    <span>{category.icon}</span>
                    {category.label}
                    <Badge
                      variant="secondary"
                      className="ml-auto text-xs bg-slate-700 text-slate-300"
                    >
                      {category.count}
                    </Badge>
                  </SelectLabel>
                  {agentsByCategory[category.id]?.map((agent) => (
                    <SelectItem
                      key={agent.id}
                      value={agent.id}
                      className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700 pl-6"
                    >
                      <div className="flex items-center gap-2">
                        <span className="truncate">{agent.name}</span>
                        {agent.isPredefined && (
                          <Sparkles className="h-3 w-3 text-yellow-400 flex-shrink-0" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}

            {/* Show message if no agents found */}
            {agents.length === 0 && !loading && (
              <div className="px-3 py-2 text-center text-xs text-slate-400">
                No agents match your search.
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Selected Agent Details */}
      {selectedAgent && (
        <div className="space-y-2">
          {/* Agent Info Card */}
          <div className="text-xs bg-slate-700/50 p-3 rounded-md border border-slate-600">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Badge className={`${getCategoryColor(selectedAgent.category)} text-white text-xs`}>
                  {selectedAgent.type}
                </Badge>
                {selectedAgent.isPredefined && (
                  <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">
                    <Sparkles className="h-2.5 w-2.5 mr-1" />
                    Template
                  </Badge>
                )}
              </div>
            </div>

            {selectedAgent.description && (
              <p className="text-slate-300 leading-relaxed mb-2">{selectedAgent.description}</p>
            )}

            {/* Capabilities */}
            {selectedAgent.capabilities.length > 0 && (
              <div className="mt-2">
                <span className="text-slate-400 text-xs">Capabilities:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedAgent.capabilities.slice(0, 5).map((cap, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-xs bg-slate-600/30 text-slate-300 border-slate-500"
                    >
                      {cap}
                    </Badge>
                  ))}
                  {selectedAgent.capabilities.length > 5 && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-slate-600/30 text-slate-400 border-slate-500"
                    >
                      +{selectedAgent.capabilities.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Tools */}
            {selectedAgent.tools && selectedAgent.tools.length > 0 && (
              <div className="mt-2">
                <span className="text-slate-400 text-xs">Tools:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedAgent.tools.map((tool, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-xs bg-blue-600/20 text-blue-300 border-blue-500/50"
                    >
                      🔧 {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Help text */}
          <p className="text-xs text-slate-400 leading-relaxed">
            💡 This agent will process the input and execute based on its capabilities.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!selectedAgent && !loading && (
        <div className="text-xs text-slate-400 bg-slate-700/30 p-3 rounded border border-slate-600/50 text-center">
          <Bot className="h-6 w-6 mx-auto mb-2 text-slate-400" />
          <p>Select an agent template to configure this node.</p>
          <p className="mt-1 text-slate-400">
            {agents.length} agents available across {categoriesWithCounts.length} categories.
          </p>
        </div>
      )}
    </div>
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
