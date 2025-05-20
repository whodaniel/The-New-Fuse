import React, { useEffect } from 'react';
import { useAgentsWorkflow, useMcpTools } from '@/hooks';
import { Card } from '@/components/ui/card';
import {
  Bot,
  Code,
  GitBranch,
  FileText,
  Database,
  Zap,
  Bell,
  ArrowRight,
  Play,
  CheckCircle,
  Network,
  Repeat,
  Layers
} from 'lucide-react';

interface NodeTypeItem {
  type: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  category: 'agent' | 'tool' | 'flow' | 'io';
  color: string;
}

const nodeTypes: NodeTypeItem[] = [
  // Agent nodes
  {
    type: 'agent',
    label: 'Agent',
    icon: <Bot className="h-5 w-5" />,
    description: 'Execute tasks using an AI agent',
    category: 'agent',
    color: 'bg-indigo-100 text-indigo-600'
  },
  {
    type: 'mcpTool',
    label: 'MCP Tool',
    icon: <Code className="h-5 w-5" />,
    description: 'Use an MCP tool or command',
    category: 'tool',
    color: 'bg-emerald-100 text-emerald-600'
  },

  // Flow control nodes
  {
    type: 'condition',
    label: 'Condition',
    icon: <GitBranch className="h-5 w-5" />,
    description: 'Branch based on a condition',
    category: 'flow',
    color: 'bg-amber-100 text-amber-600'
  },
  {
    type: 'transform',
    label: 'Transform',
    icon: <Zap className="h-5 w-5" />,
    description: 'Transform data between nodes',
    category: 'flow',
    color: 'bg-purple-100 text-purple-600'
  },
  {
    type: 'loop',
    label: 'Loop',
    icon: <Repeat className="h-5 w-5" />,
    description: 'Iterate over a collection or condition',
    category: 'flow',
    color: 'bg-orange-100 text-orange-600'
  },
  {
    type: 'subworkflow',
    label: 'Subworkflow',
    icon: <Layers className="h-5 w-5" />,
    description: 'Execute a nested workflow',
    category: 'flow',
    color: 'bg-teal-100 text-teal-600'
  },

  // I/O nodes
  {
    type: 'input',
    label: 'Input',
    icon: <Play className="h-5 w-5" />,
    description: 'Starting point of the workflow',
    category: 'io',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    type: 'output',
    label: 'Output',
    icon: <CheckCircle className="h-5 w-5" />,
    description: 'End point of the workflow',
    category: 'io',
    color: 'bg-red-100 text-red-600'
  },
  {
    type: 'notification',
    label: 'Notification',
    icon: <Bell className="h-5 w-5" />,
    description: 'Send a notification',
    category: 'io',
    color: 'bg-sky-100 text-sky-600'
  },
  {
    type: 'a2a',
    label: 'A2A Communication',
    icon: <Network className="h-5 w-5" />,
    description: 'Agent-to-Agent communication',
    category: 'agent',
    color: 'bg-pink-100 text-pink-600'
  }
];

export const NodeToolbox: React.FC = () => {
  const { agents, loading: agentsLoading } = useAgentsWorkflow();
  const { tools, loading: toolsLoading } = useMcpTools();
  // Handle drag start
  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string, nodeData: any) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType);
    event.dataTransfer.setData('application/reactflow/data', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Agents & Tools</h4>
        <div className="space-y-2">
          {nodeTypes
            .filter(nod(e: any) => ['agent', 'tool'].includes(node.category))
            .map(nod(e: any) => (
              <div
                key={node.type}
                className="flex items-center p-2 border border-dashed rounded-md cursor-grab hover:bg-gray-50 transition-colors"
                draggable
                onDragStart={(e) => onDragStart(e, node.type, {
                  label: node.label,
                  type: node.type,
                  status: 'idle'
                })}
              >
                <div className={`p-2 rounded-md ${node.color} mr-3`}>
                  {node.icon}
                </div>
                <div>
                  <div className="font-medium text-sm">{node.label}</div>
                  <div className="text-xs text-gray-500">{node.description}</div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Flow Control</h4>
        <div className="space-y-2">
          {nodeTypes
            .filter(nod(e: any) => node.category === 'flow')
            .map(nod(e: any) => (
              <div
                key={node.type}
                className="flex items-center p-2 border border-dashed rounded-md cursor-grab hover:bg-gray-50 transition-colors"
                draggable
                onDragStart={(e) => onDragStart(e, node.type, {
                  label: node.label,
                  type: node.type,
                  status: 'idle'
                })}
              >
                <div className={`p-2 rounded-md ${node.color} mr-3`}>
                  {node.icon}
                </div>
                <div>
                  <div className="font-medium text-sm">{node.label}</div>
                  <div className="text-xs text-gray-500">{node.description}</div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Input & Output</h4>
        <div className="space-y-2">
          {nodeTypes
            .filter(nod(e: any) => node.category === 'io')
            .map(nod(e: any) => (
              <div
                key={node.type}
                className="flex items-center p-2 border border-dashed rounded-md cursor-grab hover:bg-gray-50 transition-colors"
                draggable
                onDragStart={(e) => onDragStart(e, node.type, {
                  label: node.label,
                  type: node.type,
                  status: 'idle'
                })}
              >
                <div className={`p-2 rounded-md ${node.color} mr-3`}>
                  {node.icon}
                </div>
                <div>
                  <div className="font-medium text-sm">{node.label}</div>
                  <div className="text-xs text-gray-500">{node.description}</div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default NodeToolbox;
