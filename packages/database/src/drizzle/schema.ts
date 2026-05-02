/**
 * Schema barrel — re-exports from schema/ directory
 * This file exists so that `import from './schema.js'` resolves correctly
 * with NodeNext module resolution (which requires a .ts file, not a directory)
 */
export * from './schema/index.js';
