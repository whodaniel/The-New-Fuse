import { toBeValidWorkflow } from '../toBeValidWorkflow.js';
import { WorkflowStatus } from '@the-new-fuse/core';

describe('toBeValidWorkflow', () => {
  const validWorkflow = {
    id: '123',
    name: 'Test Workflow',
    status: WorkflowStatus.PENDING,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: 'step1',
        name: 'First Step',
        status: WorkflowStatus.PENDING
      }
    ]
  };

  it('should pass for valid workflow', async () => {
    const result = await toBeValidWorkflow.call({} as any, validWorkflow);
    expect(result.pass).toBe(true);
  });

  it('should fail for invalid workflow missing required fields', async () => {
    const invalidWorkflow = {
      name: 'Test Workflow'
    };
    const result = await toBeValidWorkflow.call({} as any, invalidWorkflow);
    expect(result.pass).toBe(false);
  });

  it('should fail for workflow with invalid status', async () => {
    const invalidWorkflow = {
      ...validWorkflow,
      status: 'invalid-status'
    };
    const result = await toBeValidWorkflow.call({} as any, invalidWorkflow);
    expect(result.pass).toBe(false);
  });

  it('should fail for workflow with invalid step structure', async () => {
    const invalidWorkflow = {
      ...validWorkflow,
      steps: [{ id: 'step1' }] // Missing required name and status
    };
    const result = await toBeValidWorkflow.call({} as any, invalidWorkflow);
    expect(result.pass).toBe(false);
  });
});