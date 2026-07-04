/**
 * Claude Skills Package
 *
 * Integration layer for Anthropic's Claude Skills into The New Fuse
 */
export * from './types/index.js';
export { SkillParser } from './parser.js';
export { SkillLoader } from './loader.js';
export { SkillExecutor } from './executor.js';
export { SkillRegistry } from './registry.js';
export { MCPSkillProvider } from './integration.js';
export { ClaudeSkillsManager } from './ClaudeSkillsManager.js';
export declare const VERSION = "1.0.0";
export declare const PACKAGE_INFO: {
    readonly name: "@the-new-fuse/claude-skills";
    readonly version: "1.0.0";
    readonly description: "Integration layer for Anthropic Claude Skills into The New Fuse";
    readonly author: "The New Fuse Team";
    readonly license: "MIT";
};
//# sourceMappingURL=index.d.ts.map