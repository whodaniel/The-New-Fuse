import React from 'react';
interface AgentMenuProps {
    selectedAgent?: string;
    onAgentChange?: (agent: string) => void;
    className?: string;
}
declare const AgentMenu: React.FC<AgentMenuProps>;
export declare const AvailableAgents: React.FC<{
    showing: boolean;
    setShowing: (showing: boolean) => void;
    sendCommand: (command: string, submit?: boolean) => void;
    promptRef?: React.RefObject<HTMLTextAreaElement>;
}>;
export declare const AvailableAgentsButton: React.FC<{
    showing: boolean;
    setShowAgents: (showing: boolean) => void;
}>;
export declare const useAvailableAgents: () => {
    showAgents: boolean;
    setShowAgents: React.Dispatch<React.SetStateAction<boolean>>;
};
export default AgentMenu;
