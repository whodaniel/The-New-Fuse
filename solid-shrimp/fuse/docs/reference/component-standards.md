# Component Standards for The New Fuse

This document outlines the standards and patterns to follow when developing components for The New Fuse platform.

## Component Structure

### Directory Structure
Each component should be structured as follows:
```
ComponentName/
  ├─ index.ts       // Exports the component
  ├─ ComponentName.tsx  // Main component implementation
  ├─ ComponentName.test.tsx // Tests
  ├─ ComponentName.types.ts // TypeScript interfaces/types
  ├─ ComponentName.styles.ts // Styling (if applicable)
  └─ README.md      // Component documentation
```

### Naming Conventions
- Component files: PascalCase (e.g., `ButtonGroup.tsx`)
- Utility files: camelCase (e.g., `formatMessage.ts`)
- Test files: Same name as the file being tested with `.test` suffix
- Constant files: UPPER_SNAKE_CASE for the constants inside

## Documentation Requirements

Each component should have:
1. JSDoc comments for the component and its props
2. A README.md explaining:
   - Purpose and usage examples
   - Props API
   - Any important implementation details
   - Related components

Example:
```tsx
/**
 * MessageDisplay - Renders a message from an LLM with appropriate styling
 * 
 * @param message - The message content to display
 * @param sender - The entity that sent the message
 * @param timestamp - When the message was sent
 */
export const MessageDisplay: React.FC<MessageDisplayProps> = ({
  message,
  sender,
  timestamp,
}) => {
  // Implementation
};
```

## Coding Patterns

### Component Definition
- Use functional components with TypeScript interfaces
- Use React.FC type with explicit props interface
- Use destructuring for props
- Avoid anonymous components

### State Management
- Use hooks appropriately (useState, useEffect, useContext, etc.)
- For complex state, consider custom hooks or context
- Document state dependencies clearly

### Props
- Make components as pure as possible
- Use sensible defaults when appropriate
- Validate props with PropTypes or TypeScript

### Styling
- Prefer styled-components or other CSS-in-JS solution
- Keep styles co-located with components
- Use theme variables for consistency

## Performance Considerations

- Memoize expensive calculations with useMemo
- Prevent unnecessary re-renders with React.memo
- Use useCallback for event handlers passed as props
- Avoid direct DOM manipulation
- Consider code-splitting for large components

## Accessibility

- Use semantic HTML elements
- Include aria attributes when needed
- Ensure keyboard navigation works
- Test with screen readers periodically

## Testing Requirements

Each component should have tests that cover:
- Rendering with default props
- Rendering with various prop combinations
- User interactions
- Edge cases

## Example Component

See the `/examples` directory for reference implementations that follow these standards.
