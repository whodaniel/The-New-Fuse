import { VscodeToolIntegration } from './tool-integration.js';

/**
 * Register default MCP tools
 */
export function registerDefaultTools(toolIntegration: VscodeToolIntegration): void {
  // File Management Tools
  registerFileManagementTools(toolIntegration);
  
  // Process Management Tools
  registerProcessManagementTools(toolIntegration);
  
  // Web Interaction Tools
  registerWebInteractionTools(toolIntegration);
  
  // Code Analysis Tools
  registerCodeAnalysisTools(toolIntegration);
  
  // Integration Tools
  registerIntegrationTools(toolIntegration);
  
  // Memory Tools
  registerMemoryTools(toolIntegration);
}

/**
 * Register file management tools
 */
function registerFileManagementTools(toolIntegration: VscodeToolIntegration): void {
  // Save File Tool
  toolIntegration.registerTool({
    name: 'save-file',
    description: 'Save a new file. Use this tool to write new files with the attached content.',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'The path of the file to save.'
        },
        file_content: {
          type: 'string',
          description: 'The content of the file.'
        },
        add_last_line_newline: {
          type: 'boolean',
          description: 'Whether to add a newline at the end of the file (default: true).'
        }
      },
      required: ['file_path', 'file_content']
    },
    execute: async (params) => {
      // Implementation will be handled by the MCP integration
      return { success: true, message: `File saved: ${params.file_path}` };
    }
  });
  
  // File Editor Tool
  toolIntegration.registerTool({
    name: 'str-replace-editor',
    description: 'Custom editing tool for viewing, creating and editing files',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          enum: ['view', 'str_replace', 'insert'],
          description: 'The commands to run. Allowed options are: "view", "str_replace", "insert".'
        },
        path: {
          type: 'string',
          description: 'Full path to file relative to the workspace root.'
        },
        view_range: {
          type: 'array',
          items: {
            type: 'integer'
          },
          description: 'Optional parameter of `view` command when `path` points to a file.'
        },
        old_str_1: {
          type: 'string',
          description: 'Required parameter of `str_replace` command containing the string in `path` to replace.'
        },
        new_str_1: {
          type: 'string',
          description: 'Required parameter of `str_replace` command containing the new string.'
        },
        old_str_start_line_number_1: {
          type: 'integer',
          description: 'The line number of the first line of `old_str_1` in the file.'
        },
        old_str_end_line_number_1: {
          type: 'integer',
          description: 'The line number of the last line of `old_str_1` in the file.'
        },
        insert_line_1: {
          type: 'integer',
          description: 'Required parameter of `insert` command. The line number after which to insert the new string.'
        }
      },
      required: ['command', 'path']
    },
    execute: async (params) => {
      // Implementation will be handled by the MCP integration
      return { success: true, message: `File operation completed: ${params.path}` };
    }
  });
  
  // Remove Files Tool
  toolIntegration.registerTool({
    name: 'remove-files',
    description: 'Remove files. ONLY use this tool to delete files in the user\'s workspace.',
    parameters: {
      type: 'object',
      properties: {
        file_paths: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'The paths of the files to remove.'
        }
      },
      required: ['file_paths']
    },
    execute: async (params) => {
      // Implementation will be handled by the MCP integration
      return { success: true, message: `Files removed: ${params.file_paths.join(', ')}` };
    }
  });
}

/**
 * Register process management tools
 */
