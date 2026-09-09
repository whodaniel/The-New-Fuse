export type DynamicUIElementType =
  | 'container'
  | 'metric'
  | 'slider'
  | 'input'
  | 'select'
  | 'toggle'
  | 'button'
  | 'progress'
  | 'table'
  | 'badge'
  | 'html-artifact';

export interface DynamicUIElement {
  id: string;
  type: DynamicUIElementType;
  label?: string;
  value?: any;
  options?: { label: string; value: any }[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  children?: DynamicUIElement[];
  props?: Record<string, any>;
  actionType?: string;
  actionPayload?: Record<string, any>;
}

export interface DynamicUISchema {
  id: string;
  title: string;
  description?: string;
  version: string;
  layout: 'grid' | 'stack' | 'tabs' | 'flow';
  elements: DynamicUIElement[];
  metadata?: {
    agentId?: string;
    generatedAt?: string;
    taskContext?: string;
  };
}

export interface DynamicUIEvent {
  elementId: string;
  eventType: 'change' | 'click' | 'submit' | 'toggle';
  value?: any;
  schemaId: string;
  timestamp: string;
}
