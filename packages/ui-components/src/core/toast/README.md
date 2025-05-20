# Toast Component

The Toast component provides a way to show non-intrusive notifications to users.

## Features

- Multiple toast variants: default, success, info, warning, destructive
- Customizable duration
- Auto-dismiss functionality
- Programmatic control (create, update, dismiss)
- Accessible design

## Usage

### Basic Usage

```tsx
import { useToast } from '@the-new-fuse/ui-consolidated';

function MyComponent() {
  const { toast } = useToast();
  
  const handleClick = () => {
    toast({
      title: 'Success',
      description: 'Your changes have been saved',
      variant: 'success',
      duration: 5000, // 5 seconds
    });
  };
  
  return (
    <button onClick={handleClick}>
      Show Toast
    </button>
  );
}
```

### Setting Up the Toast Provider

Add the `ToastProvider` to your application, typically at the root level:

```tsx
import { ToastProvider } from '@the-new-fuse/ui-consolidated';

function App() {
  return (
    <ToastProvider>
      {/* Your app content */}
    </ToastProvider>
  );
}
```

### Using the Toaster Component

For a simpler setup, you can use the `Toaster` component:

```tsx
import { Toaster } from '@the-new-fuse/ui-consolidated';

function Layout({ children }) {
  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  );
}
```

### Toast Variants

The toast component supports multiple variants:

- `default`: Standard toast
- `success`: Green toast for successful operations
- `info`: Blue toast for informational messages
- `warning`: Yellow toast for warnings
- `destructive`: Red toast for errors or destructive actions

### Advanced Usage

You can update or dismiss toasts programmatically:

```tsx
function AdvancedExample() {
  const { toast, dismiss, update } = useToast();
  
  const showLoadingToast = () => {
    const id = toast({
      title: 'Loading',
      description: 'Please wait...',
      variant: 'info',
      duration: 0, // Won't auto-dismiss
    });
    
    // Simulate an API call
    setTimeout(() => {
      // Update the toast
      update(id, {
        title: 'Success',
        description: 'Operation completed',
        variant: 'success',
        duration: 3000, // Will dismiss after 3 seconds
      });
    }, 2000);
  };
  
  return (
    <button onClick={showLoadingToast}>
      Start Operation
    </button>
  );
}
```

## API Reference

### ToastProps

| Property    | Type                                                      | Description                                |
|-------------|-----------------------------------------------------------|--------------------------------------------|
| variant     | 'default' \| 'success' \| 'info' \| 'warning' \| 'destructive' | The visual style of the toast              |
| title       | string                                                    | The title of the toast                     |
| description | React.ReactNode                                           | The description/content of the toast       |
| action      | React.ReactNode                                           | Optional action element (e.g., close button) |
| duration    | number                                                    | Duration in ms before auto-dismiss (0 = no auto-dismiss) |

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
