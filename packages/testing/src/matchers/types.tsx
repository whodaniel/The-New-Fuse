import { ReactElement } from 'react';
import { ZodSchema } from 'zod';
import { ComponentValidator } from './toBeValidComponent.js';
import { APIContract } from './toMatchAPIContract.js';

declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * Validates that the received value matches the workflow schema
       */
      toBeValidWorkflow(): R;

      /**
       * Checks if a user has the specified permission
       * @param permission The permission to check for
       */
      toHavePermission(permission: string): R;

      /**
       * Validates that an API response matches its contract definition
       * @param contract The API contract to validate against
       */
      toMatchAPIContract(contract: APIContract): R;

      /**
       * Validates a React component against specified requirements
       * @param validator Component validation rules
       */
      toBeValidComponent(validator: ComponentValidator): R;

      /**
       * Checks if an async operation completes within the specified time
       * @param timeLimit Time limit in milliseconds
       */
      toCompleteWithinTime(timeLimit: number): R;
    }
  }
}