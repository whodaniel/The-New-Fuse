/**
 * @the-new-fuse/ui-components
 * UI component library for The New Fuse
 */

// Export core components
export * from './core/button/index.tsx';
export * from './core/card/index.tsx';
export * from './core/input/index.tsx';
export * from './core/progress.tsx';
export * from './core/badge.tsx';
export * from './core/dialog/index.tsx';
export * from './core/select/index.tsx';
export * from './core/switch/index.tsx';
// Toast components and hooks
export {
  Toast,
  ToastClose,
  ToastProvider,
  Toaster,
  useToast,
  toast
} from './core/toast/index.tsx';
export * from './core/label.tsx';
export * from './core/checkbox.tsx';

// Export layout components
export * from './layout/BaseLayout.js';
export * from './layout/Navigation.js';

// Export feature components
export * from './features/workflow/components/WorkflowEditor.tsx';
export * from './features/workflow/components/WorkflowVisualizer.tsx';
export * from './features/workflow/components/WorkflowError.tsx';

// Export utilities
export { cn, default as classNames } from './utils/cn.tsx';

// Export types
export type {
  ButtonProps,
  ExtendedButtonProps,
  InputProps,
  ProgressProps,
  LabelProps,
  SwitchProps,
  ToastProps,
  ToastVariant,
  ToasterToast,
  ToastActionType
} from './core/types.tsx';

// Export workflow types
export type {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowCondition,
  WorkflowStatus,
  WorkflowError as WorkflowErrorType,
  WorkflowExecution,
  WorkflowMetrics
} from './features/workflow/types.tsx';