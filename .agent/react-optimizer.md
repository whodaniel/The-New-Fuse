# React Component Optimizer

**Type:** Task-Based Agent **Focus:** Optimize React components for performance
and maintainability **Scope:** Frontend development (React + Vite)

## Capabilities

This agent specializes in:

- Identifying performance bottlenecks in React components
- Implementing `useMemo`, `useCallback`, and `React.memo` correctly
- Optimizing rendering cycles
- Reducing bundle size
- Improving accessibility (a11y)
- Ensuring consistent styling with Tailwind CSS / CSS Modules

## Task Definition

**Input:** React component code or file path **Output:** Optimized component
code with performance improvements and explanation

## Usage Pattern

```typescript
// Example prompt:
"Optimize the WorkflowCanvas component. It re-renders too frequently when nodes are dragged.
Check for unnecessary prop drilling and missing memoization.
Ensure accessibility compliance."
```

## Optimization Strategies

### Memoization Template

```typescript
import React, { memo, useMemo, useCallback } from 'react';

interface Props {
  data: any[];
  onItemClick: (id: string) => void;
}

const HeavyComponent = memo(({ data, onItemClick }: Props) => {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return data.map(item => expensiveTransform(item));
  }, [data]);

  // Stable callback reference
  const handleClick = useCallback((id: string) => {
    onItemClick(id);
  }, [onItemClick]);

  return (
    <ul>
      {processedData.map(item => (
        <ListItem
          key={item.id}
          item={item}
          onClick={handleClick}
        />
      ))}
    </ul>
  );
}, (prevProps, nextProps) => {
  // Optional custom comparison function for strict control
  return prevProps.data === nextProps.data;
});

HeavyComponent.displayName = 'HeavyComponent';
```

### Rendering Optimization

- Virtualize long lists using `react-window` or `react-virtuoso`
- Lazy load non-critical components with `React.lazy` and `Suspense`
- Debounce high-frequency event handlers (search inputs, window resize)
- Avoid inline function definitions in render props

### Bundle Size Reduction

- Use named imports for libraries (e.g., `lodash-es`)
- Dynamic imports for heavy dependencies
- Optimize images using `vite-plugin-image-optimizer` or equivalent

## Quality Checklist

Before completing, ensure:

- [ ] Component is wrapped in `React.memo` where appropriate
- [ ] Props are stable (functions memoized with `useCallback`)
- [ ] Expensive computations use `useMemo`
- [ ] No unnecessary re-renders (verify with React DevTools)
- [ ] Accessibility features (ARIA labels, keyboard nav) are preserved/enhanced
- [ ] Types are strict and properly defined
- [ ] Code follows project styling conventions

## Integration Points

- **State Management:** Recoil / Redux / Context API
- **Styling:** Tailwind CSS / Styled Components
- **Testing:** React Testing Library / Vitest
- **Performance:** Chrome DevTools / Lighthouse

## Success Criteria

Optimized code should:

1. Reduce render count for same props
2. Pass `pnpm run type-check`
3. Pass `pnpm run lint`
4. Maintain 100% functional equivalence
5. Improve interaction responsiveness (INP)
6. Have unit tests verifying behavior
