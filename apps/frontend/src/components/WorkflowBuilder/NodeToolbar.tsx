import { FileText } from 'lucide-react';
import React, { useState } from 'react';
import {
  FaBell,
  FaChevronDown,
  FaCode,
  FaDatabase,
  FaFileAlt,
  FaGlobe,
  FaMemory,
  FaPlus,
  FaRobot,
  FaSearch,
  FaTools,
  FaWaveSquare,
} from 'react-icons/fa';

interface NodeToolbarProps {
  onAddNode: (nodeType: string, position: { x: number; y: number }) => void;
}

const nodeCategories = [
  {
    name: 'AI',
    nodes: [
      {
        type: 'llm',
        label: 'LLM Completion',
        icon: FaRobot,
        description: 'Generate text using an LLM',
      },
      { type: 'tool', label: 'Tool Execution', icon: FaTools, description: 'Execute an AI tool' },
      {
        type: 'promptTemplate',
        label: 'Prompt Template',
        icon: FileText,
        description: 'Use a versioned prompt template',
      },
    ],
  },
  {
    name: 'Data',
    nodes: [
      {
        type: 'transform',
        label: 'Transform',
        icon: FaCode,
        description: 'Transform data (format, structure)',
      },
      {
        type: 'data',
        label: 'Data Source',
        icon: FaDatabase,
        description: 'Load data from a source',
      },
      { type: 'storage', label: 'Data Storage', icon: FaMemory, description: 'Store data' },
    ],
  },
  {
    name: 'Integration',
    nodes: [
      {
        type: 'api',
        label: 'API Call',
        icon: FaGlobe,
        description: 'Make HTTP requests to external APIs',
      },
      {
        type: 'webhook',
        label: 'Webhook',
        icon: FaWaveSquare,
        description: 'Send data to webhook endpoints',
      },
      {
        type: 'notification',
        label: 'Notification',
        icon: FaBell,
        description: 'Send notifications',
      },
    ],
  },
  {
    name: 'Advanced',
    nodes: [
      {
        type: 'vectorStore',
        label: 'Vector Store',
        icon: FaSearch,
        description: 'Work with vector databases',
      },
      {
        type: 'documentProcessing',
        label: 'Document Processing',
        icon: FaFileAlt,
        description: 'Process and chunk documents',
      },
      { type: 'condition', label: 'Condition', icon: FaCode, description: 'Conditional branching' },
    ],
  },
];

export const NodeToolbar: React.FC<NodeToolbarProps> = ({ onAddNode }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleAddNode = (nodeType: string) => {
    // Calculate position - in a real app this might be based on the current view
    const position = {
      x: Math.random() * 300 + 100,
      y: Math.random() * 200 + 100,
    };
    onAddNode(nodeType, position);
  };

  return (
    <div className="absolute top-[70px] left-[10px] z-10 bg-transparent p-2 rounded-md border shadow-md">
      <div className="flex items-center space-x-2">
        <div className="relative group">
          <button className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
            <FaPlus className="w-3 h-3" />
            <span>Add Node</span>
          </button>
          <div className="absolute bottom-full left-0 mb-1 px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Add a node
          </div>
        </div>

        {nodeCategories.map((category) => (
          <div key={category.name} className="relative">
            <div className="relative group">
              <button
                className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-muted/20 transition-colors"
                onClick={() =>
                  setExpandedCategory(expandedCategory === category.name ? null : category.name)
                }
              >
                <span>{category.name}</span>
                <FaChevronDown className="w-3 h-3" />
              </button>
              <div className="absolute bottom-full left-0 mb-1 px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Add {category.name} nodes
              </div>
            </div>
            {expandedCategory === category.name && (
              <div className="absolute top-full left-0 mt-1 bg-transparent border border-gray-200 rounded-md shadow-none z-10 min-w-[200px]">
                {category.nodes.map((node) => (
                  <button
                    key={node.type}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-left hover:bg-muted/20 transition-colors relative"
                    onClick={() => {
                      handleAddNode(node.type);
                      setExpandedCategory(null);
                    }}
                    onMouseEnter={() => setHoveredNode(node.type)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <node.icon className="w-4 h-4" />
                    <span>{node.label}</span>
                    {hoveredNode === node.type && (
                      <div className="absolute right-[-220px] top-0 w-[200px] p-2 bg-transparent border border-gray-200 rounded-md shadow-md">
                        <p className="text-sm">{node.description}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
