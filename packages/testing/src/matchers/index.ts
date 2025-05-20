import { toBeValidWorkflow } from './toBeValidWorkflow.js';
import { toHavePermission } from './toHavePermission.js';
import { toMatchAPIContract } from './toMatchAPIContract.js';
import { toBeValidComponent } from './toBeValidComponent.js';
import { toCompleteWithinTime } from './toCompleteWithinTime.js';

// Use export type for type-only exports
export type { ComponentValidator } from './toBeValidComponent.js';
export type { APIContract } from './toMatchAPIContract.js';
export * from './types.js';

/**
 * Extends Jest's expect with custom matchers for The New Fuse platform
 */
export function setupTestMatchers() {
  expect.extend({
    toBeValidWorkflow,
    toHavePermission,
    toMatchAPIContract,
    toBeValidComponent,
    toCompleteWithinTime
  });
}