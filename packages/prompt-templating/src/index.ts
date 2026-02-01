export { default as ModularPromptTemplatingSystem } from './ModularPromptTemplatingSystem';
export * from './PromptCompiler';
export { default as PromptTemplateNode } from './PromptTemplateNode';
export * from './types';

// Re-export main components for easy import
export { default } from './ModularPromptTemplatingSystem';

// Note: PromptTemplateService is NOT exported from the main index
// because it contains server-side database dependencies.
// Import it directly from './PromptTemplateService' if needed on the backend.
