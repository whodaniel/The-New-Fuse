# Layout Component Migration Guide

This guide will help you migrate from the various layout component implementations to the consolidated layout components.

## Container Component

### Before

```tsx
// From packages/core/components/layout/Container.tsx
import { Container } from '@the-new-fuse/core/components/layout/Container';

<Container>Content</Container>

// From packages/ui-components/src/layout/Container.tsx
import { Container } from '@the-new-fuse/ui-components/src/layout/Container';

<Container size="sm">Small container</Container>

// From apps/frontend/src/components/layout/Container.tsx
import { Container } from '@/components/layout/Container';

<Container padding="lg">Container with large padding</Container>
```

### After

```tsx
// Consolidated import
import { Container } from '@the-new-fuse/ui-consolidated';

// Same functionality, consistent API
<Container>Content</Container>
<Container size="sm">Small container</Container>
<Container padding="lg">Container with large padding</Container>
```

## Split Component

### Before

```tsx
// From packages/core/components/layout/Split.tsx
import { Split } from '@the-new-fuse/core/components/layout/Split';

<Split>
  <div>Left panel</div>
  <div>Right panel</div>
</Split>

// From packages/ui-components/src/layout/Split.tsx
import { Split } from '@the-new-fuse/ui-components/src/layout/Split';

<Split direction="vertical">
  <div>Top panel</div>
  <div>Bottom panel</div>
</Split>

// From apps/frontend/src/components/layout/Split.tsx
import { Split } from '@/components/layout/Split';

<Split initialSizes={[30, 70]}>
  <div>Smaller panel</div>
  <div>Larger panel</div>
</Split>
```

### After

```tsx
// Consolidated import
import { Split } from '@the-new-fuse/ui-consolidated';

// Same functionality, consistent API
<Split>
  <div>Left panel</div>
  <div>Right panel</div>
</Split>

<Split direction="vertical">
  <div>Top panel</div>
  <div>Bottom panel</div>
</Split>

<Split initialSizes={[30, 70]}>
  <div>Smaller panel</div>
  <div>Larger panel</div>
</Split>
```

## Layout Component

### Before

```tsx
// From packages/layout/Layout.tsx
import { Layout } from '@the-new-fuse/layout';

<Layout>Content</Layout>

// From packages/ui-components/src/layout/BaseLayout/index.tsx
import { BaseLayout } from '@the-new-fuse/ui-components/src/layout/BaseLayout';

<BaseLayout header={<Header />} sidebar={<Sidebar />}>
  Content
</BaseLayout>

// From packages/ui-components/src/consolidated/Layout.tsx
import { Layout } from '@the-new-fuse/ui-components/src/consolidated/Layout';

<Layout 
  navigation={navigationItems}
  currentPath="/dashboard"
  user={currentUser}
>
  Content
</Layout>
```

### After

```tsx
// Consolidated import
import { Layout } from '@the-new-fuse/ui-consolidated';

// Same functionality, consistent API
<Layout>Content</Layout>

<Layout header={<Header />} sidebar={<Sidebar />}>
  Content
</Layout>

<Layout 
  navigation={navigationItems}
  currentPath="/dashboard"
  user={currentUser}
>
  Content
</Layout>
```

## Sidebar Component

### Before

```tsx
// From packages/layout/Sidebar.tsx
import { Sidebar } from '@the-new-fuse/layout';

<Sidebar items={navigationItems} />

// From packages/ui-components/src/layout/Sidebar.tsx
import { Sidebar } from '@the-new-fuse/ui-components/src/layout/Sidebar';

<Sidebar collapsible collapsed={isCollapsed} onCollapse={setIsCollapsed} />

// From apps/frontend/src/components/layout/Sidebar.tsx
import { Sidebar } from '@/components/layout/Sidebar';

<Sidebar 
  mobile 
  open={isSidebarOpen} 
  onClose={() => setIsSidebarOpen(false)} 
/>
```

### After

```tsx
// Consolidated import
import { Sidebar } from '@the-new-fuse/ui-consolidated';

// Same functionality, consistent API
<Sidebar items={navigationItems} />

<Sidebar collapsible collapsed={isCollapsed} onCollapse={setIsCollapsed} />

<Sidebar 
  mobile 
  open={isSidebarOpen} 
  onClose={() => setIsSidebarOpen(false)} 
/>
```

## Migration Steps

1. Update your package.json to include the new dependency:

```json
{
  "dependencies": {
    "@the-new-fuse/ui-consolidated": "1.0.0"
  }
}
```

2. Run yarn to install the new package:

```bash
yarn
```

3. Find and replace all imports of the old components with the new consolidated components.

4. Test your application to ensure everything works as expected.

5. Remove the old component imports once you've verified that the new components work correctly.

## Troubleshooting

If you encounter any issues during migration, please check the following:

1. Make sure you're using the correct prop names. The consolidated components may have slightly different prop names than the old components.

2. Check the component documentation for any changes in behavior or API.

3. If you're using custom styles, make sure they're applied correctly to the new components.

4. If you're using TypeScript, make sure your types are correct. The consolidated components export their types, so you can import them directly.

If you still have issues, please open an issue on the repository.
