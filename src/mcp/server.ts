import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { MCPServer } from './MCPServer.js'; // Keep .js for module resolution
import { fileTools, buildTools } from './tools.js';
import { apiKeyAuth } from './auth.js';      // Keep .js for module resolution
import { registerAnthropicXmlTools } from './tools/anthropic-xml-tools.js'; // Keep .js for module resolution
import { registerCodeExecutionTools } from './tools/code-execution.tools.js'; // Keep .js for module resolution
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { CodeExecutionService } from '../../packages/core/src/services/code-execution/code-execution.service.js';
import { BaseError } from '../../types/error.js'; // Added BaseError import

// --- Interfaces (can be moved to a types.ts file) ---
interface Logger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string, error?: any) => void;
}

// --- Configuration ---
const PORT: number = parseInt(process.env.PORT || '3000', 10);
// Basic API Key store (replace with a more secure method in production)
const VALID_API_KEYS: Set<string> = new Set(['test-agent-key-123']);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT: string = path.resolve(__dirname, '../..'); // Resolve to 'The New Fuse' root

// --- Logger Setup ---
const logDir: string = path.resolve(WORKSPACE_ROOT, './mcp/logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFile = fs.createWriteStream(path.join(logDir, 'mcp-server.log'), { flags: 'a' });

const logger: Logger = {
  info: (message: string) => {
    const logEntry = `[${new Date().toISOString()}] INFO: ${message}\n`;
    console.log(message); // Also log to console
    logFile.write(logEntry);
  },
  error: (message: string, error?: any) => {
    const logEntry = `[${new Date().toISOString()}] ERROR: ${message} ${error ? error.stack || error.message : ''}\n`;
    console.error(message, error); // Also log to console
    logFile.write(logEntry);
  },
  warn: (message: string) => {
    const logEntry = `[${new Date().toISOString()}] WARN: ${message}\n`;
    console.warn(message); // Also log to console
    logFile.write(logEntry);
  }
};

// --- Initialize Services ---
// Create code execution service
const codeExecutionService = new CodeExecutionService({
  get: (key: string, defaultValue?: string) => {
    return process.env[key] || defaultValue;
  }
});

// --- MCP Server Instance ---
const mcpServer = new MCPServer({ logger, workspaceRoot: WORKSPACE_ROOT });

// --- Register Tools ---
// Register Anthropic XML tools
registerAnthropicXmlTools(mcpServer, logger);

// Register Code Execution tools
registerCodeExecutionTools(mcpServer, codeExecutionService, logger);

// Example: File System Tools
mcpServer.registerTool('readFile', {
  description: 'Reads the content of a specified file within the workspace.',
  parameters: z.object({
    filePath: z.string().describe('Relative path to the file within the workspace (e.g., "src/components/Button.tsx")'),
  }),
  execute: fileTools.readFile,
});

mcpServer.registerTool('listWorkspaceFiles', {
  description: 'Lists files and directories within a specified path in the workspace.',
  parameters: z.object({
    directoryPath: z.string().optional().default('.').describe('Relative path to the directory within the workspace (e.g., "scripts" or ".")'),
  }),
  execute: fileTools.listWorkspaceFiles,
});

// New tool: writeFile - fixed type issues
mcpServer.registerTool('writeFile', {
  description: 'Writes content to a file within the workspace. Can optionally create directories.',
  parameters: z.object({
    filePath: z.string().describe('Relative path to the file within the workspace'),
    content: z.string().describe('Content to write to the file'),
    createDirs: z.boolean().optional().describe('Create parent directories if they don\'t exist')
  }),
  execute: fileTools.writeFile,
});

// New tool: runBuild - fixed type issues
mcpServer.registerTool('runBuild', {
  description: 'Runs a build script defined in package.json.',
  parameters: z.object({
    script: z.string().describe('Name of the build script to run (e.g., "build:ui", "build:core")'),
    timeout: z.number().optional().describe('Maximum execution time in milliseconds')
  }),
  execute: buildTools.runBuild,
});

// --- Express App Setup ---
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

// --- Middleware ---
// Simple API Key Authentication
app.use(apiKeyAuth(VALID_API_KEYS, logger));

// --- New: Registration and Discovery ---
// MCP Service Registration Information
const MCP_SERVICE_INFO = {
  id: "the-new-fuse-mcp",
  name: "The New Fuse MCP Server",
  version: "1.0.0",
  description: "Model-Controller-Provider server for The New Fuse with file, build, and agent coordination capabilities",
  vendor: "The New Fuse",
  apiVersion: "1.0",
  capabilities: [
    "file-operations",
    "build-operations",
    "agent-coordination",
    "state-management",
    "anthropic-xml",
    "code-execution"
  ],
  authentication: {
    type: "api-key",
    header: "X-API-Key"
  },
  endpoints: {
    base: `http://localhost:${PORT}`,
    tools: "/mcp/tools",
    request: "/mcp/request",
    conversations: "/mcp/conversations",
  }
};

// --- Routes ---
// Health Check
app.get(['/health', '/ping'], (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', version: '1.0.0' }); // Use version from package.json ideally
});

// MCP Discovery Endpoints
app.get('/mcp/tools', (req: Request, res: Response) => {
  try {
    res.status(200).json(mcpServer.getToolDefinitions());
  } catch (error) {
    logger.error('Error getting tool definitions:', error);
    if (error instanceof BaseError) {
        res.status(error.statusCode || 500).json({
            status: 'error',
            error: { message: error.message, code: error.code, details: error.details }
        });
    } else if (error instanceof Error) {
        res.status(500).json({ status: 'error', error: { message: error.message } });
    } else {
        res.status(500).json({ status: 'error', error: { message: 'Failed to get tool definitions.' } });
    }
  }
});

app.get('/mcp/capabilities', (req: Request, res: Response) => {
  try {
    // Placeholder - Capabilities might be defined differently or dynamically
    res.status(200).json(mcpServer.getCapabilityDefinitions());
  } catch (error) {
    logger.error('Error getting capability definitions:', error);
    if (error instanceof BaseError) {
        res.status(error.statusCode || 500).json({
            status: 'error',
            error: { message: error.message, code: error.code, details: error.details }
        });
    } else if (error instanceof Error) {
        res.status(500).json({ status: 'error', error: { message: error.message } });
    } else {
        res.status(500).json({ status: 'error', error: { message: 'Failed to get capability definitions.' } });
    }
  }
});

// MCP Request Endpoint
app.post('/mcp/request', async (req: Request, res: Response) => {
  const { toolName, parameters } = req.body;

  if (!toolName || typeof toolName !== 'string') {
    return res.status(400).json({ status: 'error', error: { message: 'Missing or invalid toolName' } });
  }

  try {
    // Add agent context if available from auth middleware
    // The apiKeyAuth middleware should attach agentId to req
    const agentContext = { agentId: req.agentId || 'unknown' };
    const result = await mcpServer.executeTool(toolName, parameters, agentContext);
    res.status(200).json({ status: 'success', data: result });
  } catch (error: unknown) {
    logger.error(`Error executing tool ${toolName}:`, error);
    if (error instanceof BaseError) {
        res.status(error.statusCode || 500).json({
            status: 'error',
            error: { message: error.message, code: error.code, details: error.details }
        });
    } else if (error instanceof Error) { // Standard JS Error
        // Distinguish between validation errors and execution errors based on message content (heuristic)
        const isValidationError = error.message.startsWith('Validation error') ||
                                  error.message.includes('not found') ||
                                  error.message.includes('Invalid parameters') ||
                                  error.message.includes('Missing or invalid toolName'); // Added this from the pre-try check
        const statusCode = isValidationError ? 400 : 500;
        res.status(statusCode).json({ status: 'error', error: { message: error.message } });
    } else { // Unknown error type
        res.status(500).json({ status: 'error', error: { message: 'An unexpected error occurred during tool execution.' } });
    }
  }
});

// New endpoints for conversation state management
app.post('/mcp/conversation', (req: Request, res: Response) => {
  try {
    const { conversationId } = req.body;

    // Create or get existing conversation
    const conversation = mcpServer.createOrGetConversation(conversationId);

    res.status(200).json({
      status: 'success',
      data: {
        conversationId: conversation.conversationId
      }
    });
  } catch (error) {
    logger.error('Error creating or getting conversation:', error);
    if (error instanceof BaseError) {
        res.status(error.statusCode || 500).json({
            status: 'error',
            error: { message: error.message, code: error.code, details: error.details }
        });
    } else if (error instanceof Error) {
        res.status(500).json({ status: 'error', error: { message: error.message } }); // Expose specific error message if it's a standard Error
    } else {
        res.status(500).json({ status: 'error', error: { message: 'Failed to process conversation request.' } });
    }
  }
});

app.post('/mcp/conversation/:conversationId/message', (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { role, content, toolCalls } = req.body;

    if (!role || !content) {
      return res.status(400).json({
        status: 'error',
        error: { message: 'Missing required fields: role and content' }
      });
    }

    const message = mcpServer.addConversationMessage(conversationId, role, content, toolCalls);

    res.status(200).json({
      status: 'success',
      data: { message }
    });
  } catch (error) {
    logger.error('Error adding message to conversation:', error);
    if (error instanceof BaseError) {
        res.status(error.statusCode || 500).json({
            status: 'error',
            error: { message: error.message, code: error.code, details: error.details }
        });
    } else if (error instanceof Error) {
        res.status(500).json({ status: 'error', error: { message: error.message } });
    } else {
        res.status(500).json({
          status: 'error',
          error: { message: 'Failed to add message to conversation.' } // Generic message for unknown errors
        });
    }
  }
});

