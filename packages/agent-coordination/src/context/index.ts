/**
 * Context window branching: fork parent session context into an isolated
 * child scope, then merge only verified diffs/receipts.
 */

export { ContextBranchManager, estimateTokens, measureTurns } from './ContextBranchManager.js';
export * from './types.js';
