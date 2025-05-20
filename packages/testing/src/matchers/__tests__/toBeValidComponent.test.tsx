import React from 'react';
import { toBeValidComponent, ComponentValidator } from '../toBeValidComponent.js';

describe('toBeValidComponent', () => {
  const TestComponent = (props: any) => <div {...props} />;
  TestComponent.displayName = 'TestComponent';

  // Define WrongComponent to accept props
  const WrongComponent = (props: any) => <div {...props} />;
  WrongComponent.displayName = 'WrongComponent';

  const validator: ComponentValidator = {
    displayName: 'TestComponent',
    requiredProps: ['title'],
    props: {
      title: (value: any) => typeof value === 'string',
      count: (value: any) => typeof value === 'number'
    },
    childrenAllowed: false
  };

  it('should pass for valid component', async () => {
    const component = <TestComponent title="Test" count={5} />;
    const result = await toBeValidComponent.call({} as any, component, validator);
    expect(result.pass).toBe(true);
  });

  it('should fail for wrong display name', async () => {
    // Use the corrected WrongComponent definition
    const component = <WrongComponent title="Test" />;
    const result = await toBeValidComponent.call({} as any, component, validator);
    expect(result.pass).toBe(false);
  });

  it('should fail for missing required prop', async () => {
    const component = <TestComponent count={5} />;
    const result = await toBeValidComponent.call({} as any, component, validator);
    expect(result.pass).toBe(false);
  });

  it('should fail for invalid prop type', async () => {
    const component = <TestComponent title="Test" count="5" />;
    const result = await toBeValidComponent.call({} as any, component, validator);
    expect(result.pass).toBe(false);
  });

  it('should fail when children not allowed', async () => {
    const component = (
      <TestComponent title="Test" count={5}>
        <span>Child content</span>
      </TestComponent>
    );
    const result = await toBeValidComponent.call({} as any, component, validator);
    expect(result.pass).toBe(false);
  });

  it('should pass when children allowed', async () => {
    const validatorWithChildren = { ...validator, childrenAllowed: true };
    const component = (
      <TestComponent title="Test" count={5}>
        <span>Child content</span>
      </TestComponent>
    );
    const result = await toBeValidComponent.call({} as any, component, validatorWithChildren);
    expect(result.pass).toBe(true);
  });

  it('should handle non-React elements', async () => {
    // Pass null instead of {} for non-element test
    const result = await toBeValidComponent.call({} as any, null, validator);
    expect(result.pass).toBe(false);
  });
});