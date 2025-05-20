import React from 'react';
import { Handle, Position } from 'reactflow';
import { useAIIntegration } from '@/hooks/useAIIntegration';

export const AIIntegrationNode: React.React.FC<AINodeProps> = ({ data }) => {
    const { connect, status, error } = useAIIntegration();

    return (
        <div className="ai-node">
            <Handle type="target" position={Position.Top} />
            <div className="node-content">
                <h3>{data.label}</h3>
                <div className="status-indicator">
                    {status === 'connected' ? '✓' : '⚠'}
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};