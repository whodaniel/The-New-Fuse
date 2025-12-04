import React from 'react';
interface MassOptimizationPanelProps {
    agentId?: string;
    agentIds?: string[];
    topologyId?: string;
    onOptimizationComplete?: (result: any) => void;
}
export declare const MassOptimizationPanel: React.FC<MassOptimizationPanelProps>;
export {};
