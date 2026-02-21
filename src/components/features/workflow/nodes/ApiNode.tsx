import React, { FC, memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { nodeTypes } from '../constants/nodeTypes.js';

const ApiNode: FC<NodeProps> = ({ data, selected }) => {
  return (
    <div
      className={`px-4 py-2 rounded-md shadow-md ${selected ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        backgroundColor: '#3b82f6', // Blue color for API nodes
        minWidth: '180px',
        color: 'white',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="body"
        style={{ background: '#fff' }}
      />
      <div className="flex flex-col">
        <div className="font-medium text-sm">{data.label || 'API Request'}</div>
        <div className="text-xs opacity-80">
          {data.config?.method || 'GET'} {data.config?.url ? `• ${data.config.url.substring(0, 15)}${data.config.url.length > 15 ? '...' : ''}` : ''}
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

export default memo(ApiNode);

// Export with the correct name for the node types registry
export { ApiNode };