function registerProcessManagementTools(toolIntegration: VscodeToolIntegration): void {
  // Launch Process Tool
  toolIntegration.registerTool({
    name: 'launch-process',
    description: 'Launch a new process with a shell command.',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The shell command to execute.'
        },
        wait: {
          type: 'boolean',
          description: 'Whether to wait for the command to complete.'
        },
        max_wait_seconds: {
          type: 'number',
          description: 'Number of seconds to wait for the command to complete.'
        },
        cwd: {
          type: 'string',
          description: 'Working directory for the command.'
        }
      },
      required: ['command', 'wait', 'max_wait_seconds']
    },
    execute: async (params) => {
      // Implementation will be handled by the MCP integration
      return { success: true, message: `Process launched: ${params.command}` };
    }
  });
  
  // Read Process Tool
  toolIntegration.registerTool({
    name: 'read-process',
    description: 'Read output from a terminal.',
    parameters: {
      type: 'object',
      properties: {
        terminal_id: {
          type: 'integer',
          description: 'Terminal ID to read from.'
        },
        wait: {
          type: 'boolean',
          description: 'Whether to wait for the command to complete.'
        },
        max_wait_seconds: {
          type: 'number',
          description: 'Number of seconds to wait for the command to complete.'
        }
      },
      required: ['terminal_id', 'wait', 'max_wait_seconds']
    },
    execute: async (params) => {
      // Implementation will be handled by the MCP integration
      return { success: true, message: `Process output read from terminal ${params.terminal_id}` };
    }
  });
  
  // Write Process Tool
  toolIntegration.registerTool({
    name: 'write-process',
    description: 'Write input to a terminal.',
    parameters: {
      type: 'object',
      properties: {
        terminal_id: {
          type: 'integer',
          description: 'Terminal ID to write to.'
        },
        input_text: {
          type: 'string',
          description: 'Text to write to the process\'s stdin.'
        }
      },
      required: ['terminal_id', 'input_text']
    },
    execute: async (params) => {
      // Implementation will be handled by the MCP integration
      return { success: true, message: `Input written to terminal ${params.terminal_id}` };
    }
  });
  
  // Kill Process Tool
  toolIntegration.registerTool({
    name: 'kill-process',
    description: 'Kill a process by its terminal ID.',
    parameters: {
      type: 'object',
      properties: {
        terminal_id: {
          type: 'integer',
          description: 'Terminal ID to kill.'
        }
      },
      required: ['terminal_id']
    },
    execute: async (params) => {
      // Implementation will be handled by the MCP integration
      return { success: true, message: `Process killed in terminal ${params.terminal_id}` };
    }
  });
  
  // List Processes Tool
  toolIntegration.registerTool({
    name: 'list-processes',
    description: 'List all known terminals and their states.',
    parameters: {
      type: 'object',
      properties: {}
    },
    execute: async () => {
      // Implementation will be handled by the MCP integration
      return { success: true, message: 'Processes listed' };
    }
  });
}

/**
 * Register web interaction tools
 */
function registerWebInteractionTools(toolIntegration: VscodeToolIntegration): void {
  // Web Search Tool
  toolIntegration.registerTool({
    name: 'web-search',
    description: 'Search the web for information.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to send.'
        },
        num_results: {
          type: 'integer',
          description: 'Number of results to return',
          default: 5,
          minimum: 1,
          maximum: 10
        }
      },
      required: ['query']
    },
    execute: async (params) => {
      // Implementation will be handled by the MCP integration
      return { success: true, message: `Web search for: ${params.query}` };
    }
  });
  
  // Web Fetch Tool
  toolIntegration.registerTool({
    name: 'web-fetch',
    description: 'Fetches data from a webpage and converts it into Markdown.',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to fetch.'
        }
      },
      required: ['url']
    },
    execute: async (params) => {
      // Implementation will be handled by the MCP integration
      return { success: true, message: `Web content fetched from: ${params.url}` };
    }
  });
  
  // Open Browser Tool
  toolIntegration.registerTool({
    name: 'open-browser',
    description: 'Open a URL in the default browser.',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to open in the browser.'
        }
      },
      required: ['url']
    },
    execute: async (params) => {
      // Implementation will be handled by the MCP integration
      return { success: true, message: `Browser opened with URL: ${params.url}` };
    }
  });
}

/**
 * Register code analysis tools
 */
function registerCodeAnalysisTools(toolIntegration: VscodeToolIntegration): void {
  // Codebase Retrieval Tool
  toolIntegration.registerTool({
    name: 'codebase-retrieval',
    description: 'This tool is Augment\'s context engine, the world\'s best codebase context engine.',
    parameters: {
      type: 'object',
      properties: {
        information_request: {
          type: 'string',
          description: 'A description of the information you need.'
        }
      },
      required: ['information_request']
    },
    execute: async (params) => {
      // Implementation will be handled by the MCP integration
      return { success: true, message: `Codebase information retrieved for: ${params.information_request}` };
    }
  });
  
  // Diagnostics Tool
  toolIntegration.registerTool({
    name: 'diagnostics',
    description: 'Get issues (errors, warnings, etc.) from the IDE.',
    parameters: {
      type: 'object',
      properties: {
        paths: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Optional list of file paths to get issues for from the IDE.'
        }
      }
    },
    execute: async (params) => {
      // Implementation will be handled by the MCP integration
      return { success: true, message: 'Diagnostics retrieved' };
    }
  });
}

/**
 * Register integration tools
 */
