# Remaining Chakra UI Migration Work

## Summary

Infrastructure migration is complete. Component migration is still needed for
files that use Chakra UI components.

## Completed ✅

1. ✅ Removed Chakra UI from all package.json files (4 files)
2. ✅ Removed `packageManager` field that was causing pnpm errors
3. ✅ Ran ppnpm install successfully
4. ✅ Migrated theme files to plain TypeScript/CSS
5. ✅ Removed ChakraProvider from App.tsx and contexts
6. ✅ Migrated electron desktop theme and provider
7. ✅ Removed ChakraProvider from test files (4 files)

## Remaining Work 🚧

### Electron Desktop App Components (Priority: HIGH)

These 5 files have extensive Chakra UI usage and need full migration:

1. **apps/electron-desktop/src/renderer/components/tabs/LocalServicesTab.tsx**
   - Components used: VStack, HStack, Box, Text, Button, Input, Card, CardBody,
     Badge, Divider, useToast, Alert, AlertIcon, Grid, GridItem, IconButton,
     NumberInput, FormControl, FormLabel
   - ~625 lines

2. **apps/electron-desktop/src/renderer/components/tabs/ConnectionTab.tsx**
   - Components used: VStack, HStack, Text, Button, Input, FormControl,
     FormLabel, Card, CardBody, Badge, Divider, useToast, Alert, AlertIcon,
     AlertTitle, AlertDescription, Switch, NumberInput, Box
   - ~353 lines

3. **apps/electron-desktop/src/renderer/components/tabs/ChatTab.tsx**
   - Components used: useToast + other Chakra components

4. **apps/electron-desktop/src/renderer/components/tabs/ElementsTab.tsx**
   - Components used: useToast + other Chakra components

5. **apps/electron-desktop/src/renderer/components/CommandCenter.tsx**
   - Components used: useToast + other Chakra components

### Frontend Components (Priority: MEDIUM)

These 3 files have Chakra imports:

1. **apps/frontend/src/components/AdminPanel/ScriptRunner.tsx**
   - Components used: Box, Button, Select, Text, useToast, VStack, FormControl,
     FormLabel
   - ~87 lines

2. **apps/frontend/src/components/WorkflowBuilder/WorkflowCanvas.tsx**
   - Components used: Box, useToast

3. **apps/frontend/src/components/workflow/WorkflowCanvas.tsx**
   - Components used: Box, useToast

## Migration Guide

### Toast Migration

**Chakra UI:**

```typescript
import { useToast } from '@chakra-ui/react';

const toast = useToast();
toast({
  title: 'Title',
  description: 'Description',
  status: 'success', // 'success' | 'error' | 'warning' | 'info'
  duration: 3000,
  isClosable: true,
});
```

**ui-consolidated:**

```typescript
import { useToast } from '@the-new-fuse/ui-consolidated';

const { toast } = useToast(); // Note: destructure from returned object
toast({
  title: 'Title',
  description: 'Description',
  variant: 'success', // 'default' | 'destructive' | 'success' | 'warning'
  duration: 3000,
  // Note: isClosable doesn't exist, toasts are auto-dismissable
});
```

**Status to Variant Mapping:**

- `status: 'success'` → `variant: 'success'`
- `status: 'error'` → `variant: 'destructive'`
- `status: 'warning'` → `variant: 'warning'`
- `status: 'info'` → `variant: 'default'`

### Component Replacements

Available in `@the-new-fuse/ui-consolidated`:

- ✅ Button
- ✅ Card
- ✅ Input
- ✅ Select
- ✅ Switch
- ✅ Badge
- ✅ Alert
- ✅ Checkbox
- ✅ Tooltip
- ✅ Modal
- ✅ Tabs

Need Tailwind equivalents:

- VStack → `<div className="flex flex-col space-y-{n}">`
- HStack → `<div className="flex flex-row space-x-{n}">`
- Box → `<div>`
- Text → `<p>` or `<span>`
- Grid → `<div className="grid grid-cols-{n} gap-{n}">`
- GridItem → `<div>`
- Divider → `<hr className="border-gray-200">`
- FormControl → `<div className="space-y-2">`
- FormLabel → `<label className="block text-sm font-medium">`
- NumberInput → Need custom component or use Input with type="number"
- IconButton → Button with icon only

## Recommended Approach

### Phase 1: Create Missing Components (if needed)

1. Create NumberInput component in ui-consolidated if not present
2. Create IconButton variant in Button component
3. Create FormControl and FormLabel components for better form UX

### Phase 2: Migrate Electron Desktop Components

Migrate each file one by one:

1. LocalServicesTab.tsx
2. ConnectionTab.tsx
3. ChatTab.tsx
4. ElementsTab.tsx
5. CommandCenter.tsx

### Phase 3: Migrate Frontend Components

1. ScriptRunner.tsx
2. WorkflowBuilder/WorkflowCanvas.tsx
3. workflow/WorkflowCanvas.tsx

### Phase 4: Final Verification

1. Run full codebase search for remaining Chakra imports
2. Test all migrated components
3. Verify toast functionality works across app
4. Remove @chakra-ui/\* from node_modules completely
5. Update documentation

## Notes

- The electron-desktop components are the most complex and will require
  significant effort
- Each component needs thorough testing after migration
- Consider migrating incrementally to avoid breaking changes
- May need to create additional utility components for common patterns
