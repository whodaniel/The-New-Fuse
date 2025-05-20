import { z } from 'zod';

// Node data schema
const nodeDataSchema = z.object({
  name: z.string().optional(),
  label: z.string().optional(),
  type: z.string(),
  status: z.enum(['idle', 'running', 'completed', 'failed']).optional(),
  config: z.record(z.any()).optional(),
  onUpdate: z.function().optional()
});

// Node schema
const nodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  data: nodeDataSchema,
  width: z.number().optional(),
  height: z.number().optional(),
  selected: z.boolean().optional(),
  positionAbsolute: z.object({
    x: z.number(),
    y: z.number()
  }).optional(),
  dragging: z.boolean().optional()
});

// Edge schema
const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().nullable().optional(),
  targetHandle: z.string().nullable().optional(),
  type: z.string().optional(),
  animated: z.boolean().optional(),
  label: z.string().optional(),
  style: z.record(z.any()).optional(),
  data: z.record(z.any()).optional()
});

// Workflow schema
const workflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
  version: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional()
});

// Workflow execution schema
const workflowExecutionSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'aborted']),
  startTime: z.number(),
  endTime: z.number().optional(),
  nodeResults: z.record(z.any()),
  error: z.string().optional(),
  metrics: z.object({
    totalExecutionTime: z.number().optional(),
    nodeExecutionTimes: z.record(z.number()).optional(),
    successRate: z.number().optional()
  }).optional()
});

/**
 * Validates a workflow against the schema
 * @param workflow The workflow to validate
 * @returns The validated workflow or throws an error
 */
export function validateWorkflow(workflow: any) {
  return workflowSchema.parse(workflow);
}

/**
 * Validates a workflow execution against the schema
 * @param execution The workflow execution to validate
 * @returns The validated workflow execution or throws an error
 */
export function validateWorkflowExecution(execution: any) {
  return workflowExecutionSchema.parse(execution);
}

/**
 * Checks if a workflow is valid
 * @param workflow The workflow to check
 * @returns True if the workflow is valid, false otherwise
 */
export function isWorkflowValid(workflow: any): boolean {
  try {
    validateWorkflow(workflow);
    return true;
  } catch (error) {
    console.error('Workflow validation error:', error);
    return false;
  }
}

/**
 * Gets validation errors for a workflow
 * @param workflow The workflow to validate
 * @returns An array of validation errors or null if the workflow is valid
 */
export function getWorkflowValidationErrors(workflow: any): z.ZodError | null {
  try {
    validateWorkflow(workflow);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error;
    }
    return null;
  }
}

export type Workflow = z.infer<typeof workflowSchema>;
export type WorkflowExecution = z.infer<typeof workflowExecutionSchema>;
export type WorkflowNode = z.infer<typeof nodeSchema>;
export type WorkflowEdge = z.infer<typeof edgeSchema>;
