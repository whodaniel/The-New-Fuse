# Premium Layout System

A comprehensive, glassmorphic navigation and layout system for The New Fuse
platform. This system provides consistency across the entire platform with
premium visual effects, smooth animations, and a modern design.

## Components

### 1. PremiumLayout

The main layout wrapper that provides the complete page structure with
glassmorphic navigation, gradient backgrounds, and floating orbs.

#### Features

- Glassmorphic header with backdrop blur
- User profile dropdown (avatar, name, logout)
- Optional glassmorphic sidebar
- Gradient background with animated floating orbs
- Breadcrumbs support
- Responsive mobile menu
- Premium search input
- Notification bell with badge
- Theme switcher

#### Usage

```tsx
import { PremiumLayout } from '@/components/layout';

export const MyPage = () => {
  return (
    <PremiumLayout
      title="Dashboard"
      subtitle="Welcome to your dashboard"
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Dashboard', path: '/dashboard' },
      ]}
      showSidebar={true}
      showHeader={true}
    >
      {/* Your page content here */}
    </PremiumLayout>
  );
};
```

#### Props

| Prop             | Type                                   | Default               | Description                      |
| ---------------- | -------------------------------------- | --------------------- | -------------------------------- |
| `children`       | `ReactNode`                            | -                     | Page content                     |
| `title`          | `string`                               | -                     | Page title (optional)            |
| `subtitle`       | `string`                               | -                     | Page subtitle (optional)         |
| `breadcrumbs`    | `Array<{label: string, path: string}>` | -                     | Breadcrumb navigation (optional) |
| `showSidebar`    | `boolean`                              | `true`                | Show/hide sidebar                |
| `showHeader`     | `boolean`                              | `true`                | Show/hide header                 |
| `containerClass` | `string`                               | `'max-w-7xl mx-auto'` | Content container class          |

### 2. Header

A premium glassmorphic header component with search, notifications, and user
menu.

#### Features

- Backdrop blur with glass effect
- Premium search bar with icon
- Theme toggle (light/dark)
- Notification bell with badge indicator
- User dropdown menu with avatar
- Gradient logo text
- Login/Register buttons for unauthenticated users

#### Usage

```tsx
import { Header } from '@/components/layout';

// The Header is already included in PremiumLayout
// But can be used standalone:
<Header />;
```

### 3. Sidebar

A glassmorphic sidebar with gradient icon backgrounds and smooth hover effects.

#### Features

- Glassmorphism effects with backdrop blur
- Gradient icon backgrounds (customizable per item)
- Active state with gradient highlights
- Smooth hover animations
- Responsive collapse/expand with LayoutContext
- Icon-only mode when collapsed

#### Navigation Items

Each navigation item has:

- Custom gradient color scheme
- Icon with gradient background
- Active state highlighting
- Smooth transitions
- Authentication-aware visibility

#### Usage

```tsx
import { Sidebar } from '@/components/layout';

// The Sidebar is already included in PremiumLayout
// But can be used standalone:
<Sidebar />;
```

## Design System

### Glassmorphism Effect

The layout uses a consistent glassmorphism pattern:

```css
backdrop-blur-xl
bg-white/5
border border-white/10
shadow-2xl
```

### Gradient Colors

Available gradient presets:

- `blue`: from-blue-500 to-blue-600
- `purple`: from-purple-500 to-purple-600
- `green`: from-green-500 to-teal-600
- `orange`: from-orange-500 to-red-600
- `pink`: from-pink-500 to-purple-600
- `cyan`: from-cyan-500 to-blue-600

### Floating Orbs

Animated background orbs create depth and visual interest:

```tsx
{
  /* Decorative Floating Orbs */
}
<div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
  <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
  <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse animation-delay-1000" />
  <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-pink-600/10 rounded-full blur-[100px] animate-pulse animation-delay-2000" />
</div>;
```

## Integration with Premium UI Components

The layout system works seamlessly with premium UI components:

