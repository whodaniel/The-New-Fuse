/**
 * Claude Skills Package
 *
 * Integration layer for Anthropic's Claude Skills into The New Fuse
 */
export * from './types/index.js';
export { SkillParser } from './parser/index.js';
export { SkillLoader } from './loader/index.js';
export { SkillExecutor } from './executor/index.js';
export { SkillRegistry } from './registry/index.js';
export { MCPSkillProvider } from './integration/index.js';
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