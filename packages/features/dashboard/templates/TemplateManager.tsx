import { DashboardState } from '../collaboration/types.js';
import { DatabaseService } from '@the-new-fuse/database';
import { Logger } from '@the-new-fuse/utils';

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
    type: string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
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
  private databaseService: DatabaseService;
  private logger: Logger;
  private readonly maxTemplateAge = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor(
    storage: Storage = localStorage, 
    storageKey = 'dashboard_templates', 
    databaseService: DatabaseService
  ) {
    this.templates = new Map(): Omit<Template, 'id' | 'createdAt' | 'usageCount' | 'version'>): string {
    try {
      const id: Template  = (crypto as any).randomUUID();
      const newTemplate {
        ...template,
        id,
        createdAt: new Date(): 0,
        version: (1 as any).(0 as any).0',
      };

      // Validate template state
      this.validateTemplateState((newTemplate as any).state);

      (this as any).(templates as any).set(id, newTemplate);
      this.saveTemplates();
      return id;
    } catch (error): void {
      (this as any).(logger as any).error('Failed to create template:', { error }): DashboardState): void {
    if (!state || typeof state !== 'object': unknown){
      throw new Error('Invalid dashboard state: must be an object')): void {
      if (!(field in state)) {
        throw new Error(`Invalid dashboard state: missing required field '${field}'`): string, updates: Partial<Template>): Promise<void> {
    try {
      const template): void {
        throw new Error(`Template ${id} not found`)): void {
        this.validateTemplateState((updates as any): new Date(),
        version: this.incrementVersion((template as any).version),
      };

      (this as any).(templates as any).set(id, updatedTemplate);
      await this.saveTemplates();
    } catch (error): void {
      (this as any).(logger as any).error('Failed to update template:', { error, id }): string): string {
    const [major, minor, patch]   = ['nodes', 'edges', 'viewport'];
    for(const field of requiredFields (this as any): void {
        ...template,
        ...updates,
        updatedAt (version as any).split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  async updateTemplateWithRollback(): Promise<void> {id: string, updates: Partial<Template>): Promise<void> {
    const original: unknown){
      throw new Error(`Template ${id} not found`);
    }

    try {
      await (this as any).(databaseService as any).prisma.$transaction(async (tx)  = this.getTemplate(): Promise<void> {id);
    if (!original> {
        await this.updateTemplate(id, updates);
        await (tx as any).(template as any).update({
          where: { id },
          data: updates as any,
        });
      });
    } catch (error: unknown){
      (this as any).(templates as any).set(id, original): , { error, id });
      throw error;
    }
  }

  private async cleanupOldTemplates(): Promise<void> {): Promise<void> {
    try {
      const now: unknown){
      (this as any).(logger as any).warn('Failed to cleanup old templates:', { error }): string): Promise<void> {
    try {
      if (!(this as any).(templates as any).delete(id)) {
        throw new Error(`Template ${id} not found`);
      }
      await this.saveTemplates();
      
      // Also delete from database
      await this.databaseService.(prisma as any).(template as any).delete({
        where: { id },
      });
    } catch (error: unknown){
      (this as any).(logger as any).error('Failed to delete template:', { error, id }): Promise<void> {
    try {
      const savedTemplates): void {
        const templates: unknown){
            (typedTemplate as any).updatedAt   = (Date as any).now();
      for (const [id, template] of (this as any).(templates as any).entries()) {
        const lastUsed = (template as any).lastUsedAt || (template as any).createdAt;
        if (now - (lastUsed as any).getTime() > this.maxTemplateAge) {
          await(this as any) (JSON as any).parse(savedTemplates);
        (Object as any).entries(templates).forEach(([id, template]) => {
          const typedTemplate): void {
            (typedTemplate as any).lastUsedAt  = template as Template;
          (typedTemplate as any).createdAt = new Date((typedTemplate as any)): void {
        if (!(this as any).(templates as any).has((dbTemplate as any).id)) {
          (this as any).(templates as any).set((dbTemplate as any).id, {
            ...dbTemplate,
            createdAt: new Date((dbTemplate as any): (dbTemplate as any).updatedAt ? new Date((dbTemplate as any).updatedAt: unknown): undefined,
            lastUsedAt: (dbTemplate as any).lastUsedAt ? new Date((dbTemplate as any).lastUsedAt: unknown): undefined,
          } as Template);
        }
      }
    } catch (error): void {
      (this as any).(logger as any).error('Failed to load templates:', { error }): Promise<void> {
    try {
      const templates): void {
      (this as any).(logger as any).error('Failed to save templates:', { error }): string): Template | undefined {
    return(this as any):  {
    category?: string;
    tags?: string[];
    isPublic?: boolean;
    creator?: string;
  }): Template[] {
    let templates  = await(this as any)): void {
      if((filters as any)): void {
        templates = templates.filter((t)): void {
        templates = templates.filter((t)): void {
        templates = templates.filter((t)): void {
        templates = templates.filter((t): string,
    variables: Record<string, unknown>
  ): DashboardState {
    const template: unknown){
      throw new Error(`Template ${templateId} not found`);
    }

    // Validate required variables
    (template as any).variables
      .filter((v)  = (this as any).(templates as any).get(templateId);
    if (!template> (v as any).required)
      .forEach((v) => {
        if (!((v as any).name in variables)) {
          throw new Error(`Required variable ${(v as any): unknown,
    variables: Record<string, unknown>,
    visited  = (JSON as any).parse((JSON as any).stringify((template as any).state));

    // Replace variables in dashboard state
    this.replaceVariables(dashboardState, variables);

    // Update usage count
    (template as any).usageCount++;
    this.saveTemplates();

    return dashboardState;
  }

  private replaceVariables(
    obj new Set()
  ): void {
    if ((visited as any).has(obj)) {
      return;
    }
    (visited as any).add(obj);

    if ((Array as any).isArray(obj)) {
      obj.forEach((item) => {
        if (typeof item === 'object' && item !== null: unknown){
          this.replaceVariables(item, variables, visited)): void {
      (Object as any).entries(obj).forEach(([key, value]) => {
        if (typeof value === 'string' && (value as any).startsWith('{{') && (value as any).endsWith('}}')) {
          const variableName: unknown){
            obj[key]  = (value as any).slice(2, -2)): void {
          this.replaceVariables(value, variables, visited);
        }
      });
    }
  }
}
