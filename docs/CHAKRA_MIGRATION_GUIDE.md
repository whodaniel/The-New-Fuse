# Chakra UI → Tailwind + Custom Design System Migration Guide

**Last Updated**: 2025-12-08 07:05 AM  
**Status**: In Progress (8% Complete)  
**Progress**: 4/50 files migrated

---

## 📊 Quick Status

| Category               | Completed | Total  | %       |
| ---------------------- | --------- | ------ | ------- |
| Admin Pages            | 4         | 4      | 100%    |
| Admin Panel Components | 0         | 11     | 0%      |
| Prompt Workbench       | 0         | 7      | 0%      |
| Wizard Components      | 0         | 6      | 0%      |
| Shared Components      | 0         | 6      | 0%      |
| Workflow Pages         | 1         | 2      | 50%     |
| Other Pages            | 0         | 14     | 0%      |
| **TOTAL**              | **5**     | **50** | **10%** |

---

## 🎯 Why We're Migrating

### Current Problem

- **Chakra UI** (200KB) conflicts with **Tailwind CSS** + **Custom Design
  System**
- Three styling systems fighting each other
- Inconsistent UX across pages
- Larger bundle size, slower performance

### Solution

- Remove Chakra UI completely
- Use **Tailwind CSS v4** (already installed) for utilities
- Use **Custom Design System** for components
- **Result**: -200KB bundle, +5-10 Lighthouse points, consistent design

---

## 🔄 Migration Patterns

### Component Conversions

```tsx
// ❌ Chakra UI
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  Badge,
} from '@chakra-ui/react';

<Box p={4} bg="blue.500" borderRadius="md">
  <VStack spacing={4} align="stretch">
    <Text fontSize="2xl" fontWeight="bold">
      Title
    </Text>
    <HStack spacing={2}>
      <Button colorScheme="blue">Primary</Button>
      <Badge colorScheme="green">Active</Badge>
    </HStack>
  </VStack>
</Box>;

// ✅ Tailwind + Custom
import { Button, Card, Badge } from '@/components/ui/design-system';

<Card className="p-4 bg-primary rounded-md">
  <div className="flex flex-col gap-4">
    <h2 className="text-2xl font-bold">Title</h2>
    <div className="flex gap-2">
      <Button variant="primary">Primary</Button>
      <Badge variant="success">Active</Badge>
    </div>
  </div>
</Card>;
```

### Quick Reference Table

| Chakra                        | Tailwind + Custom                       |
| ----------------------------- | --------------------------------------- |
| `<Box>`                       | `<div className="...">`                 |
| `<Text>`                      | `<p className="...">` or `<span>`       |
| `<Heading>`                   | `<h1-h6 className="...">`               |
| `<VStack spacing={4}>`        | `<div className="flex flex-col gap-4">` |
| `<HStack spacing={4}>`        | `<div className="flex gap-4">`          |
| `<SimpleGrid columns={3}>`    | `<div className="grid grid-cols-3">`    |
| `<Button colorScheme="blue">` | `<Button variant="primary">`            |
| `<Badge colorScheme="green">` | `<Badge variant="success">`             |
| `<Card>`                      | `<Card>` or `<GlassCard>`               |

### Props to Classes

| Chakra Prop         | Tailwind Class |
| ------------------- | -------------- |
| `p={4}`             | `p-4`          |
| `px={6}`            | `px-6`         |
| `m={2}`             | `m-2`          |
| `bg="blue.500"`     | `bg-primary`   |
| `color="red.500"`   | `text-danger`  |
| `fontSize="lg"`     | `text-lg`      |
| `fontWeight="bold"` | `font-bold`    |
| `borderRadius="md"` | `rounded-md`   |
| `shadow="lg"`       | `shadow-lg`    |
| `w="full"`          | `w-full`       |

---

## 🛠️ Available Components

### From `@/components/ui/design-system`

- `Button` - variants: primary, secondary, outline, ghost, link
- `Card`, `GlassCard` - Card components
- `Badge` - variants: primary, secondary, success, warning, danger
- `Alert` - Alert notifications
- `StatCard` - Statistics display
- `FeatureCard` - Feature showcase
- `LoadingSpinner` - Loading indicators
- `ProgressBar` - Progress bars
- `Toast` - Toast notifications
- `Tabs` - Tabbed interfaces

