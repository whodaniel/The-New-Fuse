import { useMemo, useState } from 'react';
import { Category, NodeTemplate } from '../types/workflow';

// Define available node templates
const defaultNodeTemplates: NodeTemplate[] = [
  // AI Nodes
  {
    type: 'llm',
    label: 'LLM',
    description: 'Large Language Model node',
    icon: '🤖',
    category: 'ai',
    config: {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
    },
  },
  {
    type: 'prompt',
    label: 'Prompt Template',
    description: 'Template for prompts',
    icon: '📝',
    category: 'ai',
    config: {
      template: '',
      variables: [],
    },
  },
  {
    type: 'tool',
    label: 'Tool',
    description: 'External tool integration',
    icon: '🛠️',
    category: 'ai',
    config: {
      toolType: 'api',
      endpoint: '',
    },
  },

  // Data Nodes
  {
    type: 'transform',
    label: 'Transform',
    description: 'Transform data',
    icon: '🔄',
    category: 'data',
    config: {
      transformType: 'map',
      expression: '',
    },
  },
  {
    type: 'storage',
    label: 'Storage',
    description: 'Store and retrieve data',
    icon: '💾',
    category: 'data',
    config: {
      storageType: 'memory',
      key: '',
    },
  },
  {
    type: 'dataSource',
    label: 'Data Source',
    description: 'External data source',
    icon: '📊',
    category: 'data',
    config: {
      sourceType: 'api',
      url: '',
    },
  },

  // Integration Nodes
  {
    type: 'api',
    label: 'API',
    description: 'HTTP API integration',
    icon: '🌐',
    category: 'integration',
    config: {
      method: 'GET',
      url: '',
      headers: {},
    },
  },
  {
    type: 'webhook',
    label: 'Webhook',
    description: 'Webhook trigger',
    icon: '📡',
    category: 'integration',
    config: {
      endpoint: '',
      method: 'POST',
    },
  },
  {
    type: 'notification',
    label: 'Notification',
    description: 'Send notifications',
    icon: '🔔',
    category: 'integration',
    config: {
      type: 'email',
      recipient: '',
    },
  },

  // Flow Control Nodes
  {
    type: 'condition',
    label: 'Condition',
    description: 'Conditional branching',
    icon: '❓',
    category: 'flow',
    config: {
      condition: '',
      operator: 'equals',
    },
  },
  {
    type: 'loop',
    label: 'Loop',
    description: 'Iterate over data',
    icon: '🔁',
    category: 'flow',
    config: {
      loopType: 'forEach',
      items: [],
    },
  },
  {
    type: 'subworkflow',
    label: 'Subworkflow',
    description: 'Execute another workflow',
    icon: '📋',
    category: 'flow',
    config: {
      workflowId: '',
      inputs: {},
    },
  },

  // I/O Nodes
  {
    type: 'input',
    label: 'Input',
    description: 'Workflow input',
    icon: '📥',
    category: 'io',
    config: {
      inputType: 'text',
      required: true,
    },
  },
  {
    type: 'output',
    label: 'Output',
    description: 'Workflow output',
    icon: '📤',
    category: 'io',
    config: {
      outputType: 'text',
    },
  },
  {
    type: 'a2a',
    label: 'A2A Communication',
    description: 'Agent-to-Agent communication',
    icon: '🤝',
    category: 'io',
    config: {
      targetAgent: '',
      protocol: 'direct',
    },
  },
];

// Define categories
const defaultCategories: Category[] = [
  {
    id: 'ai',
    name: 'AI & ML',
    description: 'AI and Machine Learning nodes',
    nodes: [],
  },
  {
    id: 'data',
    name: 'Data Processing',
    description: 'Data transformation and storage',
    nodes: [],
  },
  {
    id: 'integration',
    name: 'Integrations',
    description: 'External service integrations',
    nodes: [],
  },
  {
    id: 'flow',
    name: 'Flow Control',
    description: 'Control flow and logic',
    nodes: [],
  },
  {
    id: 'io',
    name: 'Input/Output',
    description: 'Input and output operations',
    nodes: [],
  },
];

export const useNodeCategories = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Organize nodes by category
  const categories = useMemo(() => {
    const categorizedNodes = defaultCategories.map((category) => ({
      ...category,
      nodes: defaultNodeTemplates.filter((node) => node.category === category.id),
    }));

    // Filter by search term if provided
    if (searchTerm) {
      return categorizedNodes
        .map((category) => ({
          ...category,
          nodes: category.nodes.filter(
            (node) =>
              node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
              node.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
              node.type.toLowerCase().includes(searchTerm.toLowerCase())
          ),
        }))
        .filter((category) => category.nodes.length > 0);
    }

    return categorizedNodes;
  }, [searchTerm]);

  const searchNodes = (term: string) => {
    setSearchTerm(term);
  };

  const getNodeTemplate = (nodeType: string): NodeTemplate | undefined => {
    return defaultNodeTemplates.find((node) => node.type === nodeType);
  };

  const getAllNodes = (): NodeTemplate[] => {
    return defaultNodeTemplates;
  };

  return {
    categories,
    searchNodes,
    getNodeTemplate,
    getAllNodes,
    searchTerm,
  };
};
