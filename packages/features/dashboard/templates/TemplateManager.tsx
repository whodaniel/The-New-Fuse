import { DashboardState } from '../collaboration/types';

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  category: string;
  tags: string[];
  state: DashboardState;
  creator: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt?: Date;
  usageCount: number;
  isPublic: boolean;
  variables: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
    description: string;
    defaultValue?: unknown;
    required: boolean;
  }>;
  version: string;
  lastUsedAt?: Date;
}

export class TemplateManager {
  private templates: Map<string, Template>;
  private storage: Storage;
  private storageKey: string;

  constructor(
    storage: Storage = typeof localStorage !== 'undefined' ? localStorage : ({} as any),
    storageKey = 'dashboard_templates'
  ) {
    this.templates = new Map();
    this.storage = storage;
    this.storageKey = storageKey;
    this.loadTemplates();
  }

  public createTemplate(
    template: Omit<Template, 'id' | 'createdAt' | 'usageCount' | 'version'>
  ): string {
    const id = Math.random().toString(36).substr(2, 9);
    const newTemplate: Template = {
      ...template,
      id,
      createdAt: new Date(),
      usageCount: 0,
      version: '1.0.0',
    };

    this.templates.set(id, newTemplate);
    this.saveTemplates();
    return id;
  }

  private loadTemplates(): void {
    if (this.storage && typeof this.storage.getItem === 'function') {
      const saved = this.storage.getItem(this.storageKey);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          Object.entries(data).forEach(([id, t]: [string, any]) => {
            this.templates.set(id, {
              ...t,
              createdAt: new Date(t.createdAt),
              updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
              lastUsedAt: t.lastUsedAt ? new Date(t.lastUsedAt) : undefined,
            });
          });
        } catch (e) {
          console.error('Failed to load templates', e);
        }
      }
    }
  }

  private saveTemplates(): void {
    if (this.storage && typeof this.storage.setItem === 'function') {
      const data = Object.fromEntries(this.templates);
      this.storage.setItem(this.storageKey, JSON.stringify(data));
    }
  }

  public getTemplates(): Template[] {
    return Array.from(this.templates.values());
  }

  public getTemplate(id: string): Template | undefined {
    return this.templates.get(id);
  }
}
