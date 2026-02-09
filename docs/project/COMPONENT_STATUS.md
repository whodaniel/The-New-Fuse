# Component Reorganization Status (2025-01-08)

## TSX Files Assessment

### Core UI Components (To Be Merged)
1. Button Component
   - Old:
     - `/apps/frontend/src/components/core/Button/Button.tsx`
     - `/apps/frontend/src/components/ui/button.tsx`
   - New: ✅ `/apps/frontend/src/shared/ui/core/Button/`

2. Card Component
   - Old:
     - `/apps/frontend/src/components/core/Card/Card.tsx`
     - `/apps/frontend/src/components/ui/card.tsx`
   - New: ✅ `/apps/frontend/src/shared/ui/core/Card/`

3. Input Component
   - Status: ✅ Merged
   - Location: `/apps/frontend/src/shared/ui/core/Input/`
   - Features:
     - Variants: default, ghost, outline, transparent
     - Icon support (left/right)
     - Error/Success states
     - Width variants
     - Full TypeScript support
     - Tailwind styling
   - Notes: Successfully merged both input implementations into a single, enhanced component

4. Select Component
   - Status: ✅ Merged
   - Location: `/apps/frontend/src/shared/ui/core/Select/`
   - Features:
     - Radix UI primitives integration
     - Dark mode support
     - Custom trigger styling
     - Dropdown animations
     - Full keyboard navigation
     - TypeScript support
     - Accessible by default
   - Notes: Successfully merged both select implementations into a single component with enhanced features

5. Switch Component
   - Current:
     - `/apps/frontend/src/components/core/Switch/index.tsx`
     - `/apps/frontend/src/components/ui/switch.tsx`
   - Status: 🔄 Needs to be merged into `/apps/frontend/src/shared/ui/core/Switch/`

6. DropdownMenu Component
   - Current:
     - `/apps/frontend/src/components/core/DropdownMenu/index.tsx`
     - `/apps/frontend/src/components/ui/dropdown-menu.tsx`
   - Status: 🔄 Needs to be merged into `/apps/frontend/src/shared/ui/core/DropdownMenu/`

### Feature Components (To Be Organized)
1. Memory Components
   - `/apps/frontend/src/components/memory/visualization/ClusterDetails.tsx`
   - `/apps/frontend/src/components/memory/visualization/MemoryVisualizer.tsx`
   - `/apps/frontend/src/components/memory/MemoryDashboard.tsx`
   - Status: 🔄 Move to `/apps/frontend/src/features/memory/`

2. Settings Components
   - `/apps/frontend/src/components/settings/Settings.tsx`
   - `/apps/frontend/src/components/settings/VisualCustomization.tsx`
   - `/apps/frontend/src/components/settings/LLMConfigManager.tsx`
   - Status: 🔄 Move to `/apps/frontend/src/features/settings/`

3. File Upload Components
   - `/apps/frontend/src/components/FileUpload/FileUpload.tsx`
   - Status: 🔄 Move to `/apps/frontend/src/features/file-upload/`

4. Performance Components
   - `/apps/frontend/src/components/PerformanceDashboard.tsx`
   - `/apps/frontend/src/components/performance-metrics.tsx`
   - `/apps/frontend/src/components/system-metrics.tsx`
   - Status: 🔄 Move to `/apps/frontend/src/features/performance/`

5. Agent Components
   - `/apps/frontend/src/components/agent-selector.tsx`
   - `/apps/frontend/src/components/agent-collaboration-dashboard.tsx`
   - Status: 🔄 Move to `/apps/frontend/src/features/agents/`

6. Voice Control Components
   - `/apps/frontend/src/components/voice-control.tsx`
   - `/apps/frontend/src/components/voice-controlled-commander.tsx`
   - Status: 🔄 Move to `/apps/frontend/src/features/voice/`

7. Multi-Modal Components
   - `/apps/frontend/src/components/multi-modal-interaction.tsx`
   - Status: 🔄 Move to `/apps/frontend/src/features/multi-modal/`

8. GPU Management
   - `/apps/frontend/src/components/gpu-manager.tsx`
   - Status: 🔄 Move to `/apps/frontend/src/features/gpu/`

### Shared Components (To Be Organized)
1. Data Visualization
   - `/apps/frontend/src/components/ui/graph-chart.tsx`
   - `/apps/frontend/src/components/ui/graph-visualization.tsx`
   - `/apps/frontend/src/components/ui/data-table.tsx`
   - Status: 🔄 Move to `/apps/frontend/src/shared/ui/data/`

2. Editor Components
   - `/apps/frontend/src/components/core/MonacoEditor.tsx`
   - Status: 🔄 Move to `/apps/frontend/src/shared/ui/editor/`

3. Dialog Components
   - `/apps/frontend/src/components/core/Dialog/index.tsx`
   - Status: 🔄 Move to `/apps/frontend/src/shared/ui/feedback/`

### Root Components
1. App Components
   - `/apps/frontend/src/App.tsx`
   - `/apps/frontend/src/main.tsx`
   - Status: ✅ Keep in current location

Note: Many files listed in ALL_PAGES.md were not found in their specified locations. These have been removed from tracking and replaced with the actual files found in the codebase.

