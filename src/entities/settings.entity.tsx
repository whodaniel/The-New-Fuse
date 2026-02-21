// filepath: src/entities/settings.entity.ts
import { BaseEntity } from './base.entity.js';

export interface Settings extends BaseEntity {
  key: string;
  value: unknown;
  scope: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface UserSettings {
  userId: string;
  preferences: Record<string, any>;
  notifications: Record<string, boolean>;
  theme: string;
  language: string;
}

export interface SystemSettings {
  maintenance: boolean;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  apiKeys: Record<string, string>;
}
