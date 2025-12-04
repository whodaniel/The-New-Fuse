import React from 'react';
interface ChatModelSelectionProps {
    provider: string;
    workspace: {
        chatModel?: string;
    };
    setHasChanges: (hasChanges: boolean) => void;
}
export default function ChatModelSelection({ provider, workspace, setHasChanges, }: ChatModelSelectionProps): React.ReactElement | null;
export {};
