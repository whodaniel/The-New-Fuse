import { NodeCategory } from '../types.js';
import { nodeConfigurationSchema } from '../schemas/nodeConfiguration.js';
import {
  BrainCircuit,
  Database,
  Globe,
  MessageSquare,
  FileCode,
  GitBranch,
  Cpu,
  Newspaper,
} from "lucide-react";

export const nodeCategories: NodeCategory[] = [
  {
    id: "ai",
    label: "AI Processing",
    nodes: [
      {
        type: "aiProcessingNode",
        label: "AI Process",
        icon: BrainCircuit,
        category: "ai",
        inputs: [
          { id: "prompt", label: "Prompt", type: "string", required: true },
          { id: "context", label: "Context", type: "object" },
        ],
        outputs: [
          { id: "response", label: "Response", type: "string" },
          { id: "tokens", label: "Token Usage", type: "object" },
        ],
        configSchema: nodeConfigurationSchema.aiProcessingNode,
      },
    ],
  },
  {
    id: "data",
    label: "Data Processing",
    nodes: [
      {
        type: "dataTransformNode",
        label: "Transform",
        icon: Database,
        category: "data",
        inputs: [{ id: "input", label: "Input", type: "any", required: true }],
        outputs: [{ id: "output", label: "Output", type: "any" }],
        configSchema: nodeConfigurationSchema.dataTransformNode,
      },
    ],
  },
  {
    id: "api",
    label: "API",
    nodes: [
      {
        type: "apiNode",
        label: "API Request",
        icon: Globe,
        category: "api",
        inputs: [{ id: "body", label: "Request Body", type: "object" }],
        outputs: [
          { id: "response", label: "Response", type: "object" },
          { id: "error", label: "Error", type: "object" },
        ],
        configSchema: nodeConfigurationSchema.apiNode,
      },
    ],
  },
  {
    id: "agent",
    label: "AI Agents",
    nodes: [
      {
        type: "aiNewsAgent",
        label: "AI News Agent",
        icon: Newspaper,
        category: "agent",
        inputs: [{ id: "input", label: "Input", type: "object" }],
        outputs: [{ id: "output", label: "News Data", type: "object" }],
        configSchema: {},
      },
    ],
  },
  {
    id: "mcp",
    label: "MCP Integration",
    nodes: [
      {
        type: "mcpNode",
        label: "MCP Agent",
        icon: Cpu,
        category: "mcp",
        inputs: [{ id: "input", label: "Input", type: "object", required: true }],
        outputs: [
          { id: "response", label: "Response", type: "object" },
          { id: "error", label: "Error", type: "object" },
        ],
        configSchema: nodeConfigurationSchema.mcpNode,
      },
      {
        type: "mcpWorkflowNode",
        label: "MCP Workflow",
        icon: GitBranch,
        category: "mcp",
        inputs: [{ id: "workflow_input", label: "Workflow Input", type: "object", required: true }],
        outputs: [
          { id: "workflow_output", label: "Workflow Output", type: "object" },
          { id: "workflow_error", label: "Error", type: "object" },
        ],
        configSchema: nodeConfigurationSchema.mcpWorkflowNode,
      },
    ],
  },
];

export const NODE_TYPES = {
  aiProcessingNode: "aiProcessingNode",
  dataTransformNode: "dataTransformNode",
  apiNode: "apiNode",
  mcpNode: "mcpNode",
  mcpWorkflowNode: "mcpWorkflowNode",
} as const;

// Node type constants for the workflow builder
export enum NodeType {
  AI_PROCESSING = 'aiProcessingNode',
  API = 'apiNode',
  DATA_TRANSFORM = 'dataTransformNode',
  MCP = 'mcpNode',
  MCP_WORKFLOW = 'mcpWorkflowNode',
  AI_NEWS_AGENT = 'aiNewsAgent',
}

// Node category colors for the minimap
export const NODE_COLORS: Record<string, string> = {
  ai: '#7c3aed', // purple
  api: '#2563eb', // blue
  data: '#059669', // green
  workflow: '#d97706', // amber
  agent: '#dc2626', // red
  default: '#6b7280', // gray
};
