/**
 * @the-new-fuse/ui-components
 * UI component library for The New Fuse
 */

// Export core components
export * from './core/button/index.js';
export * from './core/card/index.js';
export * from './core/input/index.js';
export * from './core/progress.js';
export * from './core/badge.js';
export * from './core/dialog/index.js';
export * from './core/select/index.js';
export * from './core/switch/index.js';
// Toast components and hooks
export {
  Toast,
  ToastClose,
  ToastProvider,
  Toaster,
  useToast,
  toast
} from './core/toast/index.js';
export * from './core/label.js';
export * from './core/checkbox.js';

// Export layout components
export * from './layout/BaseLayout.js';
export * from './layout/Navigation.js';

// Export feature components
export * from './features/workflow/components/WorkflowEditor.js';
export * from './features/workflow/components/WorkflowVisualizer.js';
export * from './features/workflow/components/WorkflowError.js';

// Export utilities
export { cn, default as classNames } from './utils/cn.js';

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
} from './core/types.js';

// Export workflow types
export type {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowCondition,
  WorkflowStatus,
  WorkflowError as WorkflowErrorType,
  WorkflowExecution,
  WorkflowMetrics
} from './features/workflow/types.js';