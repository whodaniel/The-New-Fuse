# Component Reorganization Analysis & Plan

## Initial Analysis Results (March 11, 2024)

### Component Statistics
- Total UI Files: 842
- Function/Const Components: 29
- Class Components: 0
- Routes: 9

### Most Common Dependencies
1. react (44776 imports)
2. @phosphor-icons/react (135 imports)
3. @/models/system (86 imports)
4. react-router-dom (81 imports)
5. @/utils/toast (67 imports)
6. @/utils/paths (57 imports)
7. react-i18next (55 imports)
8. react-device-detect (41 imports)
9. @/lib/utils (39 imports)
10. @/components/Preloader (38 imports)

### Component Distribution
1. ./apps/frontend/src/components/ (92 components)
2. ./apps/frontend/src/components/ui/ (26 components)
3. ./apps/frontend/src/pages/ (15 components)
4. ./packages/features/dashboard/components/ (12 components)
5. ./apps/frontend/src/components/agents/ (12 components)
6. ./apps/frontend/src/components/auth/ (11 components)
7. ./apps/frontend/src/components/features/ (10 components)
8. ./apps/frontend/src/pages/workspace/ (8 components)
9. ./apps/frontend/src/pages/dashboard/ (8 components)

## Migration Strategy

### Phase 1: Setup & Documentation
- [x] Initial component analysis
- [x] Directory structure planning
- [x] Documentation creation
- [ ] Backup current structure

### Phase 2: Core Components Migration
1. Move UI primitives to packages/ui-components/src/core
2. Establish shared component patterns
3. Update Preloader component location (high usage)
4. Migrate common utilities (toast, paths)

### Phase 3: Feature Migration
1. Dashboard components (12 components)
2. Agent components (12 components)
3. Auth components (11 components)
4. Update import paths

### Phase 4: Page Organization
1. Workspace views
2. Dashboard views
3. Auth pages
4. Update routing structure

### Phase 5: Dependency Management
1. Update package.json files
2. Establish workspace dependencies
3. Update build configurations
4. Create new component documentation

## Rollback Plan
```bash
./scripts/rollback/restore-backup.sh
```

## Testing Strategy
1. Component rendering tests
2. Integration tests for feature modules
3. Route testing
4. Build verification