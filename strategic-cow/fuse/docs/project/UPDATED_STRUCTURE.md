# Updated Project Structure

## Core UI Components
Location: `packages/shared/components/`

### Loading Components
- `Preloader`: Flexible loading spinner with size and theme variants
  - Supports predefined sizes (sm, md, lg)
  - Supports custom sizes
  - Supports themed variants
  - Available as standalone or full-screen overlay

## Import Guidelines
```tsx
// Preferred import method
import { Preloader, FullScreenLoader } from '@/packages/shared/components';

// Usage
<Preloader size="lg" variant="themed" />
<FullScreenLoader variant="primary" />
```

## Migration Guide
1. Replace all existing loader implementations with the shared Preloader component
2. Update imports to use the shared component package
3. Remove deprecated loader files from individual projects