app.get('/mcp/conversation/:conversationId/history', (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const history = mcpServer.getConversationHistory(conversationId);

    res.status(200).json({
      status: 'success',
      data: { history }
    });
  } catch (error) {
    logger.error('Error retrieving conversation history:', error);
    if (error instanceof BaseError) {
        res.status(error.statusCode || 500).json({
            status: 'error',
            error: { message: error.message, code: error.code, details: error.details }
        });
    } else if (error instanceof Error) {
        res.status(500).json({ status: 'error', error: { message: error.message } });
    } else {
        res.status(500).json({
          status: 'error',
          error: { message: 'Failed to retrieve conversation history.' }
        });
    }
  }
});

app.get('/mcp/conversations', (req: Request, res: Response) => {
  try {
    const conversations = mcpServer.getConversations();

    res.status(200).json({
      status: 'success',
      data: { conversations }
    });
  } catch (error) {
    logger.error('Error retrieving conversations:', error);
    if (error instanceof BaseError) {
        res.status(error.statusCode || 500).json({
            status: 'error',
            error: { message: error.message, code: error.code, details: error.details }
        });
    } else if (error instanceof Error) {
        res.status(500).json({ status: 'error', error: { message: error.message } });
    } else {
        res.status(500).json({
          status: 'error',
          error: { message: 'Failed to retrieve conversations.' }
        });
    }
  }
});

