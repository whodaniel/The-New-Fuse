export { resolveMatrixAuth, resolveMatrixConfig } from './client/config.js';
export { createMatrixClient } from './client/create-client.js';
export { isBunRuntime } from './client/runtime.js';
export { resolveSharedMatrixClient, stopSharedClient, waitForMatrixSync } from './client/shared.js';
export type { MatrixAuth, MatrixResolvedConfig } from './client/types.js';
