import React from 'react';
import { Agent } from '../types/agent.js';
interface AgentCreationStudioProps {
    onSubmit: (agent: Agent) => void;
}
declare const AgentCreationStudio: React.React.FC<AgentCreationStudioProps>;
export default AgentCreationStudio;
