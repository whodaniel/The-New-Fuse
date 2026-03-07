# @the-new-fuse/airtable-adapters

Migration adapters for transitioning from legacy components to airtable-based implementations while maintaining backward compatibility.

## Overview

This package provides seamless migration adapters that allow existing codebases to benefit from the new airtable architecture without requiring immediate code changes. The adapters serve as a bridge between legacy component APIs and the new airtable-based components.

## Features

- 🔄 **Zero Breaking Changes**: Drop-in replacements for legacy components
- ⚠️ **Migration Guidance**: Development-time warnings with clear migration paths
- 🔍 **Data Validation**: Ensures data integrity during transitions
- 📊 **Migration Reporting**: Comprehensive tracking of migration status
- 🎯 **Type Safety**: Full TypeScript support with legacy API preservation

## Quick Start

### 1. Installation

```bash
pnpm add @the-new-fuse/airtable-adapters
```

### 2. Drop-in Replacement

Replace your existing KanbanBoard import:

```tsx
// Before
import KanbanBoard from '@the-new-fuse/feature-suggestions/components/KanbanBoard';

// After - zero code changes required!
import { KanbanBoardAdapter as KanbanBoard } from '@the-new-fuse/airtable-adapters';

// Your existing code works unchanged
function MyComponent() {
  return (
    <KanbanBoard 
      columns={legacyColumns}
      onDragEnd={handleDragEnd}
      onItemClick={handleItemClick}
    />
  );
}
```

### 3. Monitor Migration Warnings

In development, you'll see helpful migration guidance:

```
🔄 [MIGRATION] KanbanBoardAdapter is being used.
Consider migrating to @the-new-fuse/airtable-components/KanbanView for better performance and features.
📖 Migration guide: docs/migration/kanban-board.md
```

## Components

### KanbanBoardAdapter

A drop-in replacement for the legacy KanbanBoard component that:

- ✅ Maintains exact same props interface
- ✅ Converts legacy data to airtable format automatically
- ✅ Translates event handlers between legacy and airtable patterns
- ✅ Provides performance benefits through airtable optimizations
- ✅ Shows migration guidance in development

**Props (Legacy Compatible):**
```typescript
interface LegacyKanbanBoardProps {
  columns: LegacyKanbanColumn[];
  onDragStart?: (item: LegacyDraggableItem, sourceColumnId: string) => void;
  onDragEnd?: (item: LegacyDraggableItem, sourceColumnId: string, targetColumnId: string) => void;
  onItemClick?: (item: LegacyDraggableItem) => void;
}
```

## Migration Utilities

### Data Conversion

```tsx
import { convertLegacyKanbanToAirtable } from '@the-new-fuse/airtable-adapters';

const legacyData = { columns: [...] };
const { table, view, warnings } = convertLegacyKanbanToAirtable(legacyData);

// Handle any migration warnings
warnings.forEach(warning => {
  console.log(`${warning.severity}: ${warning.message}`);
});
```

### Migration Reporting

```tsx
import { generateMigrationReport } from '@the-new-fuse/airtable-adapters';

const report = generateMigrationReport();
console.log(`Migration Status: ${report.totalWarnings} warnings found`);
```

### Data Validation

```tsx
import { validateDataCompatibility } from '@the-new-fuse/airtable-adapters';

const warnings = validateDataCompatibility(legacyData);
if (warnings.length > 0) {
  console.log('Data compatibility issues found:', warnings);
}
```

## Migration Strategies

### Strategy 1: Immediate Adapter (Recommended)
Use adapters as drop-in replacements for immediate benefits with zero code changes.

### Strategy 2: Gradual Migration  
Gradually convert data and migrate to native airtable components over time.

### Strategy 3: Full Native Migration
Complete migration to native airtable components for full feature access.

## Example Usage

```tsx
import React from 'react';
import { KanbanBoardAdapter } from '@the-new-fuse/airtable-adapters';

const MyKanbanComponent = () => {
  const legacyColumns = [
    {
      id: 'todo',
      title: 'To Do',
      items: [
        {
          id: 'task-1',
          title: 'Implement feature',
          description: 'Add new functionality',
          priority: 'HIGH'
        }
      ]
    }
  ];

  const handleDragEnd = (item, sourceColumnId, targetColumnId) => {
    console.log(`Moved ${item.title} from ${sourceColumnId} to ${targetColumnId}`);
  };

  return (
    <KanbanBoardAdapter
      columns={legacyColumns}
      onDragEnd={handleDragEnd}
    />
  );
};

export default MyKanbanComponent;
```

## Benefits

### Immediate Benefits
- ✅ Performance improvements from airtable optimizations
- ✅ Better type safety with maintained API compatibility
- ✅ Future-proof architecture without code changes
- ✅ Development guidance for planned migration

### Future Benefits (After Full Migration)
- 🎯 Multiple view types (Grid, Calendar, Timeline, Gallery)
- 🔍 Advanced filtering and sorting capabilities
- 📊 Rich column types and data validation
- 🔗 Linked records and relationships
- 🎨 Customizable views and layouts

## Documentation

- [KanbanBoard Migration Guide](../../docs/migration/kanban-board.md)
- [Migration Best Practices](../../docs/migration/best-practices.md)
- [API Compatibility Reference](../../docs/migration/api-reference.md)

## Support

For migration assistance:
- 📖 Check the migration guides in `/docs/migration/`
- 🐛 Report issues with the `migration` label
- 💬 Ask questions in discussions

## Version Compatibility

- **Legacy Support**: Maintains compatibility with existing KanbanBoard APIs
- **Airtable Integration**: Built on airtable-core v1.0.0+
- **Migration Path**: Provides clear upgrade path to native components

---

**Migration made simple.** Start with adapters, migrate at your own pace, and unlock powerful airtable features when you're ready.
