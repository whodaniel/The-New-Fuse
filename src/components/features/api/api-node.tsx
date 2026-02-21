import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { APIEndpoint } from './types.js';

interface APINodeData {
  endpoint: APIEndpoint;
  isActive: boolean;
}

export const APINode: React.FC<NodeProps<APINodeData>> = ({ data }) => {
  const { endpoint, isActive } = data;
  
  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'bg-green-500',
      POST: 'bg-blue-500',
      PUT: 'bg-yellow-500',
      DELETE: 'bg-red-500',
      PATCH: 'bg-purple-500',
      default: 'bg-gray-500'
    };
    return colors[method as keyof typeof colors] || colors.default;
  };

  return (
    <div className={`px-4 py-2 rounded-lg border ${isActive ? 'border-primary' : 'border-border'} bg-background`}>
      <Handle type="target" position={Position.Left} />
      
      <div className="flex items-center space-x-2">
        <span className={`px-2 py-1 text-xs text-white rounded ${getMethodColor(endpoint.method)}`}>
          {endpoint.method}
        </span>
        <span className="font-medium">{endpoint.name}</span>
      </div>
      
      <p className="mt-1 text-sm text-muted-foreground">{endpoint.path}</p>
      
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default APINode;