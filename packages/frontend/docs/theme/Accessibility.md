# Accessibility Features

## High Contrast Mode

High contrast mode increases the contrast ratio between elements to improve readability.

### Usage
```tsx
const { customizeTheme } = useTheme();
customizeTheme({ contrast: true });
```

## Color Safe Palettes

All default color combinations meet WCAG 2.1 AA standards for contrast ratios.

## Keyboard Navigation

Theme customizer is fully keyboard accessible with the following shortcuts:
- `Alt + T`: Toggle theme
- `Alt + C`: Toggle high contrast