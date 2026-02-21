/**
 * React Component and Hook Type Definitions
 * Replaces 'any' types in React components and hooks
 */

import { ReactComponentProps, ReactEventHandler, ReactChangeHandler, FormOption, ThemeConfig } from '../common';

// Base component props
export interface BaseComponentProps extends ReactComponentProps {
  className?: string;
  testId?: string;
  children?: React.ReactNode;
}

// Form field props
export interface BaseFormFieldProps extends BaseComponentProps {
  name: string;
  label: string;
  value: unknown;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  onChange: ReactChangeHandler;
  sx?: Record<string, unknown>;
}

export interface FormTextFieldProps extends BaseFormFieldProps {
  type?: 'text' | 'password' | 'email' | 'number' | 'url' | 'tel';
  placeholder?: string;
  autoComplete?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
}

export interface FormSelectFieldProps extends BaseFormFieldProps {
  options: FormOption[];
  multiple?: boolean;
}

export interface FormCheckboxFieldProps extends BaseFormFieldProps {
  checked: boolean;
}

export interface FormSwitchFieldProps extends BaseFormFieldProps {
  checked: boolean;
}

export interface FormSliderFieldProps extends BaseFormFieldProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  marks?: Array<{ value: number; label: string }>;
  valueLabelDisplay?: 'auto' | 'on' | 'off';
}

export interface FormArrayFieldProps extends BaseFormFieldProps {
  value: unknown[];
  addItem: () => void;
  removeItem: (index: number) => void;
  renderItem: (item: unknown, index: number, onChange: (value: unknown, index: number) => void) => React.ReactNode;
}

// Chat and messaging components
export interface ChatMessageData {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  senderId?: string;
  metadata?: Record<string, unknown>;
  attachments?: ChatAttachment[];
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface ChatRoomData {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'channel';
  participants: ChatParticipant[];
  lastMessage?: ChatMessageData;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: string;
}

export interface ChatContainerProps extends BaseComponentProps {
  roomId: string;
  messages: ChatMessageData[];
  onSendMessage: (content: string, attachments?: File[]) => void;
  onTyping?: (isTyping: boolean) => void;
  currentUser: string;
}

// Workflow editor components
export interface WorkflowNodeData {
  id: string;
  type: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  inputs: WorkflowPort[];
  outputs: WorkflowPort[];
}

export interface WorkflowPort {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
}

export interface WorkflowEdgeData {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  condition?: string;
  label?: string;
}

export interface WorkflowBuilderProps extends BaseComponentProps {
  nodes: WorkflowNodeData[];
  edges: WorkflowEdgeData[];
  onNodesChange: (nodes: WorkflowNodeData[]) => void;
  onEdgesChange: (edges: WorkflowEdgeData[]) => void;
  onNodeSelect: (node: WorkflowNodeData | null) => void;
  onEdgeSelect: (edge: WorkflowEdgeData | null) => void;
  onValidate: () => ValidationResult;
}

export interface NodeInspectorProps extends BaseComponentProps {
  node: WorkflowNodeData | null;
  onUpdate: (config: Record<string, unknown>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

// Admin panel components
export interface FeatureFlagData {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: FeatureFlagCondition[];
  rolloutPercentage: number;
  targetUsers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlagCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value: string | number | boolean;
}

export interface RoleData {
  id: string;
  name: string;
  description: string;
  permissions: PermissionData[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionData {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

// Hook types
export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: unknown[]) => Promise<T>;
  reset: () => void;
}

export interface UseDebounceState<T> {
  debouncedValue: T;
  setValue: React.Dispatch<React.SetStateAction<T>>;
}

export interface UseLocalStorageState<T> {
  value: T;
  setValue: (value: T) => void;
  removeValue: () => void;
}

export interface UseModalState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export interface UseFormState<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  handleChange: (name: keyof T, value: unknown) => void;
  handleBlur: (name: keyof T) => void;
  handleSubmit: (callback: (values: T) => void) => (e: React.FormEvent) => void;
  reset: () => void;
  setValues: (values: T) => void;
  setErrors: (errors: Record<keyof T, string>) => void;
}

export interface UseWebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  send: (message: WebSocketMessage) => void;
  reconnect: () => void;
  disconnect: () => void;
}

export interface UseAPIMonitoringState {
  metrics: APIMetrics;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  recordRequest: (duration: number, status: number) => void;
  recordError: (error: string) => void;
}

export interface APIMetrics {
  totalRequests: number;
  totalErrors: number;
  averageResponseTime: number;
  successRate: number;
  requestsPerMinute: number;
  errorRate: number;
}

// Context types
export interface ThemeContextType {
  theme: ThemeConfig;
  mode: 'light' | 'dark' | 'auto';
  toggleMode: () => void;
  setMode: (mode: 'light' | 'dark' | 'auto') => void;
  colors: ThemeColors;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  loading: boolean;
  error: string | null;
  setCurrentWorkspace: (workspace: Workspace) => void;
  createWorkspace: (data: Partial<Workspace>) => Promise<Workspace>;
  updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;
}

// User, Workspace, and related types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  permissions: string[];
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  desktop: boolean;
  sound: boolean;
  workflow: boolean;
  agents: boolean;
}

export interface PrivacySettings {
  profileVisible: boolean;
  activityVisible: boolean;
  allowDirectMessages: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  slug: string;
  settings: WorkspaceSettings;
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceSettings {
  allowMemberInvites: boolean;
  defaultRole: string;
  features: Record<string, boolean>;
  limits: Record<string, number>;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  permissions: string[];
  joinedAt: string;
  invitedBy?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

// Utility types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface WebSocketMessage {
  type: string;
  payload: unknown;
  id?: string;
  timestamp?: number;
}

// Event handling
export interface EventHandler<T = unknown> {
  (event: T): void | Promise<void>;
}

export interface MouseEventHandler extends EventHandler<React.MouseEvent> {}
export interface ChangeEventHandler extends EventHandler<React.ChangeEvent> {}
export interface FormEventHandler extends EventHandler<React.FormEvent> {}
export interface KeyboardEventHandler extends EventHandler<React.KeyboardEvent> {}

// Component state management
export interface ComponentState<T = unknown> {
  loading: boolean;
  data: T | null;
  error: string | null;
  refetch: () => Promise<void>;
}

// File upload
export interface FileUploadState {
  files: UploadedFile[];
  progress: Record<string, number>;
  errors: Record<string, string>;
  addFiles: (files: FileList | File[]) => void;
  removeFile: (id: string) => void;
  clearAll: () => void;
  upload: (onProgress?: (id: string, progress: number) => void) => Promise<UploadedFile[]>;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  preview?: string;
  progress?: number;
  error?: string;
}