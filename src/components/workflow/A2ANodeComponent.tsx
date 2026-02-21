import React from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { NodeProps } from '../types.js';

export const A2ANodeComponent: React.FC<NodeProps> = ({ data }) => {
    return (
        <div className="agent-node">
            <Handle type="target" position={Position.Left} id="input" />
            <Handle type="target" position={Position.Left} id="context" style={{ top: 20 }} />
            <Handle type="target" position={Position.Left} id="configuration" style={{ top: 40 }} />
            
            <div className="node-content">
                <h3>{data.label}</h3>
                <div className="agent-type">{data.agentType}</div>
                <div className="status">{data.status}</div>
            </div>
            
            <Handle type="source" position={Position.Right} id="result" />
            <Handle type="source" position={Position.Right} id="error" style={{ top: 20 }} />
            <Handle type="source" position={Position.Right} id="status" style={{ top: 40 }} />
        </div>
    );
};