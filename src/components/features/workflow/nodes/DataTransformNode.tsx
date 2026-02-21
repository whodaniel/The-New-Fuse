import React, { FC, memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { nodeTypes } from '../constants/nodeTypes.js';

const DataTransformNode: FC<NodeProps> = ({ data, selected }) => {
  return (
    <div
      className={`px-4 py-2 rounded-md shadow-md ${selected ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        backgroundColor: '#10b981', // Green color for data nodes
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
        <div className="font-medium text-sm">{data.label || 'Data Transform'}</div>
        <div className="text-xs opacity-80">
          {data.config?.transformationType || 'Transform'}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#fff' }}
      />
    </div>
  );
};

export default memo(DataTransformNode);

// Export with the correct name for the node types registry
export { DataTransformNode };