/**
 * Browser-safe re-exports of shared federation modules.
 * Relative source imports avoid Vite resolving package exports onto CJS `dist/`.
 * tauri-desktop tsconfig omits rootDir so these cross-package source imports typecheck.
 */
export {
  FederationNodeClient,
  type FederationNodeClientOptions,
  type FederationNodeEvent,
} from '../../../../packages/shared/src/federation/FederationNodeClient';

export * from '../../../../packages/shared/src/federation/protocol';
