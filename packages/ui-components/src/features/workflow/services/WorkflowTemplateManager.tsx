import { WorkflowBuilder } from './WorkflowBuilder.js';
import { WorkflowDefinition, WorkflowStep } from '../types.js';

// Define a workflow template interface that extends the builder
interface WorkflowTemplate extends WorkflowBuilder {
  id: string;
  name: string;
  description: string;
  createWorkflow: (customSteps?: WorkflowStep[]) => WorkflowDefinition;
}

/**
 * Manages workflow templates that can be used to create new workflows
 */
export class WorkflowTemplateManager {
  private templates: Map<string, WorkflowTemplate> = new Map();
  
  constructor() {
    this.initializeDefaultTemplates();
  }
  
  private initializeDefaultTemplates() {
    // Example: Empty workflow template
    const emptyTemplate: WorkflowTemplate = {
      ...new WorkflowBuilder('empty', 'Empty Workflow'),
      id: 'empty',
      name: 'Empty Workflow',
      description: 'Start with a blank workflow',
      createWorkflow: () => {
        const builder = new WorkflowBuilder('empty', 'Empty Workflow');
        return builder.build();
      }
    };
    
    // Example: Data Processing workflow template
    const dataProcessingTemplate: WorkflowTemplate = {
      ...new WorkflowBuilder('data-processing', 'Data Processing'),
      id: 'data-processing',
      name: 'Data Processing',
      description: 'A template for processing data with standard steps',
      createWorkflow: (customSteps) => {
        const builder = new WorkflowBuilder('data-processing', 'Data Processing');
        
        // Add default steps for data processing
        builder.addStep({
          id: 'fetch-data',
          name: 'Fetch Data',
          type: 'action',
          action: 'http.request',
          parameters: { method: 'GET', url: '' }
        });
        
        builder.addStep({
          id: 'transform-data',
          name: 'Transform Data',
          type: 'action',
          action: 'data.transform',
          parameters: { transform: 'jsonata' },
          dependencies: ['fetch-data']
        });
        
        // Add custom steps if provided
        if (customSteps) {
          customSteps.forEach(step: WorkflowStep => builder.addStep(step));
        }
        
        return builder.build();
      }
    };
    
    // Example: Conditional workflow template
    const conditionalTemplate: WorkflowTemplate = {
      ...new WorkflowBuilder('conditional', 'Conditional Workflow'),
      id: 'conditional',
      name: 'Conditional Workflow',
      description: 'A template for workflows with conditional branches',
      createWorkflow: (customSteps) => {
        const builder = new WorkflowBuilder('conditional', 'Conditional Workflow');
        
        // Add default steps with conditions
        builder.addStep({
          id: 'start',
          name: 'Start',
          type: 'action',
          action: 'init.process',
          parameters: {}
        });
        
        builder.addStep({
          id: 'check-condition',
          name: 'Evaluate Condition',
          type: 'condition',
          action: 'condition.check',
          parameters: { expression: 'data.value > 10' },
          dependencies: ['start'],
          conditions: [
            { nextStepId: 'high-value', expression: 'result === true' },
            { nextStepId: 'low-value', expression: 'result === false' }
          ]
        });
        
        builder.addStep({
          id: 'high-value',
          name: 'Process High Value',
          type: 'action',
          action: 'process.high',
          parameters: {},
          dependencies: ['check-condition']
        });
        
        builder.addStep({
          id: 'low-value',
          name: 'Process Low Value',
          type: 'action',
          action: 'process.low',
          parameters: {},
          dependencies: ['check-condition']
        });
        
        // Add custom steps if provided
        if (customSteps) {
          customSteps.forEach(step: WorkflowStep => builder.addStep(step));
        }
        
        return builder.build();
      }
    };
    
    // Register default templates
    this.templates.set(emptyTemplate.id, emptyTemplate);
    this.templates.set(dataProcessingTemplate.id, dataProcessingTemplate);
    this.templates.set(conditionalTemplate.id, conditionalTemplate);
  }
  
  /**
   * Get all available workflow templates
   */
  getTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  }
  
  /**
   * Get a specific template by ID
   */
  getTemplate(id: string): WorkflowTemplate | undefined {
    return this.templates.get(id);
  }
  
  /**
   * Register a new template
   */
  registerTemplate(template: WorkflowTemplate): void {
    this.templates.set(template.id, template);
  }
  
  /**
   * Create a new workflow from a template
   */
  createFromTemplate(templateId: string, customSteps?: WorkflowStep[]): WorkflowDefinition {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    return template.createWorkflow(customSteps);
  }
}