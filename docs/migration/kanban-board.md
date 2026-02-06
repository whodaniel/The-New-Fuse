# KanbanBoard Migration Guide

## Overview

This guide helps you migrate from the legacy `KanbanBoard` component to the new
airtable-based `KanbanView` component. The migration can be done gradually using
the `KanbanBoardAdapter` for backward compatibility.

## Migration Strategies

### Strategy 1: Immediate Adapter Usage (Recommended for existing codebases)

Replace your existing KanbanBoard imports with the adapter:

```tsx
// Before
import KanbanBoard from '@the-new-fuse/feature-suggestions/components/KanbanBoard';

// After
import { KanbanBoardAdapter as KanbanBoard } from '@the-new-fuse/airtable-adapters';
```

**Benefits:**

- ✅ Zero code changes required
- ✅ Immediate access to improved performance
- ✅ Deprecation warnings guide future migration
- ✅ Same API surface

### Strategy 2: Gradual Migration to Native KanbanView

Gradually migrate to the native airtable KanbanView for full benefits:

```tsx
// Step 1: Add the adapter alongside existing usage
import { KanbanBoardAdapter, convertLegacyKanbanToAirtable } from '@the-new-fuse/airtable-adapters';
import { KanbanView } from '@the-new-fuse/airtable-components';

// Step 2: Convert your data
const legacyData = { columns: [...] };
const { table, view, warnings } = convertLegacyKanbanToAirtable(legacyData);

// Step 3: Use native KanbanView
<KanbanView
  table={table}
  view={view}
  // ... other props
/>
```

## Data Structure Migration

### Legacy Format

```typescript
interface LegacyKanbanColumn {
  id: string;
  title: string;
  items: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
}
```

### Airtable Format

```typescript
interface Table {
  id: string;
  name: string;
  columns: Column[]; // Typed column definitions
  rows: Row[]; // Normalized data rows
  views: View[]; // Multiple view configurations
}
```

## Event Handler Migration

### Legacy Handlers

```tsx
const handleDragEnd = (item, sourceColumnId, targetColumnId) => {
  // Update item status
};

<KanbanBoard columns={columns} onDragEnd={handleDragEnd} />;
```

### Airtable Handlers

```tsx
const handleUpdateCell = (rowId, columnId, value) => {
  // Update cell value - more granular control
};

<KanbanView table={table} view={view} onUpdateCell={handleUpdateCell} />;
```

## Feature Comparison

| Feature             | Legacy KanbanBoard | Airtable KanbanView |
| ------------------- | ------------------ | ------------------- |
| Basic drag & drop   | ✅                 | ✅                  |
| Multiple views      | ❌                 | ✅                  |
| Filtering & sorting | Limited            | ✅ Full support     |
| Custom column types | ❌                 | ✅                  |
| Data validation     | ❌                 | ✅                  |
| Performance         | Good               | Better              |
| Type safety         | Partial            | Full                |

## Migration Checklist

### Phase 1: Compatibility Layer

- [ ] Install `@the-new-fuse/airtable-adapters`
- [ ] Replace KanbanBoard imports with KanbanBoardAdapter
- [ ] Test existing functionality
- [ ] Monitor migration warnings in development

### Phase 2: Data Structure Migration

- [ ] Convert legacy data using `convertLegacyKanbanToAirtable`
- [ ] Review and address migration warnings
- [ ] Update any data persistence logic
- [ ] Test data integrity

### Phase 3: Native Migration

- [ ] Replace KanbanBoardAdapter with native KanbanView
- [ ] Update event handlers to use airtable patterns
- [ ] Implement enhanced features (filtering, sorting, etc.)
- [ ] Remove legacy dependencies

## Common Issues & Solutions

### Issue: Extra Properties Not Appearing

**Problem:** Custom properties from legacy items aren't showing up.

**Solution:** The adapter preserves extra properties but may need column
mapping:

```tsx
// Check migration warnings for suggested column mappings
const { warnings } = convertLegacyKanbanToAirtable(legacyData);
warnings.forEach((warning) => console.log(warning.message));
```

### Issue: Event Handler Signature Changes

**Problem:** Native airtable event handlers have different signatures.

**Solution:** Use the adapter's event translation or update handlers:

```tsx
// Adapter automatically translates events
<KanbanBoardAdapter onDragEnd={legacyHandler} />

// Or update to native pattern
<KanbanView onUpdateCell={(rowId, columnId, value) => {
  // Handle the more granular update
}} />
```

### Issue: Performance with Large Datasets

**Problem:** Large datasets may show different performance characteristics.

**Solution:** Utilize airtable's built-in optimizations:

```tsx
// Use view filtering to reduce rendered items
const view = {
  ...baseView,
  filters: [{ columnId: 'status', operator: 'EQ', value: 'active' }],
};
```

## Best Practices

1. **Start with the Adapter**: Use KanbanBoardAdapter first to ensure
   compatibility
2. **Monitor Warnings**: Pay attention to migration warnings in development
3. **Gradual Migration**: Migrate one component at a time
4. **Test Thoroughly**: Ensure all functionality works after each migration step
5. **Leverage New Features**: Take advantage of airtable's enhanced capabilities

## Support

- **Migration Issues**: Create an issue with the `migration` label
- **Performance Problems**: Check the performance optimization guide
- **Type Errors**: Ensure all airtable packages are on compatible versions

## Timeline Recommendations

- **Week 1-2**: Install adapters and test compatibility
- **Week 3-4**: Begin data structure migration
- **Week 5-6**: Migrate to native components
- **Week 7**: Remove legacy dependencies and cleanup

This migration path ensures minimal disruption while providing access to
enhanced airtable functionality.
