# Preloader Components

Loading indicator components for various use cases, from inline loading states to full-screen overlays.

## Components

### Preloader

A flexible spinner component that can be used inline or centered within its container.

```tsx
// Basic usage
<Preloader />

// With size variant
<Preloader size="lg" />

// Centered in container
<Preloader center />

// Custom color variant
<Preloader variant="light" />
```

### FullScreenLoader

A full-screen loading overlay with backdrop blur.

```tsx
// Basic usage
<FullScreenLoader />

// With custom variant
<FullScreenLoader variant="dark" />
```

## Props

### Preloader Props
| Prop      | Type             | Default   | Description                    |
|-----------|------------------|-----------|--------------------------------|
| size      | PreloaderSize    | 'md'      | Size of the spinner           |
| variant   | PreloaderVariant | 'default' | Color variant                 |
| center    | boolean          | false     | Center in container           |
| className | string          | undefined  | Additional CSS classes        |

### Size Options
- xs: Extra small (12px)
- sm: Small (16px)
- md: Medium (24px)
- lg: Large (32px)
- xl: Extra large (48px)

### Variants
- default: Primary color
- light: White
- dark: Near black
- muted: Gray

## Accessibility
- Includes proper ARIA role="status"
- Screen reader text for loading state
- Maintains color contrast ratios
