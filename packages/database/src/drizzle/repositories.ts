/**
 * Repositories barrel — re-exports from repositories/ directory
 * This file exists so that `import from './repositories.js'` resolves correctly
 * with NodeNext module resolution (which requires a .ts file, not a directory)
 */
export * from './repositories/index.js';
