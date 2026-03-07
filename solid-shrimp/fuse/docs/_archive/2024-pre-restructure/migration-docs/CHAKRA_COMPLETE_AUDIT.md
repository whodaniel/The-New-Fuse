# Complete Chakra UI Audit Report

**Generated:** 2025-10-17
**Total References:** 241 occurrences of "chakra" across the project

---

## Executive Summary

### Package Dependencies (CRITICAL - Remove These)

1. **apps/frontend/package.json**
   - `"@chakra-ui/react": "^2.10.9"`

2. **apps/electron-desktop/package.json**
   - `"@chakra-ui/react": "^2.8.2"`
   - `"@chakra-ui/styled-system": "^2.12.0"`

3. **packages/feature-tracker/package.json**
   - `"@chakra-ui/react": "^2.8.0"`

4. **packages/integration-tests/package.json**
   - `"@chakra-ui/react": "^2.8.0"`

### Audit Artifact (Can Ignore)

- **ui-audit-results/dependency-analysis.json** - Old audit file showing 101 @chakra-ui/react and 10 @chakra-ui/icons usages

---

## Critical Infrastructure Files

### Theme Configuration Files

1. **apps/frontend/src/shared/theme/themes.ts**
   ```typescript
   import { extendTheme, ThemeConfig } from "@chakra-ui/react";
   export const baseTheme = extendTheme({...});
   export const darkTheme = extendTheme({...});
   ```
   - ⚠️ **MUST MIGRATE:** Create Tailwind theme config

2. **apps/electron-desktop/src/renderer/main.tsx**
   ```typescript
   import { ChakraProvider, extendTheme } from '@chakra-ui/react'
   const theme = extendTheme({...});
   ```
   - ⚠️ **MUST MIGRATE:** Replace with Tailwind setup

### Provider/Context Files

1. **src/App.tsx**
   ```typescript
   import { ChakraProvider } from '@chakra-ui/react';
   <ChakraProvider theme={theme}>...</ChakraProvider>
   ```

2. **src/contexts/ThemeContext.tsx**
   ```typescript
   import { ChakraProvider } from '@chakra-ui/react';
   <ChakraProvider theme={theme}>...</ChakraProvider>
   ```

3. **Electron Desktop Main** (apps/electron-desktop/src/renderer/main.tsx)
   - Uses ChakraProvider wrapper

### Test Files Using ChakraProvider

All test files wrap components in ChakraProvider - these need updating:

1. **packages/integration-tests/src/workflow-builder/ui-components.test.ts**
2. **apps/frontend/src/components/admin/onboarding/__tests__/OnboardingWizardPreview.test.tsx**
3. **apps/frontend/src/components/admin/onboarding/__tests__/OnboardingStepsConfig.test.tsx**
4. **apps/frontend/src/components/admin/onboarding/__tests__/OnboardingAISettings.test.tsx**

---

## Hook Replacements Needed

### useToast Hook

**Found in 25+ locations across:**
- Electron desktop components
- Frontend components
- Auth feature components

**Good News:** ✅ ui-consolidated already has `useToast` implementation!
- Location: `packages/ui-consolidated/src/components/Toast/use-toast.tsx`
- Export: Available from `@the-new-fuse/ui-consolidated`

**Action Required:**
- Replace Chakra's `import { useToast } from '@chakra-ui/react'`
- With: `import { useToast } from '@the-new-fuse/ui-consolidated'`

### useDisclosure Hook

**Pattern to Replace:**
```typescript
// OLD (Chakra)
import { useDisclosure } from '@chakra-ui/react';
const { isOpen, onOpen, onClose } = useDisclosure();

// NEW (Simple useState)
import { useState } from 'react';
const [isOpen, setIsOpen] = useState(false);
const onOpen = () => setIsOpen(true);
const onClose = () => setIsOpen(false);
```

### useColorMode Hook

**Found in:** Theme components
**Pattern to Replace:**
```typescript
// OLD (Chakra)
import { useColorMode } from '@chakra-ui/react';
const { colorMode, toggleColorMode } = useColorMode();

// NEW (Custom implementation or next-themes)
import { useTheme } from 'next-themes'; // or custom hook
const { theme, setTheme } = useTheme();
```

---

## Component Files Needing Migration

### Electron Desktop (6 files)
- apps/electron-desktop/src/renderer/components/CommandCenter.tsx
- apps/electron-desktop/src/renderer/components/tabs/ChatTab.tsx
- apps/electron-desktop/src/renderer/components/tabs/ConnectionTab.tsx
- apps/electron-desktop/src/renderer/components/tabs/ElementsTab.tsx
- apps/electron-desktop/src/renderer/components/tabs/LocalServicesTab.tsx
- apps/electron-desktop/src/renderer/main.tsx

