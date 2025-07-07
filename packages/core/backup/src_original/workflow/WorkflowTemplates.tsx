import * as templates from './templates';

export const workflowTemplates = templates as const;
export type WorkflowTemplateType = keyof typeof workflowTemplates;