### From `@/components/ui/modal`

- `Modal` - Main modal
- `ModalOverlay` - Backdrop
- `ModalContent` - Content container
- `ModalHeader` - Header section
- `ModalBody` - Body section
- `ModalFooter` - Footer section
- `ModalCloseButton` - Close button

### From `@/components/ui/drawer`

- `Drawer` - Drawer component
- (Check file for full API)

### From `@/components/ui/tooltip`

- `Tooltip` - Tooltip component

### Still Need to Create

- ⏳ Popover
- ⏳ Menu/Dropdown
- ⏳ Slider
- ⏳ Avatar
- ⏳ Accordion

---

## 📝 Migration Workflow

### For Each File:

1. **Analyze** - Identify all Chakra components
2. **Replace Imports**

   ```tsx
   // Remove
   import { Box, Text, Button } from '@chakra-ui/react';

   // Add
   import { Button, Card } from '@/components/ui/design-system';
   ```

3. **Convert Components**
   - `<Box>` → `<div>`
   - `<Text>` → `<p>` or `<span>`
   - `<VStack>` → `<div className="flex flex-col gap-*">`
   - `<HStack>` → `<div className="flex gap-*">`

4. **Convert Props to Classes**
   - `p={4}` → `className="p-4"`
   - `bg="blue.500"` → `className="bg-primary"`

5. **Test** - Verify visually and functionally

6. **Commit** - `git commit -m "Migrate [Component] from Chakra to Tailwind"`

---

## 📋 Files to Migrate

### ✅ Completed (5 files)

#### Admin Pages

1. ✅ `/src/pages/Admin/FeatureFlags.tsx`
2. ✅ `/src/pages/Admin/SecurityDashboard.tsx`
3. ✅ `/src/pages/Admin/UserManagement.tsx`
4. ✅ `/src/pages/Admin/SystemMonitoring.tsx`

#### Workflow Pages

5. ✅ `/src/pages/workflow-pages/WorkflowBuilder.tsx` (User migrated)

### 🔄 Remaining (45 files)

#### Admin Panel Components (11 files) - NEXT

1. [ ] `/src/components/AdminPanel/ApiMonitor.tsx`
2. [ ] `/src/components/AdminPanel/AuditLogs.tsx`
3. [ ] `/src/components/AdminPanel/FeatureFlags.tsx`
4. [ ] `/src/components/AdminPanel/RoleManager.tsx`
5. [ ] `/src/components/AdminPanel/ScriptRunner.tsx`
6. [ ] `/src/components/AdminPanel/ServiceMonitor.tsx`
7. [ ] `/src/components/AdminPanel/ServiceStatus.tsx`
8. [ ] `/src/components/AdminPanel/SystemConfig.tsx`
9. [ ] `/src/components/AdminPanel/SystemMetrics.tsx`
10. [ ] `/src/components/AdminPanel/UserManagement.tsx`
11. [ ] `/src/components/admin/onboarding/OnboardingWizardPreview.tsx`

#### Prompt Workbench (7 files)

12. [ ] `/src/components/PromptWorkbench/PromptWorkbench.tsx`
13. [ ] `/src/components/PromptWorkbench/PromptEditor.tsx`
14. [ ] `/src/components/PromptWorkbench/PromptSaveModal.tsx`
15. [ ] `/src/components/PromptWorkbench/ResultsViewer.tsx`
16. [ ] `/src/components/PromptWorkbench/TestCaseManager.tsx`
17. [ ] `/src/components/PromptWorkbench/VariableManager.tsx`
18. [ ] `/src/components/PromptWorkbench/VersionHistory.tsx`

#### Wizard Components (6 files)

19. [ ] `/src/components/wizard/WizardInterface.tsx`
20. [ ] `/src/components/wizard/WizardMonitoring.tsx`
21. [ ] `/src/components/wizard/AgentConfig.tsx`
22. [ ] `/src/components/wizard/GraphAnalytics.tsx`
23. [ ] `/src/components/wizard/KnowledgeGraphViewer.tsx`
24. [ ] `/src/components/wizard/graph/GraphVisualizer.tsx`

#### Shared Components (6 files)

