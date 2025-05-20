# Toast Component

The Toast component provides a way to show non-intrusive notifications to users. It's designed to be flexible, accessible, and easy to use.

## Installation

The Toast component is part of the `@the-new-fuse/ui-components` package.

```bash
yarn add @the-new-fuse/ui-components
```

## Basic Usage

To use the Toast component, you need to:

1. Wrap your application with the `ToastProvider`
2. Use the `useToast` hook to show toasts
3. Add the `Toaster` component to render the toasts

```tsx
// App.tsx
import { ToastProvider, Toaster } from '@the-new-fuse/ui-consolidated';

function App() {
  return (
    <ToastProvider>
      <YourApp />
      <Toaster position="bottom-right" />
    </ToastProvider>
  );
}
```

```tsx
// YourComponent.tsx
import { useToast, Button } from '@the-new-fuse/ui-consolidated';

function YourComponent() {
  const { toast } = useToast();
  
  const handleClick = () => {
    toast({
      title: 'Success',
      description: 'Your changes have been saved',
      variant: 'success',
    });
  };
  
  return (
    <Button onClick={handleClick}>
      Save Changes
    </Button>
  );
}
```

## Toast Variants

The toast component supports multiple variants:

- `default`: Standard toast
- `success`: Green toast for successful operations
- `info`: Blue toast for informational messages
- `warning`: Yellow toast for warnings
- `destructive`: Red toast for errors or destructive actions

```tsx
// Success toast
toast({
  title: 'Success',
  description: 'Operation completed successfully',
  variant: 'success',
});

// Info toast
toast({
  title: 'Information',
  description: 'Here is some important information',
  variant: 'info',
});

// Warning toast
toast({
  title: 'Warning',
  description: 'This action might have consequences',
  variant: 'warning',
});

// Error toast
toast({
  title: 'Error',
  description: 'Something went wrong',
  variant: 'destructive',
});
```

## Customizing Duration

By default, toasts are automatically dismissed after 5 seconds (5000ms). You can customize this by setting the `duration` property:

```tsx
// Toast that stays for 10 seconds
toast({
  title: 'Long Toast',
  description: 'This toast will stay for 10 seconds',
  duration: 10000,
});

// Toast that doesn't auto-dismiss
toast({
  title: 'Persistent Toast',
  description: 'This toast will not auto-dismiss',
  duration: 0, // 0 means no auto-dismiss
});
```

## Programmatic Control

The `useToast` hook provides methods to programmatically control toasts:

```tsx
function AdvancedExample() {
  const { toast, dismiss, update } = useToast();
  
  const startOperation = () => {
    // Show a loading toast
    const id = toast({
      title: 'Loading',
      description: 'Please wait while we process your request',
      variant: 'info',
      duration: 0, // Don't auto-dismiss
    });
    
    // Simulate an API call
    fetchData()
      .then((result) => {
        // Update the toast on success
        update(id, {
          title: 'Success',
          description: 'Operation completed successfully',
          variant: 'success',
          duration: 3000, // Auto-dismiss after 3 seconds
        });
      })
      .catch((error) => {
        // Update the toast on error
        update(id, {
          title: 'Error',
          description: error.message,
          variant: 'destructive',
          duration: 5000,
        });
      });
  };
  
  return (
    <Button onClick={startOperation}>
      Start Operation
    </Button>
  );
}
```

## Custom Actions

You can add custom actions to your toasts:

```tsx
toast({
  title: 'File Uploaded',
  description: 'Your file has been uploaded successfully',
  variant: 'success',
  action: (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.open('/files', '_blank')}
    >
      View Files
    </Button>
  ),
});
```

## Toaster Component

The `Toaster` component renders all active toasts. You can customize its position:

```tsx
<Toaster position="top-right" />
```

Available positions:
- `top-left`
- `top-right`
- `bottom-left`
- `bottom-right` (default)

## Standalone Usage

If you need to use toasts outside of React components (e.g., in utility functions), you can use the standalone `toast` function:

```tsx
// In your app setup
import { ToastProvider, Toaster, toast } from '@the-new-fuse/ui-consolidated';

function App() {
  return (
    <ToastProvider>
      <YourApp />
      <Toaster />
    </ToastProvider>
  );
}

// In a utility function
import { toast } from '@the-new-fuse/ui-consolidated';

function handleApiError(error) {
  toast({
    title: 'API Error',
    description: error.message,
    variant: 'destructive',
  });
}
```

## Accessibility

The Toast component is designed with accessibility in mind:

- Toasts are announced to screen readers
- Focus management ensures keyboard users can interact with toasts
- Color contrast meets WCAG standards
- Toasts can be dismissed with the keyboard

## API Reference

### ToastProps

| Property    | Type                                                      | Default   | Description                                |
|-------------|-----------------------------------------------------------|----------|--------------------------------------------|
| variant     | 'default' \| 'success' \| 'info' \| 'warning' \| 'destructive' | 'default' | The visual style of the toast              |
| title       | string                                                    | -         | The title of the toast                     |
| description | React.ReactNode                                           | -         | The description/content of the toast       |
| action      | React.ReactNode                                           | -         | Optional action element (e.g., close button) |
| duration    | number                                                    | 5000      | Duration in ms before auto-dismiss (0 = no auto-dismiss) |

### useToast Hook

| Method  | Parameters                   | Return Type      | Description                                |
|---------|------------------------------|------------------|--------------------------------------------|
| toast   | ToastProps                   | string           | Creates a new toast and returns its ID     |
| dismiss | id: string                   | void             | Dismisses a toast by ID                    |
| update  | id: string, props: ToastProps| void             | Updates an existing toast                  |
| toasts  | -                            | ToasterToast[]   | Array of all active toasts                 |

### Toaster Component

| Property  | Type                                                   | Default        | Description                          |
|-----------|--------------------------------------------------------|----------------|--------------------------------------|
| position  | 'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right' | 'bottom-right' | Position of the toasts on the screen |
| className | string                                                 | -              | Additional CSS classes               |

### ToastProvider Component

| Property  | Type           | Default | Description                          |
|-----------|----------------|---------|--------------------------------------|
| children  | React.ReactNode| -       | The content to wrap with the provider|
