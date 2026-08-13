import React from 'react';
import AgentCard from './AgentCard';
import { Agent, AgentStatus } from './types';

const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'Agent Smith',
    type: 'Chatbot',
    status: AgentStatus.ACTIVE,
    capabilities: ['chat', 'faq'],
    lastHeartbeat: new Date().toISOString(),
    config: { model: 'gpt-3.5-turbo' },
  },
  {
    id: '2',
    name: 'Agent 99',
    type: 'Data Analyst',
    status: AgentStatus.IDLE,
    capabilities: ['data-analysis', 'sql'],
    lastHeartbeat: new Date().toISOString(),
    config: { database: 'analytics-db' },
  },
  {
    id: '3',
    name: 'Agent Carter',
    type: 'Code Monkey',
    status: AgentStatus.BUSY,
    capabilities: ['code-generation', 'debugging'],
    lastHeartbeat: new Date().toISOString(),
    config: { language: 'typescript' },
  },
  {
    id: '4',
    name: 'Agent K',
    type: 'Security',
    status: AgentStatus.ERROR,
    capabilities: ['intrusion-detection', 'firewall'],
    lastHeartbeat: new Date().toISOString(),
    config: { level: 'critical' },
  },
  {
    id: '5',
    name: 'Agent Coulson',
    type: 'Support',
    status: AgentStatus.OFFLINE,
    capabilities: ['ticketing', 'customer-support'],
    lastHeartbeat: new Date(Date.now() - 86400000).toISOString(),
    config: { platform: 'zendesk' },
  },
];

const AgentDashboard: React.FC = () => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Agent Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {mockAgents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
};

export default AgentDashboard;
