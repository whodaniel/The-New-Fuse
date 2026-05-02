/**
 * Drizzle barrel — re-exports from drizzle/ directory
 * This file exists so that `import from './drizzle.js'` resolves correctly
 * with NodeNext module resolution (which requires a .ts file, not a directory)
 */
export * from './drizzle/index.js';
