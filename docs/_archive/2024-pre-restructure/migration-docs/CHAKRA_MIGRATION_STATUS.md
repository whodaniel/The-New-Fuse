# Chakra UI → Tailwind Migration Status

**Generated:** 2025-10-17

## Summary

- **Total Files with Chakra UI:** 62 files
- **Migration Progress:** In Progress
- **UI-Consolidated Package:** ✅ Ready with 18+ components

## Files Requiring Migration

### Frontend App Components (46 files)

#### Admin Panel (11 files)

- `apps/frontend/src/components/AdminPanel/AdminPanel.tsx`
- `apps/frontend/src/components/AdminPanel/ApiMonitor.tsx`
- `apps/frontend/src/components/AdminPanel/AuditLogs.tsx`
- `apps/frontend/src/components/AdminPanel/FeatureFlags.tsx`
- `apps/frontend/src/components/AdminPanel/RoleManager.tsx`
- `apps/frontend/src/components/AdminPanel/ScriptRunner.tsx`
- `apps/frontend/src/components/AdminPanel/ServiceMonitor.tsx`
- `apps/frontend/src/components/AdminPanel/ServiceStatus.tsx`
- `apps/frontend/src/components/AdminPanel/SystemConfig.tsx`
- `apps/frontend/src/components/AdminPanel/SystemMetrics.tsx`
- `apps/frontend/src/components/AdminPanel/UserManagement.tsx`

#### Onboarding (10 files)

- `apps/frontend/src/components/admin/onboarding/OnboardingAISettings.tsx`
- `apps/frontend/src/components/admin/onboarding/OnboardingAdmin.tsx`
- `apps/frontend/src/components/admin/onboarding/OnboardingAnalytics.tsx`
- `apps/frontend/src/components/admin/onboarding/OnboardingGeneralSettings.tsx`
- `apps/frontend/src/components/admin/onboarding/OnboardingUserTypes.tsx`
- `apps/frontend/src/components/admin/onboarding/OnboardingWizardPreview.tsx`
- `apps/frontend/src/components/admin/onboarding/__tests__/OnboardingAISettings.test.tsx`
- `apps/frontend/src/components/admin/onboarding/__tests__/OnboardingStepsConfig.test.tsx`
- `apps/frontend/src/components/admin/onboarding/__tests__/OnboardingWizardPreview.test.tsx`
- `apps/frontend/src/components/onboarding/AIAgentOnboarding.tsx`
- `apps/frontend/src/components/onboarding/UserTypeDetection.tsx`

#### Wizard Components (4 files)

- `apps/frontend/src/components/wizard/GreeterAgent.tsx`
- `apps/frontend/src/components/wizard/steps/GreeterAgentStep.tsx`
- `apps/frontend/src/components/wizard/steps/ToolsSelectionStep.tsx`
- `apps/frontend/src/components/wizard/steps/UserProfileStep.tsx`
- `apps/frontend/src/components/wizard/steps/WorkspaceSetupStep.tsx`

#### Workflow Builder (4 files)

- `apps/frontend/src/components/WorkflowBuilder/NodeToolbar.tsx`
- `apps/frontend/src/components/WorkflowBuilder/WorkflowCanvas.tsx`
- `apps/frontend/src/components/workflow/WorkflowCanvas.tsx`
- `apps/frontend/src/components/workflow/WorkflowToolbar.tsx`

#### Prompt Workbench (7 files)

- `apps/frontend/src/components/PromptWorkbench/PromptEditor.tsx`
- `apps/frontend/src/components/PromptWorkbench/PromptSaveModal.tsx`
- `apps/frontend/src/components/PromptWorkbench/PromptWorkbench.tsx`
- `apps/frontend/src/components/PromptWorkbench/ResultsViewer.tsx`
- `apps/frontend/src/components/PromptWorkbench/TestCaseManager.tsx`
- `apps/frontend/src/components/PromptWorkbench/VariableManager.tsx`
- `apps/frontend/src/components/PromptWorkbench/VersionHistory.tsx`

#### Other Frontend (10 files)

