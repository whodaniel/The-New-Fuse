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
} from './ToolWrapper.js';
import { ToolRegistry, ToolWrapper } from './ToolWrapper.js';

import type { SkillContext, SkillExecutionResult, SkillSchema, SkillStep } from './SkillChains.js';
import { SkillChain, SkillRegistry, registerDefaultSkills } from './SkillChains.js';

import { registerBrowserTools } from './BrowserTools.js';
import { registerExecutionTools } from './ExecutionTools.js';
import { registerFilesystemTools } from './FilesystemTools.js';

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
