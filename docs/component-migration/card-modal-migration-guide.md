# Card and Modal/Dialog Component Migration Guide

## Overview

We have consolidated multiple Card and Modal/Dialog implementations across the codebase into single, feature-rich components. This guide will help you migrate from the old implementations to the new consolidated components.

## Card Component

### New Consolidated Card Component

The new Card component is located at:
```
@the-new-fuse/ui-components/src/core/card
```

It combines the best features from all previous Card implementations:

- Various visual variants (default, ghost, outline, elevated, gradient)
- Multiple sizes (default, sm, lg)
- Hover effects
- Clickable state
- Full set of subcomponents (Header, Title, Description, Content, Footer)
- Full TypeScript support
- Accessibility features

### Migration Steps

#### 1. Update Imports

Replace your current Card imports with the new consolidated Card:

```tsx
// Before - various imports
import { Card } from '@the-new-fuse/ui/src/components/Card';
// or
import { Card } from 'packages/ui-components/src/core/card';
// or
import { AppStack_Card } from 'apps/frontend/src/components/AppStack_Card';

// After - consolidated import
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@the-new-fuse/ui-components/src/core/card';
```

#### 2. Update Props

The new Card component has a slightly different API. Here's how to migrate from each previous implementation:

##### From packages/ui/src/components/Card.tsx

```tsx
// Before
<Card
  variant="default"
  className="my-class"
>
  Card content
</Card>

// After - No changes needed, all props are compatible
<Card
  variant="default"
  className="my-class"
>
  Card content
</Card>
```

##### From apps/frontend/src/components/AppStack_Card.tsx

```tsx
// Before
<AppStack_Card
  variant="default" // Only supported 'default', 'gradient', and 'hover'
  className="my-class"
>
  Card content
</AppStack_Card>

// After
<Card
  variant="default" // Now supports more variants
  hover={variant === 'hover'} // If using the 'hover' variant
  className="my-class"
>
  Card content
</Card>
```

#### 3. New Features

The consolidated Card component offers several new features you can take advantage of:

##### Subcomponents for Better Structure

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card Description</CardDescription>
  </CardHeader>
  <CardContent>
    Main content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

##### Hover and Clickable States

```tsx
<Card hover={true} clickable={true}>
  Hoverable and clickable card
</Card>
```

## Modal/Dialog Component

### New Consolidated Modal/Dialog Component

The new Dialog component is located at:
```
@the-new-fuse/ui-components/src/core/dialog
```

It combines the best features from all previous Modal/Dialog implementations:

- Various sizes (sm, default, lg, xl, fullscreen)
- Multiple positions (default/center, top, bottom, left, right, custom)
- Close button customization
- Backdrop click handling
- Escape key handling
- Full set of subcomponents (Header, Title, Description, Footer)
- Full TypeScript support
- Accessibility features through Radix UI primitives

### Migration Steps

#### 1. Update Imports

Replace your current Modal/Dialog imports with the new consolidated components:

```tsx
// Before - various imports
import { Modal } from '@the-new-fuse/ui/src/components/Modal';
// or
import { ModalWrapper } from 'apps/frontend/src/components/ModalWrapper/ModalWrapper';

// After - consolidated import
import { Modal, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@the-new-fuse/ui-components/src/core/dialog';
```

#### 2. Update Props

The new Modal/Dialog components have a slightly different API. Here's how to migrate from each previous implementation:

##### From packages/ui/src/components/Modal.tsx

```tsx
// Before
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  size="md"
  position="center"
  closeOnBackdropClick={true}
  closeOnEscape={true}
>
  Modal content
</Modal>

// After - No changes needed, all props are compatible
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  size="default" // 'md' is now 'default'
  position="default" // 'center' is now 'default'
  closeOnBackdropClick={true}
  closeOnEscape={true}
>
  Modal content
</Modal>
```

##### From apps/frontend/src/components/ModalWrapper/ModalWrapper.tsx

```tsx
// Before
<ModalWrapper
  isOpen={isOpen}
  noPortal={false}
>
  Modal content
</ModalWrapper>

// After
<Modal
  isOpen={isOpen}
  onClose={() => {}} // ModalWrapper didn't have an onClose prop
  size="fullscreen"
  position="default"
  className="bg-transparent p-0 border-0 shadow-none"
>
  <div className="flex items-center justify-center w-full h-full">
    Modal content
  </div>
</Modal>
```

#### 3. Using the Dialog Component Directly

For more control, you can use the Dialog component directly:

```tsx
<Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog Description</DialogDescription>
    </DialogHeader>
    <div>Dialog Content</div>
    <DialogFooter>
      <Button variant="outline" onClick={handleClose}>Cancel</Button>
      <Button onClick={handleSave}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Backward Compatibility

For backward compatibility, we've kept the old component files, but they now re-export the consolidated components. This means your existing code should continue to work, but we recommend migrating to the new import paths for consistency.

## Testing

After migrating to the new components, make sure to test your application thoroughly to ensure everything works as expected.

## Need Help?

If you encounter any issues during migration, please reach out to the development team for assistance.
