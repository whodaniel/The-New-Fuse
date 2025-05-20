# UI Reorganization Plan

## Phase 1: Component Consolidation

### 1.1 Move Atomic Components
Move all atomic components to `/packages/ui-components/`:
- Button variants
- Input variants
- Select components
- Icons
- Typography

### 1.2 Consolidate Feature Components
Organize feature-specific components:
```bash
/apps/frontend/src/features/
├── agents/
│   ├── components/
│   ├── hooks/
│   └── pages/
├── chat/
│   ├── components/
│   ├── hooks/
│   └── pages/
├── workflow/
│   ├── components/
│   ├── hooks/
│   └── pages/
```

### 1.3 Page Organization
Restructure pages directory:
```bash
/apps/frontend/src/pages/
├── dashboard/
│   ├── main.tsx
│   ├── agents.tsx
│   └── analytics.tsx
├── auth/
│   ├── login.tsx
│   └── register.tsx
├── settings/
│   ├── profile.tsx
│   └── workspace.tsx
└── error/
    ├── 404.tsx
    └── 500.tsx
```

## Phase 2: Implementation Steps

1. Create new directory structure
2. Move components to their new locations
3. Update import statements
4. Remove duplicate components
5. Update documentation
6. Update build configuration
7. Test all routes and components
8. Deploy changes incrementally

## Phase 3: Cleanup

1. Remove deprecated components
2. Update test files
3. Update storybook stories
4. Remove unused imports
5. Update component registry