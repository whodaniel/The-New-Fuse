import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SpeechToText from '../SpeechToText';

describe('SpeechToText', () => {
  it('renders with appropriate aria-labels', () => {
    // Mock webkitSpeechRecognition
    (window as any).webkitSpeechRecognition = vi.fn();

    render(<SpeechToText />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Start voice input');
  });
});
