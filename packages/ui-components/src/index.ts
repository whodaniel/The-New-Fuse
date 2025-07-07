/**
 * @the-new-fuse/ui-components
 * UI component library for The New Fuse
 */

// Export core components
export * from './core/button/index';
export * from './core/card/index';
export * from './core/input/index';
export * from './core/progress';
export * from './core/badge';
export * from './core/dialog/index';
export * from './core/select/index';
export * from './core/switch/index';
// Toast components and hooks
export {
  Toast,
  ToastClose,
  ToastProvider,
  Toaster,
  useToast,
  toast
} from './core/toast/index';
export * from './core/label';
export * from './core/checkbox';

// Export layout components
export * from './layout/BaseLayout/index';
export * from './layout/Navigation/index';

// Export feature components
export * from './features/workflow/components/WorkflowEditor';
export * from './features/workflow/components/WorkflowVisualizer';
export * from './features/workflow/components/WorkflowError';

// Export utilities
export { cn, default as classNames } from './utils/cn';

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
} from './core/types';

// Export workflow types
export type {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowCondition,
  WorkflowStatus,
  WorkflowError as WorkflowErrorType,
  WorkflowExecution,
  WorkflowMetrics
} from './features/workflow/types';