import { cn } from '@/lib/utils';
import { Bot, ChevronDown } from 'lucide-react';
import React, { useState } from 'react';

interface AgentMenuProps {
  selectedAgent?: string;
  onAgentChange?: (agent: string) => void;
  className?: string;
}

const AgentMenu: React.FC<AgentMenuProps> = ({
  selectedAgent = 'default',
  onAgentChange,
  className,
}) => {
  const agents = [
    { id: 'default', name: 'Default Agent', icon: Bot },
    { id: 'coder', name: 'Code Assistant', icon: Bot },
    { id: 'analyst', name: 'Data Analyst', icon: Bot },
  ];

  return (
    <div className={cn('relative', className)}>
      <button
        className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
        onClick={() => {
          // Basic toggle for now - can be expanded to dropdown
          if (onAgentChange) {
            const nextAgent = selectedAgent === 'default' ? 'coder' : 'default';
            onAgentChange(nextAgent);
          }
        }}
      >
        <Bot className="w-4 h-4" />
        <span>{agents.find((a) => a.id === selectedAgent)?.name || 'Select Agent'}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
    </div>
  );
};

// AvailableAgents component for the dropdown
export const AvailableAgents: React.FC<{
  showing: boolean;
  setShowing: (showing: boolean) => void;
  sendCommand: (command: string, submit?: boolean) => void;
  promptRef?: React.RefObject<HTMLTextAreaElement>;
}> = ({ showing, setShowing, sendCommand, promptRef: _promptRef }) => {
  const agents = [
    { id: 'default', name: 'Default Agent', command: '@default' },
    { id: 'coder', name: 'Code Assistant', command: '@coder' },
    { id: 'analyst', name: 'Data Analyst', command: '@analyst' },
  ];

  if (!showing) return null;

  return (
    <div className="absolute bottom-full mb-2 left-0 bg-transparent dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-none p-2 min-w-[200px]">
      {agents.map((agent) => (
        <button
          key={agent.id}
          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
          onClick={() => {
            sendCommand(agent.command);
            setShowing(false);
          }}
        >
          {agent.name}
        </button>
      ))}
    </div>
  );
};

// AvailableAgentsButton component
export const AvailableAgentsButton: React.FC<{
  showing: boolean;
  setShowAgents: (showing: boolean) => void;
}> = ({ showing, setShowAgents }) => {
  return (
    <button
      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
      onClick={() => setShowAgents(!showing)}
      title="Select agent"
    >
      <Bot className="w-4 h-4" />
    </button>
  );
};

// Hook for managing agent state
export const useAvailableAgents = () => {
  const [showAgents, setShowAgents] = useState(false);
  return { showAgents, setShowAgents };
};

export default AgentMenu;
