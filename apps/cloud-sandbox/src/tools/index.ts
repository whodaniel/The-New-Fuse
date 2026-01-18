/**
 * Cloud Sandbox Tools System
 *
 * Comprehensive tool wrapping and skill chaining for AI agents.
 *
 * @packageDocumentation
 */

import type {
  ToolExecutionContext,
  ToolExecutionResult,
  ToolParameter,
  ToolSchema,
} from './ToolWrapper';
import { ToolRegistry, ToolWrapper } from './ToolWrapper';

import type { SkillContext, SkillExecutionResult, SkillSchema, SkillStep } from './SkillChains';
import { SkillChain, SkillRegistry, registerDefaultSkills } from './SkillChains';

import { registerBrowserTools } from './BrowserTools';
import { registerExecutionTools } from './ExecutionTools';
import { registerFilesystemTools } from './FilesystemTools';

export { ToolRegistry, ToolWrapper };
export type { ToolExecutionContext, ToolExecutionResult, ToolParameter, ToolSchema };

export { SkillChain, SkillRegistry, registerDefaultSkills };
export type { SkillContext, SkillExecutionResult, SkillSchema, SkillStep };

export { registerBrowserTools, registerExecutionTools, registerFilesystemTools };

/**
 * Initialize all tools and skills
 */
export async function initializeToolsAndSkills(getPage: () => Promise<any>): Promise<{
  toolRegistry: ToolRegistry;
  skillRegistry: SkillRegistry;
}> {
  const toolRegistry = new ToolRegistry();
  const skillRegistry = new SkillRegistry();

  // Register all tools
  registerBrowserTools(toolRegistry, getPage);
  registerExecutionTools(toolRegistry);
  registerFilesystemTools(toolRegistry);

  // Register default skills
  registerDefaultSkills(skillRegistry, toolRegistry);

  return { toolRegistry, skillRegistry };
}
