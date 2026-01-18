/**
 * Cloud Sandbox Tools System
 *
 * Comprehensive tool wrapping and skill chaining for AI agents.
 *
 * @packageDocumentation
 */

export { ToolRegistry, ToolWrapper } from './ToolWrapper';
export type {
  ToolExecutionContext,
  ToolExecutionResult,
  ToolParameter,
  ToolSchema,
} from './ToolWrapper';

export { SkillChain, SkillRegistry, registerDefaultSkills } from './SkillChains';
export type { SkillContext, SkillExecutionResult, SkillSchema, SkillStep } from './SkillChains';

export { registerBrowserTools } from './BrowserTools';
export { registerExecutionTools } from './ExecutionTools';
export { registerFilesystemTools } from './FilesystemTools';

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
