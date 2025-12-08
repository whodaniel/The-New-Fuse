import React, { useState, useEffect } from 'react';
import { FaPlus, FaPlay, FaStop, FaTrash } from 'react-icons/fa';
import { Button } from '../../ui/design-system';
import { useWizard } from './WizardProvider';
import { AgentState } from '../../domain/core/wizards/types/agent_types';

interface AgentConfigProps {
  onUpdate: (agents: Map<string, any>) => void;
}

export const AgentConfig: React.FC<AgentConfigProps> = ({ onUpdate }) => {
  const { state } = useWizard();
  const [agents, setAgents] = useState<Map<string, any>>(new Map());
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentType, setNewAgentType] = useState('');

  useEffect(() => {
    if (state.session?.active_agents) {
      setAgents(state.session.active_agents);
    }
  }, [state.session]);

  const handleAddAgent = () => {
    if (!newAgentName || !newAgentType) return;

    const newAgent = {
      id: `agent_${Date.now()}`,
      name: newAgentName,
      type: newAgentType,
      state: AgentState.IDLE,
      tasks: [],
      performance: {
        cpu_usage: 0,
        memory_usage: 0,
        task_completion_rate: 0
      }
    };

    const updatedAgents = new Map(agents);
    updatedAgents.set(newAgent.id, newAgent);
    setAgents(updatedAgents);
    onUpdate(updatedAgents);

    setNewAgentName('');
    setNewAgentType('');
  };

  const handleRemoveAgent = (agentId: string) => {
    const updatedAgents = new Map(agents);
    updatedAgents.delete(agentId);
    setAgents(updatedAgents);
    onUpdate(updatedAgents);
  };

  const handleToggleAgent = (agentId: string) => {
    const updatedAgents = new Map(agents);
    const agent = updatedAgents.get(agentId);
    if (agent) {
      agent.state = agent.state === AgentState.ACTIVE ? AgentState.IDLE : AgentState.ACTIVE;
      updatedAgents.set(agentId, agent);
      setAgents(updatedAgents);
      onUpdate(updatedAgents);
    }
  };

  const getStateColor = (state: AgentState) => {
    switch (state) {
      case AgentState.ACTIVE:
        return 'text-green-600 bg-green-100';
      case AgentState.IDLE:
        return 'text-gray-600 bg-gray-100';
      case AgentState.ERROR:
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Add New Agent Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Add New Agent</h3>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium mb-1">Agent Name</label>
            <input
              type="text"
              value={newAgentName}
              onChange={(e) => setNewAgentName(e.target.value)}
              className="input w-full"
              placeholder="e.g., Code Reviewer"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium mb-1">Agent Type</label>
            <select
              value={newAgentType}
              onChange={(e) => setNewAgentType(e.target.value)}
              className="input w-full"
            >
              <option value="" disabled>Select Type</option>
              <option value="task_executor">Task Executor</option>
              <option value="knowledge_worker">Knowledge Worker</option>
              <option value="optimization_agent">Optimization Agent</option>
              <option value="integration_agent">Integration Agent</option>
            </select>
          </div>
          <Button
            onClick={handleAddAgent}
            disabled={!newAgentName || !newAgentType}
            className="flex items-center gap-2"
          >
            <FaPlus /> Add Agent
          </Button>
        </div>
      </div>

      {/* Active Agents Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Active Agents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from(agents.values()).map((agent) => (
            <div key={agent.id} className="border border-gray-200 rounded-lg shadow-sm p-4 bg-white">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-lg">{agent.name}</h4>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStateColor(agent.state)}`}>
                    {agent.state}
                  </span>

                  <button
                    onClick={() => handleToggleAgent(agent.id)}
                    className={`p-1.5 rounded-full transition-colors ${
                      agent.state === AgentState.ACTIVE
                        ? 'text-red-500 hover:bg-red-50'
                        : 'text-green-500 hover:bg-green-50'
                    }`}
                    title={agent.state === AgentState.ACTIVE ? 'Stop Agent' : 'Start Agent'}
                  >
                    {agent.state === AgentState.ACTIVE ? <FaStop /> : <FaPlay />}
                  </button>

                  <button
                    onClick={() => handleRemoveAgent(agent.id)}
                    className="p-1.5 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                    title="Remove Agent"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                Type: {agent.type}
              </div>

              <div>
                <h5 className="text-sm font-medium mb-2">Performance Metrics</h5>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>CPU Usage</span>
                    <span>{agent.performance.cpu_usage}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Memory</span>
                    <span>{agent.performance.memory_usage}MB</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Tasks</span>
                    <span>{agent.tasks.length}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {agents.size === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500 border border-dashed border-gray-200 rounded-lg">
              No active agents. Add one above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
