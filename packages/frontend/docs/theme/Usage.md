# Theme Customization Guide

## Basic Usage

```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme('dark')}>
      Switch to Dark Mode
    </button>
  );
}
```

## Custom Themes

```tsx
const { customizeTheme } = useTheme();

// Apply custom colors
customizeTheme({
  colors: {
    primary: '#FF0000',
    secondary: '#00FF00'
  }
});
```

## Accessibility Features

- High Contrast Mode
- Reduced Motion
- Custom Font Sizes
- Color Safe Palettes