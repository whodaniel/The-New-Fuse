import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { ModalCloseButton as DSModalCloseButton } from '../design-system';
import { ModalCloseButton } from '../modal';

describe('ModalCloseButton Accessibility', () => {
  it('ModalCloseButton (from modal.tsx) has aria-label="Close"', () => {
    render(<ModalCloseButton />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Close');
  });

  it('ModalCloseButton (from design-system.tsx) has aria-label="Close"', () => {
    render(<DSModalCloseButton />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Close');
  });
});
