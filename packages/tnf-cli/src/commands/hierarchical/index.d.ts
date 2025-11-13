export * from './base.js';
export * from './dev.js';
export * from './run.js';
export * from './agent.js';
export * from './workflow.js';
export * from './infra.js';
export * from './deploy.js';
export * from './monitor.js';
export * from './security.js';
export * from './scale.js';
export * from './ops.js';
export * from './mcp.js';
/**
 * Register all hierarchical commands with the main CLI program
 */
export declare function registerHierarchicalCommands(program: any): void;
/**
 * Get all available hierarchical command categories
 */
export declare function getHierarchicalCategories(): string[];
/**
 * Get available subcommands for a specific category
 */
export declare function getCategorySubcommands(category: string): string[];
//# sourceMappingURL=index.d.ts.map