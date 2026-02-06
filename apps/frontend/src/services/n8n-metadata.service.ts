// N8n Metadata Service
// Provides node metadata and validation for workflow builder

export interface N8nNodeMetadata {
  id: string;
  name: string;
  displayName: string;
  type: string;
  category: string;
  description: string;
  parameters: N8nParameter[];
  credentials?: string[];
  inputs: number[];
  outputs: number[];
  icon?: string;
}

export interface N8nParameter {
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'boolean' | 'collection' | 'options' | 'credentials';
  required?: boolean;
  default?: any;
  options?: Array<{ name: string; value: any }>;
  description?: string;
}

class N8nMetadataService {
  private nodeMetadata: Map<string, N8nNodeMetadata> = new Map();

  constructor() {
    this.initializeBuiltInNodes();
  }

  private initializeBuiltInNodes() {
    // HTTP Request Node
    this.nodeMetadata.set('httpRequest', {
      id: 'httpRequest',
      name: 'HTTP Request',
      displayName: 'HTTP Request',
      type: 'n8n-nodes-base.httpRequest',
      category: 'HTTP',
      description: 'Make HTTP requests to any URL',
      parameters: [
        {
          name: 'url',
          displayName: 'URL',
          type: 'string',
          required: true,
          description: 'The URL to make the request to',
        },
        {
          name: 'method',
          displayName: 'Method',
          type: 'options',
          required: true,
          default: 'GET',
          options: [
            { name: 'GET', value: 'GET' },
            { name: 'POST', value: 'POST' },
            { name: 'PUT', value: 'PUT' },
            { name: 'DELETE', value: 'DELETE' },
            { name: 'PATCH', value: 'PATCH' },
          ],
        },
        {
          name: 'headers',
          displayName: 'Headers',
          type: 'collection',
          description: 'Headers to send with the request',
        },
      ],
      inputs: [1],
      outputs: [1],
      icon: 'fa:globe',
    });

    // Slack Node
    this.nodeMetadata.set('slack', {
      id: 'slack',
      name: 'Slack',
      displayName: 'Slack',
      type: 'n8n-nodes-base.slack',
      category: 'Communication',
      description: 'Send messages to Slack channels',
      parameters: [
        {
          name: 'channel',
          displayName: 'Channel',
          type: 'string',
          required: true,
          description: 'The channel to send the message to',
        },
        {
          name: 'text',
          displayName: 'Text',
          type: 'string',
          description: 'The message text to send',
        },
      ],
      credentials: ['slackApi'],
      inputs: [1],
      outputs: [1],
      icon: 'fab:slack',
    });

    // Start Node
    this.nodeMetadata.set('start', {
      id: 'start',
      name: 'Start',
      displayName: 'Start',
      type: 'n8n-nodes-base.start',
      category: 'Core',
      description: 'Starting point for workflow execution',
      parameters: [],
      inputs: [],
      outputs: [1],
      icon: 'fa:play',
    });

    // End Node
    this.nodeMetadata.set('end', {
      id: 'end',
      name: 'End',
      displayName: 'End',
      type: 'n8n-nodes-base.end',
      category: 'Core',
      description: 'End point for workflow execution',
      parameters: [],
      inputs: [1],
      outputs: [],
      icon: 'fa:stop',
    });

    // Code Node
    this.nodeMetadata.set('code', {
      id: 'code',
      name: 'Code',
      displayName: 'Code',
      type: 'n8n-nodes-base.code',
      category: 'Development',
      description: 'Execute custom JavaScript code',
      parameters: [
        {
          name: 'code',
          displayName: 'JavaScript Code',
          type: 'string',
          required: true,
          description: 'The JavaScript code to execute',
        },
      ],
      inputs: [1],
      outputs: [1],
      icon: 'fa:code',
    });
  }

  getNodeMetadata(nodeType: string): N8nNodeMetadata | undefined {
    return this.nodeMetadata.get(nodeType);
  }

  getAllNodeMetadata(): N8nNodeMetadata[] {
    return Array.from(this.nodeMetadata.values());
  }

  getNodesByCategory(category: string): N8nNodeMetadata[] {
    return Array.from(this.nodeMetadata.values()).filter((node) => node.category === category);
  }

  getCategories(): string[] {
    const categories = new Set<string>();
    this.nodeMetadata.forEach((node) => categories.add(node.category));
    return Array.from(categories);
  }

  validateNodeConfiguration(
    nodeType: string,
    parameters: any
  ): { isValid: boolean; errors: string[] } {
    const metadata = this.getNodeMetadata(nodeType);
    if (!metadata) {
      return { isValid: false, errors: [`Unknown node type: ${nodeType}`] };
    }

    const errors: string[] = [];

    // Check required parameters
    metadata.parameters.forEach((param) => {
      if (param.required && (!parameters[param.name] || parameters[param.name] === '')) {
        errors.push(`Required parameter '${param.displayName}' is missing`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  getDefaultParameterValues(nodeType: string): any {
    const metadata = this.getNodeMetadata(nodeType);
    if (!metadata) return {};

    const defaults: any = {};
    metadata.parameters.forEach((param) => {
      if (param.default !== undefined) {
        defaults[param.name] = param.default;
      }
    });

    return defaults;
  }

  addCustomNode(metadata: N8nNodeMetadata): void {
    this.nodeMetadata.set(metadata.id, metadata);
  }

  removeNode(nodeType: string): boolean {
    return this.nodeMetadata.delete(nodeType);
  }
}

const n8nMetadataService = new N8nMetadataService();
export default n8nMetadataService;
