#!/bin/bash

# Create a types.ts file for the workflow feature
mkdir -p packages/ui-components/src/features/workflow
cat > packages/ui-components/src/features/workflow/types.tsx << 'EOL'
// Basic workflow types
export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  action: string;
  params?: Record<string, any>;
  dependencies: string[];
  conditions: WorkflowCondition[];
  status?: WorkflowStatus;
  result?: any;
  error?: WorkflowError;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowCondition {
  condition: string;
  nextStepId: string;
}

export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused';

export interface WorkflowState {
  status: WorkflowStatus;
  currentStepId?: string;
  completedSteps: string[];
  failedSteps: string[];
  results: Record<string, any>;
  errors: Record<string, WorkflowError>;
  startTime?: number;
  endTime?: number;
}

export interface WorkflowContext {
  state: WorkflowState;
  definition: WorkflowDefinition;
  variables: Record<string, any>;
}

export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: WorkflowError;
}

export interface WorkflowExecutionResult {
  workflowId: string;
  status: WorkflowStatus;
  results: Record<string, any>;
  errors: Record<string, WorkflowError>;
  metrics: WorkflowMetrics;
}

export interface WorkflowError {
  stepId: string;
  message: string;
  code: string;
  details?: any;
  timestamp: number;
}

export interface WorkflowMetrics {
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  runningSteps: number;
  pendingSteps: number;
  totalDuration: number;
  stepMetrics: StepMetrics[];
}

export interface StepMetrics {
  stepId: string;
  status: WorkflowStatus;
  startTime?: number;
  endTime?: number;
  duration?: number;
  retries: number;
}

export interface MonitoringEvent {
  type: string;
  stepId: string;
  timestamp: number;
  data: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  stepId?: string;
  message: string;
  code: string;
}

export interface Workflow {
  id: string;
  definition: WorkflowDefinition;
  state: WorkflowState;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  state: WorkflowState;
  startTime: number;
  endTime?: number;
  createdAt: string;
  updatedAt: string;
}
EOL

# Create task types
mkdir -p packages/ui-components/src/task
cat > packages/ui-components/src/task/types.tsx << 'EOL'
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum TaskType {
  WORKFLOW_STEP = 'workflow_step',
  AGENT_ACTION = 'agent_action',
  SYSTEM = 'system',
  USER = 'user'
}
EOL

# Create core types
mkdir -p packages/ui-components/src/core
cat > packages/ui-components/src/core/types.tsx << 'EOL'
import * as React from 'react';

export type ToastProps = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
};

export type ToastActionElement = React.ReactElement<{
  onClick?: () => void;
  className?: string;
  altText?: string;
}>;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  showValue?: boolean;
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
}

export interface DialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children?: React.ReactNode;
  className?: string;
}

export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
  className?: string;
}

export interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  asChild?: boolean;
}
EOL

# Create utils
mkdir -p packages/ui-components/src/lib
cat > packages/ui-components/src/lib/utils.tsx << 'EOL'
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
EOL

# Create utils/cn.js
mkdir -p packages/ui-components/src/utils
cat > packages/ui-components/src/utils/cn.tsx << 'EOL'
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default cn;
EOL

echo "Created necessary type definition files"
