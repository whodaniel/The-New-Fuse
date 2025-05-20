import React from 'react';
import { NodeType } from '../constants/nodeTypes.js';
import { AIProcessingConfig } from './config/AIProcessingConfig.js';
import { ApiNodeConfig } from './config/ApiNodeConfig.js';
import { DataTransformConfig } from './config/DataTransformConfig.js';
import { MCPNodeConfig } from './config/MCPNodeConfig.js';
import { MCPWorkflowNodeConfig } from './config/MCPWorkflowNodeConfig.js';
import { AINewsAgentConfig } from './config/AINewsAgentConfig.js';

/**
 * Factory function to return the appropriate configuration component based on node type
 */
export function getNodeConfigComponent(nodeType: string, data: any, onChange: (data: any) => void) {
  switch (nodeType) {
    case NodeType.AI_PROCESSING:
      return <AIProcessingConfig data={data} onChange={onChange} />;
    case NodeType.API:
      return <ApiNodeConfig data={data} onChange={onChange} />;
    case NodeType.DATA_TRANSFORM:
      return <DataTransformConfig data={data} onChange={onChange} />;
    case NodeType.MCP:
      return <MCPNodeConfig data={data} onChange={onChange} />;
    case NodeType.MCP_WORKFLOW:
      return <MCPWorkflowNodeConfig data={data} onChange={onChange} />;
    case NodeType.AI_NEWS_AGENT:
      return <AINewsAgentConfig data={data} onChange={onChange} />;
    default:
      return <div className="p-4 text-sm text-gray-500">No configuration available for this node type.</div>;
  }
}