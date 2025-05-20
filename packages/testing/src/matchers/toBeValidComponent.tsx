import { createMatcher } from './utils.js';
import { isValidElement, ReactElement, JSXElementConstructor } from 'react';

export interface ComponentValidator {
  // Use unknown for prop value type
  props?: Record<string, (value: unknown) => boolean>;
  requiredProps?: string[];
  displayName?: string;
  childrenAllowed?: boolean;
}

// Helper type guard to check if a type is a component constructor
// Use unknown for generic parameter
function isComponentConstructor(type: string | JSXElementConstructor<unknown>): type is JSXElementConstructor<unknown> {
  return typeof type === 'function' || (typeof type === 'object' && type !== null);
}

export const toBeValidComponent = createMatcher(
  (received: ReactElement, validator: ComponentValidator): boolean => {
    // Check if it's a valid React element
    if (!isValidElement(received)) {
      return false;
    }

    // Use unknown for props type
    const receivedProps = received.props as Record<string, unknown>;

    // Check display name if specified
    if (validator.displayName) {
      const type = received.type;
      // Use type assertion to access displayName
      if (!isComponentConstructor(type) || (type as any).displayName !== validator.displayName) {
        return false;
      }
    }

    // Check required props
    if (validator.requiredProps) {
      const missingProps = validator.requiredProps.filter((prop: string) => !(prop in receivedProps));
      if (missingProps.length > 0) {
        return false;
      }
    }

    // Check prop types if specified
    if (validator.props) {
      for (const [key, propValidator] of Object.entries(validator.props)) {
        if (key in receivedProps && !propValidator(receivedProps[key])) {
          return false;
        }
      }
    }

    // Check children if not allowed
    if (validator.childrenAllowed === false && receivedProps.children) {
      return false;
    }

    return true;
  },
  (received: ReactElement, validator: ComponentValidator): string => {
    if (!isValidElement(received)) {
      return 'Expected a valid React element';
    }

    // Use unknown for props type
    const receivedProps = received.props as Record<string, unknown>;
    const type = received.type;
    // Use type assertion to access displayName
    const actualDisplayName = isComponentConstructor(type) ? (type as any).displayName : undefined;

    if (validator.displayName && actualDisplayName !== validator.displayName) {
      return `Expected component with displayName "${validator.displayName}", but got "${actualDisplayName || (typeof type === 'string' ? type : 'unknown')}"`;
    }

    if (validator.requiredProps) {
      const missingProps = validator.requiredProps.filter((prop: string) => !(prop in receivedProps));
      if (missingProps.length > 0) {
        return `Component is missing required props: ${missingProps.join(', ')}`;
      }
    }

    if (validator.props) {
      for (const [key, propValidator] of Object.entries(validator.props)) {
        if (key in receivedProps && !propValidator(receivedProps[key])) {
          return `Invalid value for prop "${key}"`;
        }
      }
    }

    if (validator.childrenAllowed === false && receivedProps.children) {
      return 'Component should not have children';
    }

    return 'Component validation failed for an unspecified reason';
  },
  () => 'Expected component not to be valid, but it was'
);