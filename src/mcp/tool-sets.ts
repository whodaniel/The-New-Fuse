import {
  registerGetAgentDetailsTool,
  registerGetSystemStatusTool,
  registerHermesNa10McpCommandTool,
  registerListAgentsTool,
  registerListModelsTool,
  registerPlaceholderTool,
  registerTnfHelpTool,
} from './tools/index.js';

import { ToolRegistrationFunction } from './types/mcp.js';

export const mainServerTools: ToolRegistrationFunction[] = [
  registerTnfHelpTool,
  registerHermesNa10McpCommandTool,
];

export const completeApiTools: ToolRegistrationFunction[] = [registerPlaceholderTool];

export const enhancedTnfTools: ToolRegistrationFunction[] = [
  registerListAgentsTool,
  registerListModelsTool,
  registerGetSystemStatusTool,
  registerGetAgentDetailsTool,
];
