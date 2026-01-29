import { DashboardLayout, DashboardWidget } from '../types';

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: 'analytics' | 'monitoring' | 'development' | 'custom';
  thumbnail?: string;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  tags: string[];
  author: {
    name: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardPreset {
  id: string;
  name: string;
  description: string;
  templateId: string;
  config: Record<string, unknown>;
  isDefault?: boolean;
}
