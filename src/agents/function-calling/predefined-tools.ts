import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// In-memory storage for simulated tools
const memoryStore: string[] = [];

/**
 * Collection of predefined tools that can be used with FunctionCallingAgent
 */
export const predefinedTools = {
  // Weather tool
  getWeather: {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather for a given location.',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'City and state, e.g., San Francisco, CA'
          },
        },
        required: ['location']
      }
    }
  },

  // Memory management tool
  addToMemory: {
    type: 'function',
    function: {
      name: 'add_to_memory',
      description: 'Store information in the agent\'s memory for later recall.',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The text to store in memory'
          },
        },
        required: ['text']
      }
    }
  },

  // Search tool
  searchWeb: {
    type: 'function',
    function: {
      name: 'search_web',
      description: 'Search the web for information on a given topic.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query'
          },
          num_results: {
            type: 'integer',
            description: 'Number of results to return (default: 5)'
          }
        },
        required: ['query']
      }
    }
  },

  // Task creation and management
  createTask: {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new asynchronous task that will be executed in the background.',
      parameters: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'Description of the task to be performed'
          },
        },
        required: ['description']
      }
    }
  },

  checkTask: {
    type: 'function',
    function: {
      name: 'check_task',
      description: 'Check the status and result of a previously created task.',
      parameters: {
        type: 'object',
        properties: {
          task_id: {
            type: 'string',
            description: 'The ID of the task to check'
          },
        },
        required: ['task_id']
      }
    }
  },

  // Data processing
  parseJson: {
    type: 'function',
    function: {
      name: 'parse_json',
      description: 'Parse and validate JSON data.',
      parameters: {
        type: 'object',
        properties: {
          json_string: {
            type: 'string',
            description: 'The JSON string to parse'
          },
        },
        required: ['json_string']
      }
    }
  },

  // File operations
  readFile: {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the contents of a file.',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'The path to the file to read'
          },
        },
        required: ['file_path']
      }
    }
  },

  writeFile: {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write data to a file.',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'The path to the file to write'
          },
          content: {
            type: 'string',
            description: 'The content to write to the file'
          },
          append: {
            type: 'boolean',
            description: 'Whether to append to the file (default: false)'
          }
        },
        required: ['file_path', 'content']
      }
    }
  },

  // Database operations
  queryDatabase: {
    type: 'function',
    function: {
      name: 'query_database',
      description: 'Execute a database query.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The SQL query to execute'
          },
          database: {
            type: 'string',
            description: 'The database to query'
          }
        },
        required: ['query', 'database']
      }
    }
  },

  // Integration with other agents
  delegateToAgent: {
    type: 'function',
    function: {
      name: 'delegate_to_agent',
      description: 'Delegate a task to another agent.',
      parameters: {
        type: 'object',
        properties: {
          agent_id: {
            type: 'string',
            description: 'The ID of the agent to delegate to'
          },
          task: {
            type: 'string',
            description: 'The task to delegate'
          },
          input: {
            type: 'object',
            description: 'The input data for the task'
          }
        },
        required: ['agent_id', 'task']
      }
    }
  }
};

// Function implementations that would be used by the agent service
export const toolImplementations = {
  // Weather implementation (simulated)
  get_weather: async ({ location }: { location: string }) => {
    // In a real app, this would call a weather API
    const mockWeatherData = {
      location,
      temperature: Math.floor(Math.random() * 30) + 10, // Random temp between 10-40°C
      conditions: ['Sunny', 'Cloudy', 'Rainy', 'Windy'][Math.floor(Math.random() * 4)],
      humidity: Math.floor(Math.random() * 50) + 30, // Random humidity between 30-80%
      timestamp: new Date().toISOString()
    };
    
    return mockWeatherData;
  },
  
  // Memory implementation
  add_to_memory: ({ text }: { text: string }) => {
    memoryStore.push(text);
    return { success: true, message: 'Information added to memory', timestamp: new Date().toISOString() };
  },
  
  // Task management implementations would connect to the FunctionCallingAgent's methods
  create_task: async ({ description }: { description: string }) => {
    const taskId = uuidv4();
    // In real implementation, this would call the agent's createTask method
    return { task_id: taskId, status: 'created', message: 'Task created successfully' };
  },
  
  check_task: async ({ task_id }: { task_id: string }) => {
    // In real implementation, this would call the agent's checkTask method
    return { 
      task_id, 
      status: Math.random() > 0.5 ? 'completed' : 'running',
      result: Math.random() > 0.5 ? { data: 'Task result data' } : null
    };
  },
  
  // Web search implementation (simulated)
  search_web: async ({ query, num_results = 5 }: { query: string, num_results?: number }) => {
    // In a real app, this would use a search API
    return {
      query,
      results: Array(num_results).fill(0).map((_, i) => ({
        title: `Search result ${i+1} for "${query}"`,
        snippet: `This is a snippet of text that would be returned for the search query "${query}".`,
        url: `https://example.com/result-${i+1}?q=${encodeURIComponent(query)}`
      })),
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Get all available predefined tools
 */
export function getAllPredefinedTools() {
  return { ...predefinedTools };
}

/**
 * Get a specific predefined tool by name
 */
export function getPredefinedTool(toolName: keyof typeof predefinedTools) {
  return predefinedTools[toolName];
}

/**
 * Get the implementation function for a tool
 */
export function getToolImplementation(toolName: string) {
  const toolKey = toolName.replace(/^get_/, '');
  // @ts-ignore - Dynamic access
  return toolImplementations[toolName] || null;
}