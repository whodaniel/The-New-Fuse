# The New Fuse Component Library

This document provides an overview of the component library for The New Fuse platform.

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Component Categories](#component-categories)
- [Theming](#theming)
- [Best Practices](#best-practices)
- [Contributing](#contributing)

## Introduction

The New Fuse Component Library is a comprehensive set of React components designed to provide a consistent user interface across the platform. The library is built with TypeScript, React, and Tailwind CSS, and follows modern best practices for component design.

## Getting Started

### Installation

```bash
# Using npm
npm install @the-new-fuse/ui-consolidated

# Using yarn
yarn add @the-new-fuse/ui-consolidated

# Using pnpm
pnpm add @the-new-fuse/ui-consolidated
```

### Basic Usage

```jsx
import { Button, Card, Input } from '@the-new-fuse/ui-consolidated';

function MyComponent() {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Sign In</Card.Title>
        <Card.Description>Enter your credentials to sign in</Card.Description>
      </Card.Header>
      <Card.Content>
        <Input label="Email" placeholder="Enter your email" />
        <Input label="Password" type="password" placeholder="Enter your password" />
      </Card.Content>
      <Card.Footer>
        <Button variant="primary">Sign In</Button>
      </Card.Footer>
    </Card>
  );
}
```

### Theme Provider

Wrap your application with the `ThemeProvider` to enable theme support:

```jsx
import { ThemeProvider } from '@the-new-fuse/ui-consolidated';

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <YourApp />
    </ThemeProvider>
  );
}
```

### API Provider

Wrap your application with the `ApiProvider` to enable API client access:

```jsx
import { ApiProvider } from '@the-new-fuse/ui-consolidated';
import { createApiClient } from '@the-new-fuse/api-client';

// Create API client and services
const {
  apiClient,
  tokenStorage,
  authService,
  userService,
  agentService,
  workflowService,
} = createApiClient({
  apiClientOptions: {
    baseURL: 'https://api.example.com',
  },
});

function App() {
  return (
    <ApiProvider
      apiClient={apiClient}
      tokenStorage={tokenStorage}
      authService={authService}
      userService={userService}
      agentService={agentService}
      workflowService={workflowService}
    >
      <YourApp />
    </ApiProvider>
  );
}
```

## Component Categories

### Core Components

- **Accordion**: Collapsible content panels
- **Alert**: Contextual feedback messages
- **Badge**: Small status descriptors
- **Breadcrumb**: Navigation hierarchy
- **Button**: Action triggers
- **Card**: Content containers
- **Checkbox**: Boolean input
- **Dropdown**: Contextual menus
- **Input**: Text input fields
- **Modal**: Dialog windows
- **Pagination**: Page navigation
- **Radio**: Single selection from multiple options
- **Select**: Dropdown selection
- **Switch**: Toggle component
- **Tabs**: Tabbed interface
- **Textarea**: Multi-line text input
- **Tooltip**: Contextual information

### Layout Components

- **Container**: Responsive container with max-width
- **Layout**: Page layout component
- **Split**: Resizable split view

### Authentication Components

- **LoginForm**: User login form
- **RegisterForm**: User registration form
- **ProtectedRoute**: Route protection based on authentication

## Theming

The component library supports light and dark mode themes. The theme is controlled by the `ThemeProvider` component.

### Theme Variables

The theme is defined using CSS variables in the `theme.css` file. These variables can be customized to match your brand colors.

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... other variables */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  /* ... other variables */
}
```

### Theme Toggle

Use the `ThemeToggle` component to allow users to switch between light and dark mode:

```jsx
import { ThemeToggle } from '@the-new-fuse/ui-consolidated';

function Header() {
  return (
    <header>
      <h1>My App</h1>
      <ThemeToggle />
    </header>
  );
}
```

## Best Practices

### Component Usage

- Always provide accessible labels for form elements
- Use semantic HTML elements
- Follow the component API documentation
- Use the provided variants and sizes for consistency

### Form Handling

- Use controlled components for form inputs
- Provide validation feedback
- Handle loading states appropriately

### Authentication

- Use the `AuthProvider` to manage authentication state
- Use the `ProtectedRoute` component to protect routes
- Handle authentication errors gracefully

## Contributing

### Development

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Run tests
yarn test

# Build the library
yarn build

# Run Storybook
yarn storybook
```

### Adding New Components

1. Create a new component in the `src/components` directory
2. Add the component to the appropriate index file
3. Add tests for the component
4. Add a Storybook story for the component
5. Update the documentation

### Testing

All components should have unit tests. Run the tests with:

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Generate test coverage
yarn test:coverage
```
