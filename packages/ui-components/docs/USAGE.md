# UI Components Usage Guide

## Installation

```bash
npm install @your-org/ui-components
```

## Core Components

### BaseWorkspace

The BaseWorkspace component provides a flexible layout system for building workspace interfaces.

```tsx
import { BaseWorkspace } from '@your-org/ui-components';

function MyWorkspace() {
  return (
    <BaseWorkspace
      header={<MyHeader />}
      sidebar={<MySidebar />}
      main={<MainContent />}
      sidebarWidth="w-1/3"
      tools={['chat', 'canvas']}
    />
  );
}
```

### ChatCore

ChatCore provides a complete chat interface with support for messages, attachments, and real-time features.

```tsx
import { ChatCore } from '@your-org/ui-components';

function MyChat() {
  return (
    <ChatCore
      enableVoice
      enableAttachments
      onSend={(message) => {
        // Handle message sending
      }}
    />
  );
}
```

### Button

Standard button component with multiple variants and states.

```tsx
import { Button } from '@your-org/ui-components';

function MyComponent() {
  return (
    <Button
      variant="primary"
      size="lg"
      loading={isLoading}
      icon={<IconComponent />}
    >
      Click Me
    </Button>
  );
}
```

## Theming

The components support light and dark themes out of the box:

```tsx
import { ThemeProvider } from '@your-org/ui-components';

function App() {
  return (
    <ThemeProvider theme="dark">
      <MyComponents />
    </ThemeProvider>
  );
}
```

## Best Practices

1. Always wrap your application with ThemeProvider
2. Use the provided type definitions for proper TypeScript support
3. Utilize the built-in variants instead of custom styling when possible
4. Follow the component composition patterns for complex interfaces