### Frontend Components (62 total - see CHAKRA_MIGRATION_STATUS.md for complete list)

Priority groups:
1. **Admin Panel:** 11 files
2. **Onboarding:** 10 files
3. **Workflow Builder:** 4 files
4. **Prompt Workbench:** 7 files
5. **Other:** 30 files

---

## Migration Checklist

### Phase 1: Infrastructure ⚠️ CRITICAL
- [ ] Remove `@chakra-ui/react` from `apps/frontend/package.json`
- [ ] Remove `@chakra-ui/react` from `apps/electron-desktop/package.json`
- [ ] Remove `@chakra-ui/styled-system` from `apps/electron-desktop/package.json`
- [ ] Remove `@chakra-ui/react` from `packages/feature-tracker/package.json`
- [ ] Remove `@chakra-ui/react` from `packages/integration-tests/package.json`
- [ ] Replace `ChakraProvider` in `src/App.tsx`
- [ ] Replace `ChakraProvider` in `src/contexts/ThemeContext.tsx`
- [ ] Replace `ChakraProvider` in electron main.tsx
- [ ] Migrate theme files (themes.ts)

### Phase 2: Hooks Migration
- [ ] Update all `useToast` imports to ui-consolidated version
- [ ] Replace all `useDisclosure` with useState pattern
- [ ] Replace all `useColorMode` with theme solution

### Phase 3: Test File Updates
- [ ] Update 4 test files to remove ChakraProvider wrappers
- [ ] Add proper Tailwind/ui-consolidated test setup

### Phase 4: Component Migration
- [ ] Complete remaining 62 component files (see CHAKRA_MIGRATION_STATUS.md)

### Phase 5: Cleanup
- [ ] Remove `ui-audit-results/dependency-analysis.json` (old audit artifact)
- [ ] Run `ppnpm install` to remove Chakra from lockfile
- [ ] Verify no Chakra imports remain: `grep -r "@chakra-ui" . --include="*.tsx" --include="*.ts"`

---

## Quick Commands for Verification

```bash
# Find all Chakra imports
grep -r "from '@chakra-ui" apps/ packages/ --include="*.tsx" --include="*.ts" | wc -l

# Find ChakraProvider usage
grep -r "ChakraProvider" . --include="*.tsx" --include="*.ts" | grep -v node_modules

# Find Chakra hooks
grep -r "useToast\|useDisclosure\|useColorMode" . --include="*.tsx" --include="*.ts" | grep -v node_modules | grep "@chakra-ui"

# Check package.json files
grep -r "@chakra-ui" . --include="*.json" | grep -v node_modules | grep -v ui-audit
```

---

## Replacement Patterns

### Layout Components
```typescript
// Chakra → Tailwind
<Box> → <div className="...">
<VStack> → <div className="flex flex-col gap-4">
<HStack> → <div className="flex flex-row gap-4">
<Stack> → <div className="flex flex-col gap-4">
<Flex> → <div className="flex">
<Grid> → <div className="grid grid-cols-{n}">
<SimpleGrid> → <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
<Container> → <Container> from ui-consolidated
```

### Typography
```typescript
<Heading> → <h1> / <h2> etc with Tailwind
<Text> → <p> / <span> with Tailwind
```

### Form Components
```typescript
<Input> → <Input> from ui-consolidated
<Textarea> → <Textarea> from ui-consolidated
<Select> → <Select> from ui-consolidated
<Checkbox> → <Checkbox> from ui-consolidated
<Radio> → <Radio> from ui-consolidated
<Switch> → <Switch> from ui-consolidated
```

### Feedback
```typescript
<Alert> → <Alert> from ui-consolidated
<Badge> → <Badge> from ui-consolidated
<Tooltip> → <Tooltip> from ui-consolidated
<Modal> → <Modal> from ui-consolidated
```

### Navigation
```typescript
<Tabs> → <Tabs> from ui-consolidated
<Accordion> → <Accordion> from ui-consolidated
<Breadcrumb> → <Breadcrumb> from ui-consolidated
```

---

## Critical Next Steps

1. **Remove package dependencies** (breaks everything until components are migrated)
2. **Migrate theme infrastructure** (themes.ts, providers)
3. **Update hooks** (useToast already exists in ui-consolidated!)
4. **Migrate components** (62 files remaining)
5. **Update tests** (4 test files)
6. **Final cleanup** (run ppnpm install, verify)

---

## Notes

- The `packageManager` field keeps reappearing in package.json - it may be auto-generated by pnpm or a hook
- ui-consolidated package is well-structured and ready to use
- Most common Chakra patterns have direct Tailwind equivalents
- useToast hook already exists in ui-consolidated - easy win!
