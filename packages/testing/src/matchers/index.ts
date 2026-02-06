import { toBeValidWorkflow } from './toBeValidWorkflow';
import { toHavePermission } from './toHavePermission';
import { toMatchAPIContract } from './toMatchAPIContract';
import { toBeValidComponent } from './toBeValidComponent';
import { toCompleteWithinTime } from './toCompleteWithinTime';

// Use export type for type-only exports
export type { ComponentValidator, ComponentValidatorInput } from './toBeValidComponent';
export type { APIContract } from './toMatchAPIContract';
export * from './types';

/**
 * Extends Jest's expect with custom matchers for The New Fuse platform
 */
export function setupTestMatchers() {
  expect.extend({
    toBeValidWorkflow,
    toHavePermission,
    toMatchAPIContract,
    toBeValidComponent,
    toCompleteWithinTime,
  });
}