function registerIntegrationTools(toolIntegration: VscodeToolIntegration): void {
  // GitHub API Tool
  toolIntegration.registerTool({
    name: 'github-api',
    description: 'Make GitHub API calls.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'GitHub API path.'
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PATCH', 'PUT'],
          default: 'GET',
          description: 'HTTP method to use.'
        },
        data: {
          description: 'Data to send - automatically handled as query params for GET or JSON body for POST.'
        },
        summary: {
          type: 'string',
          description: 'A short human-readable summary of what this API call will do.'
        },
        details: {
          type: 'boolean',
          default: false,
          description: 'If false (default), it will only contain the most essential fields.'
        }
      },
      required: ['path']
    },
    execute: async (params) => {
      // Implementation will be handled by the MCP integration
      return { success: true, message: `GitHub API call to: ${params.path}` };
    }
  });
  
  // Linear Tool
  toolIntegration.registerTool({
    name: 'linear',
    description: 'Make queries against the Linear API using natural language.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query for Linear API.'
        },
        summary: {
          type: 'string',
          description: 'One sentence description of the intent of this tool call.'
        },
        is_read_only: {
          type: 'boolean',
          default: false,
          description: 'Whether this tool call will require mutating Linear\'s state.'
        }
      },
      required: ['summary', 'query']
    },
    execute: async (params) => {
      // Implementation will be handled by the MCP integration
      return { success: true, message: `Linear API query: ${params.query}` };
    }
  });
  
  // Jira Tool
  toolIntegration.registerTool({
    name: 'jira',
    description: 'Make Jira API calls with flexible endpoints.',
    parameters: {
      type: 'object',
      properties: {
        endpoint: {
          type: 'string',
          description: 'The API endpoint path.'
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT'],
          default: 'GET',
          description: 'HTTP method to use.'
        },
        data: {
          description: 'Data to send - automatically handled as query params for GET or JSON body for POST/PUT.'
        },
        summary: {
          type: 'string',
          description: 'A short human-readable summary of what this API call will do.'
        }
      },
      required: ['endpoint']
    },
    execute: async (params) => {
      // Implementation will be handled by the MCP integration
      return { success: true, message: `Jira API call to: ${params.endpoint}` };
    }
  });
  
  // Confluence Tool
  toolIntegration.registerTool({
    name: 'confluence',
    description: 'Make Confluence API calls with flexible endpoints.',
    parameters: {
      type: 'object',
      properties: {
        endpoint: {
          type: 'string',
          description: 'The API endpoint path.'
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT'],
          default: 'GET',
          description: 'HTTP method to use.'
        },
        data: {
          description: 'Data to send - automatically handled as query params for GET or JSON body for POST/PUT.'
        },
        summary: {
          type: 'string',
          description: 'A short human-readable summary of what this API call will do.'
        }
      },
      required: ['endpoint']
    },
    execute: async (params) => {
      // Implementation will be handled by the MCP integration
      return { success: true, message: `Confluence API call to: ${params.endpoint}` };
    }
  });
  
  // Notion Tool
  toolIntegration.registerTool({
    name: 'notion',
    description: 'Use this tool to access content in Notion, a knowledge base for teams.',
    parameters: {
      type: 'object',
      properties: {
        method: {
          type: 'string',
          enum: ['read_page', 'search_pages', 'read_database'],
          description: 'The Notion API method to call.'
        },
        href: {
          type: 'string',
          description: 'The URL to the resource being accessed.'
        },
        params: {
          description: 'The parameters to pass to the API method.'
        },
        summary: {
          type: 'string',
          description: 'A short human-readable summary of what this tool call will do.'
        }
      },
      required: ['summary', 'href', 'method', 'params']
    },
    execute: async (params) => {
      // Implementation will be handled by the MCP integration
      return { success: true, message: `Notion API call: ${params.method}` };
    }
  });
}

/**
 * Register memory tools
 */
function registerMemoryTools(toolIntegration: VscodeToolIntegration): void {
  // Remember Tool
  toolIntegration.registerTool({
    name: 'remember',
    description: 'Call this tool when user asks you to remember something.',
    parameters: {
      type: 'object',
      properties: {
        memory: {
          type: 'string',
          description: 'The concise (1 sentence) memory to remember.'
        }
      },
      required: ['memory']
    },
    execute: async (params) => {
      // Implementation will be handled by the MCP integration
      return { success: true, message: `Memory stored: ${params.memory}` };
    }
  });
}