// Agent state endpoints
app.post('/mcp/agent/:agentId/state', (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const { key, value } = req.body;

    if (!key) {
      return res.status(400).json({
        status: 'error',
        error: { message: 'Missing required field: key' }
      });
    }

    mcpServer.setAgentState(agentId, key, value);

    res.status(200).json({
      status: 'success',
      data: { message: `State updated for agent ${agentId}` }
    });
  } catch (error) {
    logger.error('Error setting agent state:', error);
    if (error instanceof BaseError) {
        res.status(error.statusCode || 500).json({
            status: 'error',
            error: { message: error.message, code: error.code, details: error.details }
        });
    } else if (error instanceof Error) {
        res.status(500).json({ status: 'error', error: { message: error.message } });
    } else {
        res.status(500).json({
          status: 'error',
          error: { message: 'Failed to set agent state.' }
        });
    }
  }
});

app.get('/mcp/agent/:agentId/state/:key', (req: Request, res: Response) => {
  try {
    const { agentId, key } = req.params;
    const value = mcpServer.getAgentState(agentId, key);

    res.status(200).json({
      status: 'success',
      data: { value }
    });
  } catch (error) {
    logger.error('Error retrieving agent state:', error);
    if (error instanceof BaseError) {
        res.status(error.statusCode || 500).json({
            status: 'error',
            error: { message: error.message, code: error.code, details: error.details }
        });
    } else if (error instanceof Error) {
        res.status(500).json({ status: 'error', error: { message: error.message } });
    } else {
        res.status(500).json({
          status: 'error',
          error: { message: 'Failed to retrieve agent state.' }
        });
    }
  }
});

