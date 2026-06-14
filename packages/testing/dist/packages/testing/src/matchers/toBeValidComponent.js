"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toBeValidComponent = void 0;
const utils_1 = require("./utils");
const react_1 = require("react");
const zod_1 = require("zod");
// Helper type guard to check if a type is a component constructor
// Use unknown for generic parameter
function isComponentConstructor(type) {
    return typeof type === 'function' || (typeof type === 'object' && type !== null);
}
exports.toBeValidComponent = (0, utils_1.createMatcher)((received, validator) => {
    // Check if it's a valid React element
    if (!(0, react_1.isValidElement)(received)) {
        return false;
    }
    // Use unknown for props type
    const receivedProps = received.props;
    // Handle Zod schema validation
    if (validator instanceof zod_1.z.ZodType) {
        const result = validator.safeParse(receivedProps);
        return result.success;
    }
    // Handle ComponentValidator object
    const componentValidator = validator;
    // Check display name if specified
    if (componentValidator.displayName) {
        const type = received.type;
        // Use type assertion to access displayName
        if (!isComponentConstructor(type) || type.displayName !== componentValidator.displayName) {
            return false;
        }
    }
    // Check required props
    if (componentValidator.requiredProps) {
        const missingProps = componentValidator.requiredProps.filter((prop) => !(prop in receivedProps));
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
}, (received, validator) => {
    if (!(0, react_1.isValidElement)(received)) {
        return 'Expected a valid React element';
    }
    // Use unknown for props type
    const receivedProps = received.props;
    // Handle Zod schema validation error messages
    if (validator instanceof zod_1.z.ZodType) {
        const result = validator.safeParse(receivedProps);
        if (!result.success) {
            return `Component props did not match schema:\n${result.error.message}`;
        }
        return 'Component props matched schema';
    }
    // Handle ComponentValidator object
    const componentValidator = validator;
    const type = received.type;
    // Use type assertion to access displayName
    const actualDisplayName = isComponentConstructor(type) ? type.displayName : undefined;
    if (componentValidator.displayName && actualDisplayName !== componentValidator.displayName) {
        return `Expected component with displayName "${componentValidator.displayName}", but got "${actualDisplayName || (typeof type === 'string' ? type : 'unknown')}"`;
    }
    if (componentValidator.requiredProps) {
        const missingProps = componentValidator.requiredProps.filter((prop) => !(prop in receivedProps));
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
}, () => 'Expected component not to be valid, but it was');
//# sourceMappingURL=toBeValidComponent.js.map