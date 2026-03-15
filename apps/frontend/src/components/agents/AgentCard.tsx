import React from 'react';
import { Agent, AgentStatus } from './types';

interface AgentCardProps {
  agent: Agent;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.ACTIVE:
        return 'bg-green-500';
      case AgentStatus.IDLE:
        return 'bg-yellow-500';
      case AgentStatus.BUSY:
        return 'bg-blue-500';
      case AgentStatus.ERROR:
        return 'bg-red-500';
      case AgentStatus.OFFLINE:
      default:
        return 'bg-transparent0';
    }
  };

  return (
    <div className="bg-transparent dark:bg-transparent shadow-none rounded-md p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{agent.name}</h3>
          <div className="flex items-center">
            <span className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(agent.status)}`}></span>
            <span className="text-sm text-muted-foreground dark:text-muted-foreground">
              {agent.status}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-1">
          Type: {agent.type}
        </p>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
          Last Heartbeat: {new Date(agent.lastHeartbeat).toLocaleDateString()}{' '}
          {new Date(agent.lastHeartbeat).toLocaleTimeString()}
        </p>
      </div>
      <div className="mt-4">
        <details>
          <summary className="text-sm font-medium text-foreground dark:text-gray-300 cursor-pointer">
            Details
          </summary>
          <div className="mt-2 text-xs text-muted-foreground dark:text-muted-foreground">
            <p className="font-bold">Capabilities:</p>
            <ul className="list-disc list-inside">
              {agent.capabilities.map((capability) => (
                <li key={capability}>{capability}</li>
              ))}
            </ul>
            <p className="font-bold mt-2">Config:</p>
            <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
              {JSON.stringify(agent.config, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </div>
  );
};

export default AgentCard;
