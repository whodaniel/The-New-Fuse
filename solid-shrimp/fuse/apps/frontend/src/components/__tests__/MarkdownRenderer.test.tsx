import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MarkdownRenderer from '../MarkdownRenderer';

describe('MarkdownRenderer', () => {
  it('renders markdown content correctly', () => {
    const content = '# Hello World\n\nThis is a *test*.';
    render(<MarkdownRenderer content={content} />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Hello World');

    // Use a regex to match the text partially
    expect(screen.getByText(/This is a/)).toBeInTheDocument();
    expect(screen.getByText(/test/)).toBeInTheDocument();
  });

  it('renders code blocks correctly', () => {
    const content = '```javascript\nconsole.log("test");\n```';
    const { container } = render(<MarkdownRenderer content={content} />);

    // Check if code content is rendered
    expect(container.textContent).toContain('console.log("test")');
  });
});
