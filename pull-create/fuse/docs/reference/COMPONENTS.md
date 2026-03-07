# The New Fuse Component System

## Introduction

The New Fuse component library is built using atomic design principles, providing a scalable and maintainable UI system. This document consolidates component guidelines, standards, and implementation details to serve as a comprehensive reference.

## Component Organization

### Directory Structure

```
components/
├── atoms/           # Basic building blocks (Button, Input, Icon)
├── molecules/       # Combinations of atoms (FormField, SearchBar, Card)
├── organisms/       # Complex components (TaskList, UserProfile, Navigation)
├── ui/              # Basic UI components
├── layout/          # Layout components
├── features/        # Feature-specific components
└── utils/           # Utility components
```

### Component Structure

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

## Component Guidelines

1. Each component should:
   - Have a single responsibility
   - Be typed with TypeScript
   - Include proper prop validation
   - Have consistent naming conventions
   - Include basic documentation

2. Shared Components:
   - Should be generic and reusable
   - Must support theming
   - Should include accessibility features
   - Must be properly exported from index files

3. Feature Components:
   - Should use shared components
   - Must follow consistent state management patterns
   - Should implement proper error boundaries

## Naming Conventions

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

## Design System

### Colors
```typescript
// tailwind.config.js
module.exports = {
  theme: {
    colors: {
      primary: {
        50: '#f0f9ff',
        500: '#0ea5e9',
        900: '#0c4a6e',
      },
      // ... other colors
    }
  }
}
```

### Typography
```typescript
// tailwind.config.js
module.exports = {
  theme: {
    fontFamily: {
      sans: ['Inter', 'system-ui'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
    }
  }
}
```

### Spacing
```typescript
// tailwind.config.js
module.exports = {
  theme: {
    spacing: {
      px: '1px',
      0: '0',
      0.5: '0.125rem',
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      // ... other spacing values
    }
  }
}
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

## Core UI Components

Located in `/apps/frontend/src/shared/ui/core/`

### Button
Base button component with variants

### Card
Flexible container component with compound components for structured content organization.

### Input
Form input elements with various styles, sizes, and states.

### Select
Dropdown selection component built on Radix UI primitives.

### Switch
Toggle switch component for boolean settings.

### Checkbox
Selection component with indeterminate states.

### DropdownMenu
Expandable menu component with keyboard navigation.

## Feature-Specific Components

Located in `/src/components/features/`

### Agent System
- AgentList: Agent management interface
- AgentDetail: Individual agent view
- AgentMetrics: Performance monitoring
- AgentWorkflow: Task management

### Chat System
- ChatRoom: Main chat interface
- RooCoderChat: Specialized coding chat
- MessageList: Chat history display
- InputPanel: Message composition

### Workflow System
- WorkflowCanvas: Main workflow editor
- NodePalette: Available node types
- ConnectionManager: Edge handling
- WorkflowControls: Editor controls

## Workflow Integration

### AgentWorkflowManager
A React component that provides a complete interface for managing agent workflows.

```typescript
import { AgentWorkflowManager } from '@components/AgentWorkflowManager';

<AgentWorkflowManager 
  onWorkflowStart={(config) => void}
  onWorkflowStop={(id) => void}
  onStatusChange={(status) => void}
/>
```

### StatusMonitor
Displays real-time system metrics and health status.

```typescript
import { StatusMonitor } from '@components/StatusMonitor';

<StatusMonitor 
  refreshInterval={5000}
  showDetailedMetrics={true}
/>
```

## Best Practices

1. **Component Composition**
   ```typescript
   // Prefer composition over inheritance
   const Card = ({ children, header }) => (
     <div className="rounded-lg shadow-md">
       {header && <div className="p-4 border-b">{header}</div>}
       <div className="p-4">{children}</div>
     </div>
   );
   ```

2. **State Management**
   ```typescript
   // Use hooks for complex state
   const [state, dispatch] = useReducer(reducer, initialState);
   
   // Use context for shared state
   const value = useContext(ThemeContext);
   ```

3. **Performance Optimization**
   ```typescript
   // Memoize expensive computations
   const memoizedValue = useMemo(() => computeValue(a, b), [a, b]);
   
   // Memoize callbacks
   const memoizedCallback = useCallback(() => {
     doSomething(a, b);
   }, [a, b]);
   ```

4. **Error Handling**
   - Always implement error boundaries
   - Use try-catch blocks for async operations
   - Provide user feedback for failures

5. **Security**
   - Validate all incoming data
   - Implement proper authentication
   - Use secure connections

## Component Import

```typescript
// Preferred import method
import { Button } from '@the-new-fuse/ui';

// For internal components
import { TaskCard } from '@/components';
```

## Migration Strategy

1. Implement new component structure
2. Create new components in parallel
3. Gradually migrate existing code
4. Deprecate old components
5. Remove deprecated code

## Testing Plan

1. Unit Tests
   - Ensure all components have tests
   - Validate component behavior
   - Check prop types and interfaces

2. Integration Tests
   - Test component interactions
   - Validate state management
   - Check event handling

3. E2E Tests
   - Test complete workflows
   - Validate user journeys
   - Check cross-browser compatibility