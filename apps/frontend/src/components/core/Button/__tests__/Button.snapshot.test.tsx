import React from 'react';
import { assertSnapshot } from '@/test/helpers/snapshot';
import { Button } from '../Button.js';

describe('Button Snapshots', () => {
  it('renders default button correctly', () => {
    assertSnapshot(<Button>Click me</Button>);
  });

  it('renders different variants correctly', () => {
    assertSnapshot(
      <>
        <Button variant="default">Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </>
    );
  });

  it('renders different sizes correctly', () => {
    assertSnapshot(
      <>
        <Button size="default">Default Size</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button size="icon">
          <svg data-testid="test-icon" viewBox="0 0 24 24" />
        </Button>
      </>
    );
  });

  it('renders loading state correctly', () => {
    assertSnapshot(
      <>
        <Button isLoading>Loading Button</Button>
        <Button isLoading variant="destructive">
          Loading Destructive
        </Button>
      </>
    );
  });

  it('renders disabled state correctly', () => {
    assertSnapshot(
      <>
        <Button disabled>Disabled Button</Button>
        <Button disabled variant="destructive">
          Disabled Destructive
        </Button>
      </>
    );
  });

  it('renders with start and end icons', () => {
    const TestIcon = () => (
      <svg data-testid="test-icon" viewBox="0 0 24 24" />
    );

    assertSnapshot(
      <>
        <Button>
          <TestIcon />
          With Start Icon
        </Button>
        <Button>
          With End Icon
          <TestIcon />
        </Button>
      </>
    );
  });
});