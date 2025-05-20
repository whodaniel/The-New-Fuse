import React from 'react';
import { NodeType } from '../constants/nodeTypes.js';
import { AIProcessingDetailsView } from './details/AIProcessingDetailsView.js';
import { ApiNodeDetailsView } from './details/ApiNodeDetailsView.js';
import { DataTransformDetailsView } from './details/DataTransformDetailsView.js';
import { MCPNodeDetailsView } from './details/MCPNodeDetailsView.js';
import { MCPWorkflowDetailsView } from './details/MCPWorkflowDetailsView.js';
import { AINewsAgentDetailsView } from './details/AINewsAgentDetailsView.js';

/**
 * Factory function to return the appropriate details component based on node type
 */
export function getNodeDetailsComponent(nodeType: string, data: any, callbacks: any = {}) {
  switch (nodeType) {
    case NodeType.AI_PROCESSING:
      return <AIProcessingDetailsView data={data} {...callbacks} />;
    case NodeType.API:
      return <ApiNodeDetailsView data={data} {...callbacks} />;
    case NodeType.DATA_TRANSFORM:
      return <DataTransformDetailsView data={data} {...callbacks} />;
    case NodeType.MCP:
      return <MCPNodeDetailsView data={data} {...callbacks} />;
    case NodeType.MCP_WORKFLOW:
      return <MCPWorkflowDetailsView data={data} {...callbacks} />;
    case NodeType.AI_NEWS_AGENT:
      return <AINewsAgentDetailsView data={data} onRefresh={callbacks.onRefresh} />;
    default:
      return (
        <div className="p-4 border rounded-md shadow bg-white dark:bg-gray-800">
          <h3 className="text-lg font-semibold mb-2">{data?.label || 'Node Details'}</h3>
          <p className="text-sm text-gray-500">
            No detailed view available for node type: {nodeType}
          </p>
        </div>
      );
  }
}