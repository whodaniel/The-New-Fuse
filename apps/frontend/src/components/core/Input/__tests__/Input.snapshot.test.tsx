import React from 'react';
import { assertSnapshot } from '@/test/helpers/snapshot';
import { Input } from '../Input.js';

describe('Input Snapshots', () => {
  it('renders default input correctly', () => {
    assertSnapshot(<Input placeholder="Enter text..." />);
  });

  it('renders with label correctly', () => {
    assertSnapshot(
      <div className="space-y-2">
        <label htmlFor="test-input">Label Text</label>
        <Input id="test-input" placeholder="Labeled input" />
      </div>
    );
  });

  it('renders with error state correctly', () => {
    assertSnapshot(
      <div className="space-y-2">
        <Input error="This field is required" placeholder="Error input" />
        <span className="text-sm text-red-500">This field is required</span>
      </div>
    );
  });

  it('renders disabled state correctly', () => {
    assertSnapshot(<Input disabled placeholder="Disabled input" />);
  });

  it('renders with different types correctly', () => {
    assertSnapshot(
      <>
        <Input type="text" placeholder="Text input" />
        <Input type="password" placeholder="Password input" />
        <Input type="email" placeholder="Email input" />
        <Input type="number" placeholder="Number input" />
        <Input type="search" placeholder="Search input" />
      </>
    );
  });

  it('renders with prefix and suffix correctly', () => {
    assertSnapshot(
      <>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <Input className="pl-7" placeholder="Amount" type="number" />
        </div>
        <div className="relative">
          <Input className="pr-12" placeholder="Weight" type="number" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">kg</span>
        </div>
      </>
    );
  });
});