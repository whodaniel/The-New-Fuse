import React from 'react';
interface MassBlockExecutorProps {
    availableAgents: Array<{
        id: string;
        name: string;
        type: string;
    }>;
    onExecutionComplete?: (result: any) => void;
}
export declare const MassBlockExecutor: React.FC<MassBlockExecutorProps>;
export {};
