import React, { FC, memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { nodeTypes } from '../constants/nodeTypes.js';

const MCPNode: FC<NodeProps> = ({ data, selected }) => {
  return (
    <div
      className={`px-4 py-2 rounded-md shadow-md ${selected ? 'ring-2 ring-purple-500' : ''}`}
      style={{
        backgroundColor: '#8b5cf6', // Purple color for MCP nodes
        minWidth: '180px',
        color: 'white',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#fff' }}
      />
      <div className="flex flex-col">
        <div className="font-medium text-sm">{data.label || 'MCP Agent'}</div>
        <div className="text-xs opacity-80">
          {data.config?.agentType || 'Default'} • {data.config?.modelName ? `${data.config.modelName}` : 'Model'}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="response"
        style={{ background: '#fff' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="error"
        style={{ background: '#f87171' }}
      />
    </div>
  );
};

export default memo(MCPNode);

// Export with the correct name for the node types registry
export { MCPNode };