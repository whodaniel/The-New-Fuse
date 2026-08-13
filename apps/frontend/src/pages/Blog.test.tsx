import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Blog from './Blog';

describe('Blog page', () => {
  it('renders heading', () => {
    render(<Blog />);
    expect(screen.getByText(/Blog/i)).toBeInTheDocument();
  });

  it('renders blog posts', () => {
    render(<Blog />);
    expect(screen.getByText(/TNF Launch/i)).toBeInTheDocument();
  });
});
