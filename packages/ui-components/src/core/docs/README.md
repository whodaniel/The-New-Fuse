# Core Components

This directory contains the core UI components used throughout the application. These components are designed to be reusable, accessible, and consistent with our design system.

## Components

### Button
A versatile button component that supports multiple variants, sizes, and states.

```tsx
import { Button } from '@/components/core';

// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>

// With sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>

// With loading state
<Button loading>Processing...</Button>

// With icon
<Button icon={<IconComponent />}>With Icon</Button>
```

### Card
A flexible card component for grouping related content.

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/core';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>

// With hover and clickable states
<Card hover clickable>
  Interactive card
</Card>
```

### Input
A form input component with support for labels, helper text, and icons.

```tsx
import { Input } from '@/components/core';

// Basic usage
<Input placeholder="Enter text" />

// With label and helper text
<Input
  label="Username"
  helperText="Enter your username"
  placeholder="johndoe"
/>

// With error state
<Input
  error
  label="Email"
  helperText="Invalid email address"
  type="email"
/>

// With icons
<Input
  startIcon={<SearchIcon />}
  placeholder="Search..."
/>
```

## Component Structure

Each component follows a consistent structure:

```
ComponentName/
├── index.tsx      # Main component implementation
├── types.ts       # TypeScript types and interfaces
└── styles.ts      # Styles (if needed)
```

## Best Practices

1. Always use TypeScript for type safety
2. Use the `cn()` utility for class name merging
3. Implement proper accessibility attributes
4. Support dark mode through CSS variables
5. Use React.forwardRef for proper ref handling
6. Include proper prop documentation
7. Follow consistent naming conventions

## Theme Integration

Components use CSS variables for theming, defined in our global CSS:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  /* ... other theme variables ... */
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  /* ... dark theme variables ... */
}
```

## Contributing

When adding new components or modifying existing ones:

1. Follow the established component structure
2. Add proper TypeScript types
3. Include documentation and examples
4. Ensure accessibility compliance
5. Add necessary tests
6. Update this documentation
