# Migration Guide: Consolidated Components

This guide explains how to migrate your code to use the new consolidated components introduced as part of the codebase cleanup and standardization effort.

## AgentCard Consolidation

**Date:** April 14, 2025

### Background

Previously, there were multiple implementations of the `AgentCard` component across different packages (`apps/frontend`, `packages/features/agents`, `packages/core`). This led to inconsistencies in appearance, behavior, and features.

To address this, these components have been consolidated into a single, feature-rich component located at:

```
packages/ui-components/src/core/agent/AgentCard.tsx
```

This new component incorporates features from all previous versions and uses the consolidated `Card` component (`ConsolidatedCard.tsx`) for consistent styling.

### Migration Steps

1.  **Update Imports:** The primary step is to update all import statements for `AgentCard` to point to the new canonical path:

    ```typescript
    // Before:
    import { AgentCard } from '../components/AgentCard'; // or other relative/package paths

    // After:
    import { AgentCard } from '@the-new-fuse/ui-components/core/agent/AgentCard';
    ```

    *Note: As part of the consolidation process, the old `AgentCard.tsx` files were updated to re-export the new component. While existing imports might still work temporarily due to this re-export, it is strongly recommended to update the import path directly to the new location for clarity and future maintainability.*

2.  **Verify Props (If Necessary):** The consolidated `AgentCard` aims to be backward compatible. However, review the props being passed to ensure they align with the new component's `AgentCardProps` interface. Check the component definition or its unit tests (`AgentCard.test.tsx`) for details.

### Deprecated Components

The following old `AgentCard` component files are now considered deprecated and simply re-export the new component:

*   `apps/frontend/src/components/AgentCard.tsx`
*   `packages/features/agents/components/AgentCard.tsx`
*   `packages/core/components/agents/AgentCard.tsx`

These files may be removed in future cleanup efforts.

## Other Consolidations (To be added)

This guide will be updated as other components (e.g., `Card`, protocol handlers) are consolidated.
