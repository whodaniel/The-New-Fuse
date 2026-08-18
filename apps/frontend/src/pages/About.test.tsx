import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import About from './About';

describe('About page', () => {
  it('renders heading', () => {
    render(<About />);
    expect(screen.getByText(/About The New Fuse/i)).toBeInTheDocument();
  });

  it('renders back to home link', () => {
    render(<About />);
    expect(screen.getByText(/Back to home/i)).toBeInTheDocument();
  });
});
