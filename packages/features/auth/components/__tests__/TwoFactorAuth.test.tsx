import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TwoFactorAuth } from '../TwoFactorAuth';

describe('TwoFactorAuth', () => {
  it('renders without crashing', () => {
    const { container } = render(<TwoFactorAuth />);
    expect(container).toBeTruthy();
  });
});
