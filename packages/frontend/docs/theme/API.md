# Theme Context API Documentation

## Components

### ThemeProvider
Provides theme context to the application.

```tsx
<ThemeProvider>
  <App />
</ThemeProvider>
```

### useTheme Hook
```tsx
const { currentTheme, setTheme, customizeTheme, themeConfig } = useTheme();
```

## Types

```typescript
type ThemeType = 'light' | 'dark' | 'custom';

interface ThemeCustomization {
  colors?: ThemeColors;
  fonts?: ThemeFonts;
  contrast?: boolean;
}
```

## Methods

### setTheme(theme: ThemeType)
Changes the current theme.

### customizeTheme(customization: ThemeCustomization)
Applies custom theme settings.