### Workflow Builder Components
1. Core Workflow Components
   - `/apps/frontend/src/components/workflow/WorkflowCanvas.tsx`
   - `/apps/frontend/src/components/workflow/NodeToolbox.tsx`
   - `/apps/frontend/src/components/workflow/NodeProperties.tsx`
   - Status: ✅ Enhanced with new features

2. Execution Components
   - `/apps/frontend/src/components/workflow/WorkflowExecutionContext.tsx`
   - `/apps/frontend/src/components/workflow/WorkflowDebugger.tsx`
   - `/apps/frontend/src/components/workflow/WorkflowAnalytics.tsx`
   - Status: ✅ Added new components

3. Template Components
   - `/apps/frontend/src/components/workflow/WorkflowTemplates.tsx`
   - Status: ✅ Added new component

4. Node Components
   - `/apps/frontend/src/components/workflow/nodes/a2a-node.tsx`
   - `/apps/frontend/src/components/workflow/nodes/loop-node.tsx`
   - `/apps/frontend/src/components/workflow/nodes/subworkflow-node.tsx`
   - Status: ✅ Added new node types

## JavaScript Files Assessment

### Communication Scripts
1. `/src/scripts/send_introduction.js`
   - Status: ❌ Not found
   - Action: Remove from ALL_PAGES.md

2. `/src/scripts/redis-direct.js`
   - Status: ❌ Not found
   - Action: Remove from ALL_PAGES.md

3. `/src/scripts/auto_communication.js`
   - Status: ❌ Not found
   - Action: Remove from ALL_PAGES.md

4. `/src/scripts/listen_for_messages.js`
   - Status: ❌ Not found
   - Action: Remove from ALL_PAGES.md

5. `/services/communication/src/scripts/listen_for_messages.js`
   - Status: ❌ Not found
   - Action: Remove from ALL_PAGES.md

6. `/services/communication/src/scripts/send_introduction.js`
   - Status: ❌ Not found
   - Action: Remove from ALL_PAGES.md

### Control Panel Scripts
1. `/packages/redis-communication/src/control-panel/main.js`
   - Status: ❌ Not found
   - Action: Remove from ALL_PAGES.md

### Utility Scripts
1. `/src/scripts/cascade_introduction.js`
   - Status: ❌ Not found
   - Action: Remove from ALL_PAGES.md

2. `/src/scripts/updateImports.js`
   - Status: ❌ Not found
   - Action: Remove from ALL_PAGES.md

3. `/src/scripts/verify-ag2-conversion.js`
   - Status: ❌ Not found
   - Action: Remove from ALL_PAGES.md

## CSS Files Assessment

### Frontend Styles
1. `/apps/frontend/src/styles/globals.css`
   - Status: ✅ Keep as is
   - Purpose: Global styles and Tailwind configuration
   - Location is appropriate in the frontend app
   - Contains theme variables and base styles

2. `/src/styles/flow.css`
   - Status: ❌ Not found
   - Action: Remove from ALL_PAGES.md as file doesn't exist

3. `/apps/client/src/styles/flow.css`
   - Status: ❌ Not found
   - Action: Remove from ALL_PAGES.md as file doesn't exist

4. `/apps/web/src/styles/flow.css`
   - Status: ❓ Need to check
   - Action: Verify if file exists and if it's needed

5. `/public/css/custom.css`
   - Status: ❓ Need to check
   - Action: Verify if file exists and if styles should be merged into globals.css

6. `/public/css/tailwind.css`
   - Status: ❓ Need to check
   - Action: Verify if this is the compiled Tailwind output (if so, should be in .gitignore)

## HTML Files Assessment

### Frontend HTML Files
1. `/apps/frontend/index.html`
   - Status: ✅ Keep as is
   - Purpose: Main entry point for the Vite-based frontend application
   - No changes needed as it follows standard Vite structure

2. `/frontend/index.html`
   - Status: ❌ Remove
   - Reason: Duplicate of `/apps/frontend/index.html`
   - Action: Remove after confirming it's an exact duplicate

3. `/public/index.html`
   - Status: ❓ Need to check
   - Action: Compare with `/apps/frontend/index.html` to determine if needed

### Service HTML Files
1. `/packages/redis-communication/src/control-panel/index.html`
   - Status: ✅ Keep as is
   - Purpose: Control panel for Redis communication service
   - Location is appropriate for its purpose

2. `/bolt.diy/app/entry.client.html`
   - Status: ✅ Keep as is
   - Purpose: Client entry point for bolt.diy app
   - Follows standard structure for the bolt.diy package

3. `/bolt.diy/app/entry.server.html`
   - Status: ✅ Keep as is
   - Purpose: Server entry point for bolt.diy app
   - Follows standard structure for the bolt.diy package

## New Directory Structure
```
/apps/frontend/src/
├── shared/
│   ├── ui/
│   │   ├── core/          # Base UI components
│   │   │   ├── Button/
│   │   │   ├── Card/
│   │   │   └── ...
│   │   ├── data/          # Data display components
│   │   ├── feedback/      # Feedback components
│   │   └── layout/        # Layout components
│   ├── hooks/             # Shared hooks
│   ├── utils/             # Shared utilities
│   ├── types/             # Shared types
│   └── styles/            # Shared styles