```tsx
import { GlassCard, StatsCard, ActionCard } from '@/components/ui/premium';
import { PremiumLayout } from '@/components/layout';

export const Dashboard = () => {
  return (
    <PremiumLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          label="Total Users"
          value="1,234"
          change="+12%"
          changeType="positive"
          icon={Users}
          gradient="blue"
        />
        {/* More cards */}
      </div>
    </PremiumLayout>
  );
};
```

## Responsive Design

The layout is fully responsive:

- **Mobile**: Hamburger menu, collapsible sidebar, simplified header
- **Tablet**: Adaptive spacing, responsive grid layouts
- **Desktop**: Full sidebar, search bar, complete navigation

### Breakpoints

- `sm`: 640px - Small tablets
- `md`: 768px - Tablets and small laptops
- `lg`: 1024px - Laptops and desktops
- `xl`: 1280px - Large desktops

## Context Integration

The layout integrates with several contexts:

### LayoutContext

Controls sidebar state:

```tsx
import { useLayout } from '@/contexts/LayoutContext';

const { layout, toggleSidebar } = useLayout();
```

### AuthProvider

Handles user authentication:

```tsx
import { useAuth } from '@/providers/AuthProvider';

const { user, logout, isAuthenticated } = useAuth();
```

### ThemeProvider

Manages theme switching:

```tsx
import { useTheme } from '@/providers/ThemeProvider';

const { theme, setTheme } = useTheme();
```

## Examples

### Basic Page

```tsx
import { PremiumLayout } from '@/components/layout';

export const SimplePage = () => {
  return (
    <PremiumLayout title="My Page">
      <div className="p-6">
        <h1 className="text-white">Hello World</h1>
      </div>
    </PremiumLayout>
  );
};
```

### Page with Breadcrumbs

```tsx
import { PremiumLayout } from '@/components/layout';

export const DetailPage = () => {
  return (
    <PremiumLayout
      title="Agent Details"
      subtitle="View and manage your AI agent"
      breadcrumbs={[
        { label: 'Home', path: '/' },
        { label: 'Agents', path: '/agents' },
        { label: 'Agent Alpha', path: '/agents/alpha' },
      ]}
    >
      {/* Content */}
    </PremiumLayout>
  );
};
```

### Page without Sidebar

```tsx
import { PremiumLayout } from '@/components/layout';

export const LandingPage = () => {
  return (
    <PremiumLayout
      showSidebar={false}
      showHeader={true}
      containerClass="max-w-6xl mx-auto"
    >
      {/* Landing page content */}
    </PremiumLayout>
  );
};
```

## Customization

### Custom Sidebar Items

Edit `/components/layout/Sidebar.tsx` to add custom navigation items:

```tsx
const navItems: NavItem[] = [
  {
    name: 'My Custom Page',
    path: '/custom',
    icon: <CustomIcon className="h-5 w-5" />,
    requiresAuth: true,
    gradient: 'cyan',
  },
  // ... more items
];
```

### Custom Container Width

```tsx
<PremiumLayout containerClass="max-w-4xl mx-auto px-4">
  {/* Narrower content */}
</PremiumLayout>
```

## Best Practices

1. **Use PremiumLayout for all authenticated pages** to maintain consistency
2. **Provide meaningful breadcrumbs** for better navigation
3. **Use appropriate gradients** that match your content's purpose
4. **Test responsiveness** at all breakpoints
5. **Keep sidebar items organized** by feature area
6. **Provide clear titles and subtitles** for better UX

## Performance

The layout system is optimized for performance:

- Conditional rendering of sidebar and header
- Efficient state management with contexts
- CSS-based animations (GPU accelerated)
- Lazy-loaded dropdown menus
- Minimal re-renders

## Accessibility

- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management for dropdowns
- Semantic HTML structure
- High contrast text on glass backgrounds

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

Requires support for:

- CSS `backdrop-filter`
- CSS Grid
- CSS Custom Properties
- ES6+ JavaScript
