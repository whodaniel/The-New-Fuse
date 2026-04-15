/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from '../ui/input';

describe('Input Component', () => {
  it('renders with a label and associates it correctly', () => {
    render(<Input label="Email Address" id="email" />);

    // Check if label exists and is associated with the input
    const input = screen.getByLabelText('Email Address');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('id', 'email');
  });

  it('renders helper text and associates it via aria-describedby', () => {
    render(<Input label="Password" helperText="Must be at least 8 characters" />);

    const input = screen.getByLabelText('Password');
    const helperText = screen.getByText('Must be at least 8 characters');

    // Check if input has aria-describedby pointing to helper text's ID
    expect(input).toHaveAttribute('aria-describedby');
    const describedBy = input.getAttribute('aria-describedby');
    expect(helperText).toHaveAttribute('id', describedBy);
  });

  it('sets aria-invalid when error is true', () => {
    render(<Input label="Username" error />);

    const input = screen.getByLabelText('Username');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not set aria-invalid when error is false', () => {
    render(<Input label="Username" />);

    const input = screen.getByLabelText('Username');
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('generates a unique ID if none is provided', () => {
    render(<Input label="Generated ID Test" />);

    const input = screen.getByLabelText('Generated ID Test');
    expect(input).toHaveAttribute('id');
    expect(input.id).not.toBe('');
  });
});
