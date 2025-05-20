import { setupTestMatchers } from './.js';
import { z } from 'zod';

// Set up custom matchers
setupTestMatchers();

describe('Custom Matchers Example', () => {
  it('demonstrates workflow validation', () => {
    const workflow = {
      id: '123',
      name: 'Test Workflow',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      steps: [
        {
          id: 'step1',
          name: 'First Step',
          status: 'pending'
        }
      ]
    };

    expect(workflow).toBeValidWorkflow();
  });

  it('demonstrates permission checking', () => {
    const user = {
      id: 'user1',
      permissions: ['read:posts'],
      roles: [{ name: 'editor', permissions: ['edit:posts'] }]
    };

    expect(user).toHavePermission('read:posts');
    expect(user).toHavePermission('edit:posts');
  });

  it('demonstrates API contract validation', () => {
    const response = {
      status: 200,
      headers: { 'content-type': 'application/json' },
      data: { id: '123', name: 'Test User' }
    };

    const contract = {
      status: 200,
      headers: { 'content-type': 'application/json' },
      schema: z.object({ id: z.string(), name: z.string() })
    };

    expect(response).toMatchAPIContract(contract);
  });

  it('demonstrates component validation', () => {
    const TestComponent = (props: any): any => <div {...props} />;
    TestComponent.displayName = 'TestComponent';

    const component = <TestComponent title="Test" />;
    
    expect(component).toBeValidComponent({
      displayName: 'TestComponent',
      requiredProps: ['title'],
      childrenAllowed: false
    });
  });

  it('demonstrates timing validation', async () => {
    const fastOperation = Promise.resolve('done');
    await expect(fastOperation).toCompleteWithinTime(100);

    const slowOperation = new Promise(resolve => setTimeout(resolve, 1000));
    await expect(slowOperation).not.toCompleteWithinTime(100);
  });
});