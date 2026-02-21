import React, { FC, memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { nodeTypes } from '../constants/nodeTypes.js';

const MCPWorkflowNode: FC<NodeProps> = ({ data, selected }) => {
  return (
    <div
      className={`px-4 py-2 rounded-md shadow-md ${selected ? 'ring-2 ring-indigo-500' : ''}`}
      style={{
        backgroundColor: '#6366f1', // Indigo color for MCP Workflow nodes
        minWidth: '180px',
        color: 'white',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="workflow_input"
        style={{ background: '#fff' }}
      />
      <div className="flex flex-col">
        <div className="font-medium text-sm">{data.label || 'MCP Workflow'}</div>
        <div className="text-xs opacity-80">
          {data.config?.workflowType || 'Standard'} • {data.config?.executionMode || 'Sequential'}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="workflow_output"
        style={{ background: '#fff' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="workflow_error"
        style={{ background: '#f87171' }}
      />
    </div>
  );
};

export default memo(MCPWorkflowNode);

// Export with the correct name for the node types registry
export { MCPWorkflowNode };