- `apps/frontend/src/components/admin/APIMonitoring.tsx`
- `apps/frontend/src/components/admin/AdminDashboard.tsx`
- `apps/frontend/src/components/admin/McpMonitor.tsx`
- `apps/frontend/src/components/agent-details.tsx`
- `apps/frontend/src/components/agent-skill-marketplace.tsx`
- `apps/frontend/src/components/AgentCreationStudio.tsx`
- `apps/frontend/src/components/ColorBox.tsx`
- `apps/frontend/src/components/forms/AgentToolsForm.tsx`
- `apps/frontend/src/components/mass/MassBlockExecutor.tsx`
- `apps/frontend/src/components/mass/MassOptimizationPanel.tsx`

#### Pages (3 files)

- `apps/frontend/src/pages/Admin/Onboarding.tsx`
- `apps/frontend/src/pages/WorkflowsEnhanced.tsx`
- `apps/frontend/src/pages/preview/OnboardingPreview.tsx`

#### Theme (2 files)

- `apps/frontend/src/shared/theme/ThemeContext.tsx`
- `apps/frontend/src/shared/theme/ThemeCustomizer.tsx`

### Electron Desktop (6 files)

- `apps/electron-desktop/src/renderer/components/CommandCenter.tsx`
- `apps/electron-desktop/src/renderer/components/tabs/ChatTab.tsx`
- `apps/electron-desktop/src/renderer/components/tabs/ConnectionTab.tsx`
- `apps/electron-desktop/src/renderer/components/tabs/ElementsTab.tsx`
- `apps/electron-desktop/src/renderer/components/tabs/LocalServicesTab.tsx`
- `apps/electron-desktop/src/renderer/main.tsx`

### Packages (4 files)

- `packages/features/agents/components/AgentFilters/index.tsx`
- `packages/features/auth/components/LoginForm.tsx`
- `packages/features/auth/components/RegisterForm.tsx`
- `packages/features/theme/types.ts`

### Tests (1 file)

- `packages/integration-tests/src/workflow-builder/ui-components.test.ts`

## UI-Consolidated Components Available

✅ **Layout:**

- Container
- Layout
- Sidebar
- Split/SplitPane

✅ **Form Components:**

- Button
- Input
- Textarea
- Checkbox
- Radio
- Select
- Switch

✅ **Feedback:**

- Alert
- Badge
- Modal
- Tooltip

✅ **Navigation:**

- Accordion
- Breadcrumb
- Dropdown
- Pagination
- Tabs

✅ **Data Display:**

- Card

✅ **Auth:**

- Login/Register forms (pre-built)

✅ **Utilities:**

- cn (tailwind-merge)
- Theme utilities

## Migration Strategy

### Priority 1: Core UI Components (Your AI is working on these)

- ✅ OnboardingFlow
- ✅ OnboardingWizard
- ✅ CompletionStep
- ✅ OnboardingStepsConfig
- 🔄 Remove Chakra dependencies from package.json

### Priority 2: Admin Panel

- 11 admin components need migration
- All use similar patterns (tables, forms, metrics)

### Priority 3: Workflow Builder

- 4 components with complex interactions
- May need custom canvas components

### Priority 4: Other Components

- Prompt Workbench (7 files)
- Electron Desktop (6 files)
- Misc components

## Next Steps for Parallel Work

1. **Build ui-consolidated** to ensure all exports work
2. **Run type checking** on migrated files
3. **Create migration patterns** for repeated Chakra patterns
4. **Document common replacements** (e.g., `useToast` → custom hook)

## Common Migration Patterns

```typescript
// Chakra → Tailwind
Box → div with Tailwind classes
VStack → div with "flex flex-col gap-{n}"
HStack → div with "flex flex-row gap-{n}"
Heading → h1-h6 with Tailwind typography
Text → p/span with Tailwind typography
Button → <Button> from ui-consolidated
useToast → Custom toast implementation or library
useDisclosure → useState for modal/drawer state
```

## Notes

- **packageManager field** has reappeared in package.json - may need removal
  again
- **ui-consolidated** is well-structured with Radix UI primitives
- **Tailwind** is properly configured in the project