25. [ ] `/src/components/shared/DataCard.tsx`
26. [ ] `/src/components/shared/DataTable.tsx`
27. [ ] `/src/components/shared/FormFields.tsx`
28. [ ] `/src/components/shared/charts/ChartSystem.tsx`
29. [ ] `/src/components/Analytics.tsx`
30. [ ] `/src/components/select.tsx`

#### Workflow Components (1 file)

31. [ ] `/src/pages/workflow-pages/EnhancedWorkflowBuilder.tsx`
32. [ ] `/src/components/workflow/EnhancedNodeTypes.tsx`

#### Other Components & Pages (14 files)

33. [ ] `/src/components/AgentCreationStudio.tsx`
34. [ ] `/src/components/agent-skill-marketplace.tsx`
35. [ ] `/src/components/demo/ChromeExtensionDemo.tsx`
36. [ ] `/src/components/demo/EnhancedChromeExtensionDemo.tsx`
37. [ ] `/src/components/forms/AgentToolsForm.tsx`
38. [ ] `/src/components/mass/MassBlockExecutor.tsx`
39. [ ] `/src/components/mass/MassOptimizationPanel.tsx`
40. [ ] `/src/components/onboarding/AIAgentOnboarding.tsx`
41. [ ] `/src/components/performance/BundleAnalyzer.tsx`
42. [ ] `/src/components/ui/popup/PopupContainer.tsx`
43. [ ] `/src/pages/IDE/TheiaIDE.tsx`
44. [ ] `/src/pages/MemoryInspector.tsx`
45. [ ] `/src/pages/MetricsDashboard.tsx`
46. [ ] `/src/pages/fairtable/FairtableDashboard.tsx`
47. [ ] `/src/pages/web3/NFTMarketplace.tsx`
48. [ ] `/src/shared/theme/ThemeContext.tsx`
49. [ ] `/src/shared/theme/ThemeCustomizer.tsx`
50. [ ] `/src/__tests__/EnhancedWorkflowBuilder.test.tsx`

---

## 🤖 For Other AI Coders

### Quick Start

1. Read this guide
2. Pick a file from the list above
3. Follow the migration workflow
4. Test and commit

### Example Migration

```tsx
// BEFORE: /src/components/AdminPanel/ApiMonitor.tsx
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
} from '@chakra-ui/react';

export const ApiMonitor = () => (
  <Box p={6}>
    <VStack spacing={4} align="stretch">
      <Text fontSize="2xl" fontWeight="bold">
        API Monitor
      </Text>
      <Card>
        <CardBody>
          <HStack spacing={2}>
            <Badge colorScheme="green">Active</Badge>
            <Text>200 OK</Text>
          </HStack>
        </CardBody>
      </Card>
    </VStack>
  </Box>
);

// AFTER
import { Card, Badge } from '@/components/ui/design-system';

export const ApiMonitor = () => (
  <div className="p-6">
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">API Monitor</h2>
      <Card className="p-6">
        <div className="flex gap-2">
          <Badge variant="success">Active</Badge>
          <p>200 OK</p>
        </div>
      </Card>
    </div>
  </div>
);
```

---

## ✅ Success Criteria

- [ ] All 50 files migrated
- [ ] No `@chakra-ui/react` imports
- [ ] All pages render correctly
- [ ] All interactions work
- [ ] Responsive design maintained
- [ ] Bundle size reduced by ~200KB
- [ ] Lighthouse score improved
- [ ] All tests passing

---

## 📈 Expected Results

### Performance

- **Bundle Size**: -200KB
- **Lighthouse Score**: +5-10 points
- **Load Time**: Faster initial load

### Developer Experience

- **One System**: Single source of truth
- **Easier Maintenance**: No version conflicts
- **Better DX**: Tailwind utilities + custom components

### Design

- **Consistency**: 100% design system usage
- **Unique**: Not "another Chakra app"
- **Modern**: Glassmorphism, animations, premium feel

---

## 🚀 Next Actions

1. **Create missing components** (Popover, Menu, Slider, Avatar)
2. **Migrate Admin Panel Components** (11 files)
3. **Test migrated pages**
4. **Continue with remaining files**
5. **Remove Chakra UI** from package.json
6. **Final testing and optimization**

---

**Need Help?** Check the examples above or ask questions!
