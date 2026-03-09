/**
 * Route Module Registry
 *
 * This file serves as the central registry for all route modules.
 * Import route modules here and export them for use in the main router.
 *
 * Benefits:
 * - Single source of truth for all routes
 * - Easy to add/remove route modules
 * - Better code organization and maintainability
 */

// Core Routes
export * from './core.routes';

// Auth Routes
export * from './auth.routes';

// Additional route modules will be exported here as they are split out of
// `ComprehensiveRouter.tsx`. Keep this registry restricted to existing files
// so the incremental router refactor does not break compilation.
