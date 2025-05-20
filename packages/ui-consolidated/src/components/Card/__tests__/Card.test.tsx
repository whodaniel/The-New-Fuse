import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../Card.js';

describe('Card', () => {
  it('renders correctly', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders with title and description', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Card Content</CardContent>
      </Card>
    );
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('renders with footer', () => {
    render(
      <Card>
        <CardContent>Card Content</CardContent>
        <CardFooter>Card Footer</CardFooter>
      </Card>
    );
    expect(screen.getByText('Card Content')).toBeInTheDocument();
    expect(screen.getByText('Card Footer')).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    render(<Card className="custom-class">Card content</Card>);
    expect(screen.getByText('Card content').parentElement).toHaveClass('custom-class');
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Card variant="default">Default Card</Card>);
    expect(screen.getByText('Default Card').parentElement).toHaveClass('bg-card');

    rerender(<Card variant="outline">Outline Card</Card>);
    expect(screen.getByText('Outline Card').parentElement).toHaveClass('border');
  });

  it('renders with different paddings', () => {
    const { rerender } = render(<Card padding="default">Default Padding</Card>);
    expect(screen.getByText('Default Padding').parentElement).toHaveClass('p-6');

    rerender(<Card padding="sm">Small Padding</Card>);
    expect(screen.getByText('Small Padding').parentElement).toHaveClass('p-4');

    rerender(<Card padding="lg">Large Padding</Card>);
    expect(screen.getByText('Large Padding').parentElement).toHaveClass('p-8');

    rerender(<Card padding="none">No Padding</Card>);
    expect(screen.getByText('No Padding').parentElement).toHaveClass('p-0');
  });

  it('renders with hover effect', () => {
    render(<Card hover>Hover Card</Card>);
    expect(screen.getByText('Hover Card').parentElement).toHaveClass('hover:shadow-md');
  });
});
