import React from "react";
import { AgentList } from './components/AgentList.js';
import { AgentDetails } from './components/AgentDetails.js';
import { AgentControls } from './components/AgentControls.js';
import { useAgentStore } from './store/agentStore.js';
export const AgentModule = (): any => {
    const { agents, selectedAgent, loading, error } = useAgentStore();
    if (loading) {
        return <div>Loading agents...</div>;
    }
    if (error) {
        return <div>Error loading agents: {error}</div>;
    }
    return (<div className="flex h-full">
      <div className="w-1/3 border-r">
        <AgentList agents={agents} selectedAgentId={selectedAgent?.id}/>
      </div>

      <div className="flex-1 p-4">
        {selectedAgent ? (<>
            <AgentDetails agent={selectedAgent}/>
            <AgentControls agent={selectedAgent}/>
          </>) : (<div className="text-center text-gray-500">
            Select an agent to view details
          </div>)}
      </div>
    </div>);
};
