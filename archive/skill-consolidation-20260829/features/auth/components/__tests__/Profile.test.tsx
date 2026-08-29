import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Profile } from '../Profile';

describe('Profile', () => {
  it('renders without crashing', () => {
    const { container } = render(<Profile />);
    expect(container).toBeTruthy();
  });
});
