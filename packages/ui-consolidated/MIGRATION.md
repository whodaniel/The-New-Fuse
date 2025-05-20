# Migration Guide

This guide will help you migrate from the various UI component implementations to the consolidated UI components.

## Button Component

### Before

```tsx
// From packages/ui/src/components/Button.tsx
import { Button } from '@the-new-fuse/ui/src/components/Button';

<Button variant="default" size="default">Click me</Button>

// From packages/ui-components/src/core/button/Button.tsx
import { Button } from '@the-new-fuse/ui-components/src/core/button';

<Button variant="destructive" isLoading={true}>Delete</Button>

// From apps/frontend/src/shared/ui/core/Button/Button.tsx
import { Button } from '@/shared/ui/core/Button';

<Button icon={<Icon />} iconPosition="start">With Icon</Button>
```

### After

```tsx
// Consolidated import
import { Button } from '@the-new-fuse/ui-consolidated';

// Same functionality, consistent API
<Button variant="default" size="default">Click me</Button>
<Button variant="destructive" isLoading={true}>Delete</Button>
<Button icon={<Icon />} iconPosition="start">With Icon</Button>
```

## Card Component

### Before

```tsx
// From packages/ui/src/components/Card.tsx
import { Card } from '@the-new-fuse/ui/src/components/Card';

<Card>Content</Card>

// From packages/ui-components/src/core/card/Card.tsx
import { Card } from '@the-new-fuse/ui-components/src/core/card';

<Card title="Card Title">Content</Card>

// From apps/frontend/src/shared/ui/core/Card/Card.tsx
import { Card } from '@/shared/ui/core/Card';

<Card variant="elevated" size="lg">Content</Card>
```

### After

```tsx
// Consolidated import
import { Card } from '@the-new-fuse/ui-consolidated';

// Same functionality, consistent API
<Card>Content</Card>
<Card title="Card Title">Content</Card>
<Card variant="elevated" size="lg">Content</Card>
```

## Input Component

### Before

```tsx
// From packages/ui/src/components/Input.tsx
import { Input } from '@the-new-fuse/ui/src/components/Input';

<Input placeholder="Enter text" />

// From packages/ui-components/src/core/input/Input.tsx
import { Input } from '@the-new-fuse/ui-components/src/core/input';

<Input label="Email" error="Invalid email" />

// From apps/frontend/src/shared/ui/core/Input/Input.tsx
import { Input } from '@/shared/ui/core/Input';

<Input startIcon={<Icon />} endIcon={<Icon />} />
```

### After

```tsx
// Consolidated import
import { Input } from '@the-new-fuse/ui-consolidated';

// Same functionality, consistent API
<Input placeholder="Enter text" />
<Input label="Email" error="Invalid email" />
<Input startIcon={<Icon />} endIcon={<Icon />} />
```

## Select Component

### Before

```tsx
// From packages/ui/src/components/Select.tsx
import { Select } from '@the-new-fuse/ui/src/components/Select';

<Select>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</Select>

// From packages/ui-components/src/core/select/Select.tsx
import { Select } from '@the-new-fuse/ui-components/src/core/select';

<Select label="Country" error="Required" />

// From apps/frontend/src/shared/ui/core/Select/Select.tsx
import { Select } from '@/shared/ui/core/Select';

<Select 
  options={[
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
  ]}
/>
```

### After

```tsx
// Consolidated import
import { Select } from '@the-new-fuse/ui-consolidated';

// Same functionality, consistent API
<Select>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</Select>

<Select label="Country" error="Required" />

<Select 
  options={[
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
  ]}
/>
```

## Utility Functions

### Before

```tsx
// From packages/ui/src/utils/cn.ts
import { cn } from '@the-new-fuse/ui/src/utils/cn';

// From packages/ui-components/src/utils/cn.ts
import { cn } from '@the-new-fuse/ui-components/src/utils/cn';

// From apps/frontend/src/lib/utils.ts
import { cn } from '@/lib/utils';
```

### After

```tsx
// Consolidated import
import { cn } from '@the-new-fuse/ui-consolidated';
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

3. If you're using TypeScript, make sure your types are correct. The consolidated components export their types, so you can import them directly.

4. If you're using custom styles, make sure they're applied correctly to the new components.

If you still have issues, please open an issue on the repository.
