import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  registerGetAgentDetailsTool,
  registerGetSystemStatusTool,
  registerHermesNa10McpCommandTool,
  registerListAgentsTool,
  registerListModelsTool,
  registerTnfHelpTool,
} from './tools/index.js';

type ToolRegistrationFunction = (server: McpServer) => void;

export const mainServerTools: ToolRegistrationFunction[] = [
  registerTnfHelpTool,
  registerHermesNa10McpCommandTool,
];

export const completeApiTools: ToolRegistrationFunction[] = [];

export const enhancedTnfTools: ToolRegistrationFunction[] = [
  registerListAgentsTool,
  registerListModelsTool,
  registerGetSystemStatusTool,
  registerGetAgentDetailsTool,
];
