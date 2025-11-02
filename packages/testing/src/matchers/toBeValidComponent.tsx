import { createMatcher } from './utils';
import { isValidElement, ReactElement, JSXElementConstructor } from 'react';
import { z } from 'zod';

export interface ComponentValidator {
  // Use unknown for prop value type
  props?: Record<string, (value: unknown) => boolean>;
  requiredProps?: string[];
  displayName?: string;
  childrenAllowed?: boolean;
}

export type ComponentValidatorInput = ComponentValidator | z.ZodTypeAny;

// Helper type guard to check if a type is a component constructor
// Use unknown for generic parameter
function isComponentConstructor(type: string | JSXElementConstructor<unknown>): type is JSXElementConstructor<unknown> {
  return typeof type === 'function' || (typeof type === 'object' && type !== null);
}

export const toBeValidComponent = createMatcher(
  (received: any, validator: ComponentValidatorInput): boolean => {
    // Check if it's a valid React element
    if (!isValidElement(received)) {
      return false;
    }

    // Use unknown for props type
    const receivedProps = received.props as Record<string, unknown>;

    // Handle Zod schema validation
    if (validator instanceof z.ZodType) {
      const result = validator.safeParse(receivedProps);
      return result.success;
    }

    // Handle ComponentValidator object
    const componentValidator = validator as ComponentValidator;

    // Check display name if specified
    if (componentValidator.displayName) {
      const type = received.type;
      // Use type assertion to access displayName
      if (!isComponentConstructor(type) || (type as any).displayName !== componentValidator.displayName) {
        return false;
      }
    }

    // Check required props
    if (componentValidator.requiredProps) {
      const missingProps = componentValidator.requiredProps.filter((prop: string) => !(prop in receivedProps));
      if (missingProps.length > 0) {
        return false;
      }
    }

    // Check prop types if specified
    if (componentValidator.props) {
      for (const [key, propValidator] of Object.entries(componentValidator.props)) {
        if (key in receivedProps && !propValidator(receivedProps[key])) {
          return false;
        }
      }
    }

    // Check children if not allowed
    if (componentValidator.childrenAllowed === false && receivedProps.children) {
      return false;
    }

    return true;
  },
  (received: any, validator: ComponentValidatorInput): string => {
    if (!isValidElement(received)) {
      return 'Expected a valid React element';
    }

    // Use unknown for props type
    const receivedProps = received.props as Record<string, unknown>;

    // Handle Zod schema validation error messages
    if (validator instanceof z.ZodType) {
      const result = validator.safeParse(receivedProps);
      if (!result.success) {
        return `Component props did not match schema:\n${result.error.message}`;
      }
      return 'Component props matched schema';
    }

    // Handle ComponentValidator object
    const componentValidator = validator as ComponentValidator;
    const type = received.type;
    // Use type assertion to access displayName
    const actualDisplayName = isComponentConstructor(type) ? (type as any).displayName : undefined;

    if (componentValidator.displayName && actualDisplayName !== componentValidator.displayName) {
      return `Expected component with displayName "${componentValidator.displayName}", but got "${actualDisplayName || (typeof type === 'string' ? type : 'unknown')}"`;
    }

    if (componentValidator.requiredProps) {
      const missingProps = componentValidator.requiredProps.filter((prop: string) => !(prop in receivedProps));
      if (missingProps.length > 0) {
        return `Component is missing required props: ${missingProps.join(', ')}`;
      }
    }

    if (componentValidator.props) {
      for (const [key, propValidator] of Object.entries(componentValidator.props)) {
        if (key in receivedProps && !propValidator(receivedProps[key])) {
          return `Invalid value for prop "${key}"`;
        }
      }
    }

    if (componentValidator.childrenAllowed === false && receivedProps.children) {
      return 'Component should not have children';
    }

    return 'Component validation failed for an unspecified reason';
  },
  () => 'Expected component not to be valid, but it was'
);