// New: Discovery and Registration Endpoints
app.get('/mcp/discovery', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    data: MCP_SERVICE_INFO
  });
});

// MCP Service Registration Endpoint - allows VS Code extensions to register this MCP server
app.post('/mcp/register', (req: Request, res: Response) => {
  const { clientId, clientName, clientType } = req.body;

  if (!clientId || !clientName || !clientType) {
    return res.status(400).json({
      status: 'error',
      error: { message: 'Missing required registration fields' }
    });
  }

  // Generate a client-specific API key (in production, use more secure methods)
  const clientApiKey = `${clientId}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

  // Add to valid keys (in production, use a database)
  VALID_API_KEYS.add(clientApiKey);

  logger.info(`Registered new client: ${clientName} (${clientId}) of type ${clientType}`);

  res.status(200).json({
    status: 'success',
    data: {
      serviceInfo: MCP_SERVICE_INFO,
      credentials: {
        apiKey: clientApiKey
      },
      message: `Successfully registered ${clientName}`
    }
  });
});

// New endpoint to list available capabilities with details
app.get('/mcp/capabilities/details', (req: Request, res: Response) => {
  try {
    const capabilities = {
      "file-operations": {
        description: "Read, write, and list files in the workspace",
        tools: ["readFile", "writeFile", "listWorkspaceFiles"]
      },
      "build-operations": {
        description: "Run build scripts defined in package.json",
        tools: ["runBuild"]
      },
      "agent-coordination": {
        description: "Manage and coordinate AI agent communications",
        tools: []
      },
      "state-management": {
        description: "Store and retrieve conversation state and agent preferences",
        tools: []
      },
      "anthropic-xml": {
        description: "Work with Anthropic's XML-style function calling format",
        tools: [
          "anthropic.parseXmlFunctionCall",
          "anthropic.createXmlFunctionCall",
          "anthropic.createXmlFunctionCallResponse",
          "anthropic.parseXmlFunctionCallResponse",
          "anthropic.convertToolToXmlFormat",
          "anthropic.convertToolsToXmlFormat"
        ]
      },
      "code-execution": {
        description: "Execute code in a secure environment with billing based on resource usage",
        tools: [
          "executeCode",
          "getCodeExecutionPricing",
          "getCodeExecutionUsage",
          "createCodeExecutionSession",
          "getCodeExecutionSession",
          "updateCodeExecutionSession",
          "deleteCodeExecutionSession",
          "getUserCodeExecutionSessions",
          "getPublicCodeExecutionSessions",
          "addFileToCodeExecutionSession",
          "updateFileInCodeExecutionSession",
          "deleteFileFromCodeExecutionSession",
          "addCollaboratorToCodeExecutionSession",
          "removeCollaboratorFromCodeExecutionSession"
        ]
      }
    };

    res.status(200).json({
      status: 'success',
      data: { capabilities }
    });
  } catch (error) {
    logger.error('Error retrieving capability details:', error);
    if (error instanceof BaseError) {
        res.status(error.statusCode || 500).json({
            status: 'error',
            error: { message: error.message, code: error.code, details: error.details }
        });
    } else if (error instanceof Error) {
        res.status(500).json({ status: 'error', error: { message: error.message } });
    } else {
        res.status(500).json({
          status: 'error',
          error: { message: 'Failed to retrieve capability details.' }
        });
    }
  }
});

// --- Start Server ---
const httpServer = http.createServer(app);
httpServer.listen(PORT, () => {
  logger.info(`MCP Server running at http://localhost:${PORT}`);
  logger.info(`Workspace Root: ${WORKSPACE_ROOT}`);
  try {
      const registeredTools = Object.keys(mcpServer.getToolDefinitions()).join(', ') || 'None';
      logger.info(`Registered Tools: ${registeredTools}`);
  } catch (error) {
      logger.error('Could not retrieve tool definitions on startup.', error);
  }
  logger.info('API Key for testing: test-agent-key-123 (use header X-API-Key)');
});

// --- Graceful Shutdown ---
const shutdown = () => {
  logger.info('Server shutting down...');
  httpServer.close(() => {
    logger.info('Server closed');
    logFile.end();
    process.exit(0);
  });
  // Force shutdown after timeout
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 5000); // 5 seconds
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
