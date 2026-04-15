# Button Component Migration Guide

## Overview

We have consolidated multiple Button implementations across the codebase into a single, feature-rich Button component. This guide will help you migrate from the old Button implementations to the new consolidated Button component.

## New Consolidated Button Component

The new Button component is located at:
```
@the-new-fuse/ui-components/src/core/button
```

It combines the best features from all previous Button implementations:

- Various visual variants (default, destructive, outline, secondary, ghost, link)
- Multiple sizes (default, sm, lg, icon)
- Loading state support
- Icon support with positioning (start/end)
- Polymorphic component support via `asChild` prop
- Full TypeScript support
- Accessibility features

## Migration Steps

### 1. Update Imports

Replace your current Button imports with the new consolidated Button:

```tsx
// Before - various imports
import { Button } from '@the-new-fuse/ui/src/components/Button';
// or
import { Button } from 'packages/ui-components/src/core/button/Button';
// or
import { AppStack_Button } from 'apps/frontend/src/components/AppStack_Button';

// After - consolidated import
import { Button } from '@the-new-fuse/ui-components/src/core/button';
```

### 2. Update Props

The new Button component has a slightly different API. Here's how to migrate from each previous implementation:

#### From packages/ui/src/components/Button.tsx

```tsx
// Before
<Button
  variant="default"
  size="default"
  asChild={false}
  className="my-class"
  onClick={handleClick}
>
  Click me
</Button>

// After - No changes needed, all props are compatible
<Button
  variant="default"
  size="default"
  asChild={false}
  className="my-class"
  onClick={handleClick}
>
  Click me
</Button>
```

#### From packages/ui-components/src/core/button/Button.tsx

```tsx
// Before
<Button
  variant="default"
  size="default"
  loading={true}
  icon={<Icon />}
  iconPosition="left"
  className="my-class"
  onClick={handleClick}
>
  Click me
</Button>

// After - Minor change: 'loading' is now 'isLoading', 'iconPosition' values are now 'start'/'end'
<Button
  variant="default"
  size="default"
  isLoading={true}
  icon={<Icon />}
  iconPosition="start" // Changed from 'left' to 'start'
  className="my-class"
  onClick={handleClick}
>
  Click me
</Button>
```

#### From apps/frontend/src/components/AppStack_Button.tsx

```tsx
// Before
<AppStack_Button
  variant="default" // Only supported 'default' and 'destructive'
  onClick={handleClick}
  disabled={false}
  className="my-class"
>
  Click me
</AppStack_Button>

// After
<Button
  variant="default" // Now supports more variants
  onClick={handleClick}
  disabled={false}
  className="my-class"
>
  Click me
</Button>
```

### 3. New Features

The consolidated Button component offers several new features you can take advantage of:

#### Loading State

```tsx
<Button isLoading>Loading...</Button>
```

#### Icon Support

```tsx
<Button icon={<Icon />} iconPosition="start">
  With Icon
</Button>
```

#### Polymorphic Components

```tsx
<Button asChild>
  <a href="/some-link">Link Button</a>
</Button>
```

## Backward Compatibility

For backward compatibility, we've kept the old Button component files, but they now re-export the consolidated Button component. This means your existing code should continue to work, but we recommend migrating to the new import path for consistency.

## Testing

After migrating to the new Button component, make sure to test your application thoroughly to ensure everything works as expected.

## Need Help?

If you encounter any issues during migration, please reach out to the development team for assistance.
