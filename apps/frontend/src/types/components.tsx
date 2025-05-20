import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react'
import { VariantProps } from 'class-variance-authority'
import { TimelineEvent, TimelineBranch, TimelineWorkflow } from './timeline.js';
import { FeatureSuggestion } from './features.js';

// Shared Props
export interface BaseProps {
  className?: string
  children?: ReactNode
}

// Button Types
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, BaseProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  isLoading?: boolean
}

// Input Types
export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, BaseProps {
  error?: string
  label?: string
}

// Select Types
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, BaseProps {
  options: Array<{ value: string; label: string }>
  label?: string
  error?: string
}

// Card Types
export interface CardProps extends BaseProps {
  title?: string
  footer?: ReactNode
  header?: ReactNode
}

// Dialog Types
export interface DialogProps extends BaseProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title?: string
}

// Layout Types
export interface LayoutProps extends BaseProps {
  header?: ReactNode
  footer?: ReactNode
  sidebar?: ReactNode
}

// Navigation Types
export interface NavItemProps extends BaseProps {
  href: string
  icon?: ReactNode
  active?: boolean
}

// Form Types
export interface FormFieldProps extends BaseProps {
  label: string
  error?: string
  required?: boolean
}

// Table Types
export interface TableProps extends BaseProps {
  headers: string[]
  rows: Record<string, unknown>[]
  onRowClick?: (row: Record<string, unknown>) => void
}

// Chart Types
export interface ChartProps extends BaseProps {
  data: Array<{
    label: string
    value: number
    color?: string
  }>
  type?: 'line' | 'bar' | 'pie'
  options?: {
    title?: string
    xAxis?: string
    yAxis?: string
    legend?: boolean
  }
}

// Modal Types
export interface ModalProps extends BaseProps {
  isOpen: boolean
  onClose: () => void
  title?: string
}

// Toast Types
export interface ToastProps extends BaseProps {
  type?: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

// Theme Types
export interface Theme {
  mode: 'light' | 'dark'
  primary: string
  secondary: string
  background: string
  text: string
  error: string
  warning: string
  success: string
  info: string
}

// Auth Types
export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  role: 'user' | 'admin'
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

// API Types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  status: number
}

// Workspace Types
export interface Workspace {
  id: string
  name: string
  description?: string
  members: User[]
  createdAt: string
  updatedAt: string
}

// Agent Types
export interface Agent {
  id: string
  name: string
  description?: string
  type: string
  status: 'active' | 'inactive' | 'error'
  configuration: Record<string, any>
  createdAt: string
  updatedAt: string
}

// Message Types
export interface Message {
  id: string
  content: string
  sender: User | Agent
  timestamp: string
  type: 'text' | 'image' | 'file' | 'system'
  metadata?: Record<string, any>
}

export interface TimelineViewProps {
  events: TimelineEvent[];
  branches: TimelineBranch[];
  workflows: TimelineWorkflow[];
  currentBranchId?: string;
  onBranchSelect: (branchId: string) => void;
  onEventClick: (event: TimelineEvent) => void;
  onCreateBranch: (name: string, startEventId: string, parentBranchId?: string) => Promise<void>;
  onMergeBranch: (branchId: string, targetEventId: string, mergedFromEvents: string[]) => Promise<void>;
}

export interface KanbanBoardProps {
  suggestions: FeatureSuggestion[];
  loading: boolean;
  error?: Error;
  onStatusChange: (suggestionId: string, newStatus: SuggestionStatus) => Promise<void>;
  onSuggestionCreate: (suggestion: Omit<FeatureSuggestion, "id">) => Promise<void>;
}

export interface TimelineSliderProps {
  events: TimelineEvent[];
  currentEventId?: string;
  onEventChange: (eventId: string) => void;
  disabled?: boolean;
}

export interface D3TimelineProps extends TimelineViewProps {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
}
