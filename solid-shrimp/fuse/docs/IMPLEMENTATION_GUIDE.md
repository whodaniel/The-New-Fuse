# The New Fuse Design System Implementation Guide

## 🚀 Getting Started with the Design System

This guide provides step-by-step instructions for implementing the comprehensive
design system across all pages in The New Fuse application.

---

## 📋 Table of Contents

1. [Setup and Installation](#setup-and-installation)
2. [Component Usage](#component-usage)
3. [Layout Implementation](#layout-implementation)
4. [Theming System](#theming-system)
5. [Animation Integration](#animation-integration)
6. [Responsive Design](#responsive-design)
7. [Accessibility Implementation](#accessibility-implementation)
8. [Migration Guide](#migration-guide)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## 🛠️ Setup and Installation

### 1. Import CSS Files

```jsx
// In your main layout or app entry point
import '@/styles/design-system.css';
import '@/styles/main.css';
```

### 2. Import Components

```jsx
import {
  Button,
  Card,
  StandardLayout,
  ResponsiveGrid,
  // ... other components
} from '@/components/ui/design-system';
```

### 3. Set Up Theme Context

```jsx
import { ThemeProvider } from '@/contexts/ThemeContext';

// Wrap your app with ThemeProvider
function App() {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  );
}
```

---

## 🧩 Component Usage

### Buttons

```jsx
// Primary button
<Button variant="primary" size="md">
  Primary Action
</Button>

// Secondary button
<Button variant="secondary">
  Secondary Action
</Button>

// Outline button
<Button variant="outline">
  Outline Action
</Button>
```

### Cards

```jsx
<Card variant="default" shadow="md">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Content goes here</p>
  </CardContent>
  <CardFooter>
    <Button variant="primary">Action</Button>
  </CardFooter>
</Card>
```

### Layout System

```jsx
<StandardLayout
  title="Dashboard"
  subtitle="Welcome back, User"
  breadcrumbs={[
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: '/dashboard' },
  ]}
>
  {/* Page content */}
  <ResponsiveGrid cols={[1, 2, 3, 4]}>
    <Card>Item 1</Card>
    <Card>Item 2</Card>
    <Card>Item 3</Card>
    <Card>Item 4</Card>
  </ResponsiveGrid>
</StandardLayout>
```

---

## 🏗️ Layout Implementation

### Standard Layout Structure

```jsx
export function DashboardPage() {
  return (
    <StandardLayout
      title="Dashboard"
      subtitle="Overview of your system"
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Dashboard', path: '/dashboard' },
      ]}
    >
      {/* Main content */}
      <div className="grid gap-6">
        <StatCard title="Active Agents" value="12" change="+2" />
        <StatCard title="Total Interactions" value="1,234" change="+15%" />
      </div>
    </StandardLayout>
  );
}
```

### Responsive Grid Usage

```jsx
<ResponsiveGrid cols={[1, 2, 3, 4]} gap={6}>
  <Card>Mobile: Full width</Card>
  <Card>Tablet: 2 columns</Card>
  <Card>Desktop: 3 columns</Card>
  <Card>Large Desktop: 4 columns</Card>
</ResponsiveGrid>
```

---

## 🎨 Theming System

### Theme Switching

```jsx
import { useTheme } from '@/contexts/ThemeContext';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button onClick={toggleTheme}>
      {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
    </Button>
  );
}
```

### Custom Themes

```css
/* In your CSS file */
[data-theme='custom'] {
  --color-primary: #your-color;
  --color-secondary: #your-color;
  /* Override other theme variables */
}
```

---

## 🎭 Animation Integration

### Built-in Animations

```jsx
<div className="fade-in">Fade in content</div>
<div className="slide-in animation-delay-200">Delayed slide in</div>
<div className="scale-in">Scale in effect</div>
```

### Custom Animations

```jsx
// In your component
const [isVisible, setIsVisible] = useState(false);

return (
  <div className={isVisible ? 'fade-in' : 'opacity-0'}>
    Content that fades in
  </div>
);
```

---

## 📱 Responsive Design

### Responsive Classes

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Responsive grid */}
</div>

<div className="text-sm md:text-base lg:text-lg">
  {/* Responsive text */}
</div>
```

### Mobile-First Approach

```jsx
// Mobile: hidden, Desktop: visible
<div className="hidden md:block">Desktop only content</div>

// Mobile: visible, Desktop: hidden
<div className="md:hidden">Mobile only content</div>
```

---

## ♿ Accessibility Implementation

### Focus Management

```jsx
<button className="focus-visible:ring-2 focus-visible:ring-primary">
  Accessible Button
</button>
```

### Screen Reader Content

```jsx
<span className="sr-only">Screen reader only text</span>
```

### Keyboard Navigation

```jsx
// Ensure all interactive elements are keyboard accessible
<button onKeyDown={(e) => e.key === 'Enter' && handleClick()}>
  Keyboard Accessible
</button>
```

---

## 🔄 Migration Guide

### From Legacy Components

```jsx
// Before (legacy)
<div className="old-card-style">Content</div>

// After (design system)
<Card variant="default">Content</Card>
```

### From Inline Styles

```jsx
// Before (inline styles)
<div style={{ padding: '16px', borderRadius: '8px' }}>Content</div>

// After (design system)
<Card className="p-md rounded-lg">Content</Card>
```

---

## ✅ Best Practices

### 1. **Component Consistency**

Always use design system components instead of custom implementations.

### 2. **Responsive by Default**

Test all components on mobile, tablet, and desktop.

### 3. **Accessibility First**

Ensure proper contrast ratios and keyboard navigation.

### 4. **Performance Optimization**

Use CSS transitions and animations judiciously.

### 5. **Documentation**

Keep component usage documented and up-to-date.

---

## 🐛 Troubleshooting

### Common Issues

**Issue: Components not rendering correctly**

- Check CSS imports
- Verify theme context is properly set up
- Ensure no conflicting styles

**Issue: Animations not working**

- Check animation classes are applied
- Verify no CSS conflicts
- Ensure proper timing functions

**Issue: Responsive grid not working**

- Check breakpoint classes
- Verify grid column definitions
- Ensure proper container structure

---

## 📚 Additional Resources

- **Design System Documentation**:
  [DESIGN_SYSTEM_DOCUMENTATION.md](DESIGN_SYSTEM_DOCUMENTATION.md)
- **Component API Reference**: [COMPONENT_API.md](COMPONENT_API.md)
- **Accessibility Guidelines**: [ACCESSIBILITY.md](ACCESSIBILITY.md)

---

## 🎉 Conclusion

This implementation guide provides everything needed to integrate the
comprehensive design system into The New Fuse application. By following these
guidelines, you'll ensure 100% cohesion across all pages while maintaining
excellent user experience and accessibility standards.

**Last Updated**: 2025-12-08 **Version**: 1.0.0
