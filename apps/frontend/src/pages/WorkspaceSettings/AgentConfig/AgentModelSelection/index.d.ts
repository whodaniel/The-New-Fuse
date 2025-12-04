import React from 'react';
interface AgentModelSelectionProps {
    provider: string;
    workspace: {
        agentModel?: string;
    };
    setHasChanges: (hasChanges: boolean) => void;
}
export default function AgentModelSelection({ provider, workspace, setHasChanges, }: AgentModelSelectionProps): React.ReactElement;
export {};
