import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../ConsolidatedCard.js';

describe('Card', () => {
  it('renders correctly with default props', () => {
    render(
      <Card data-testid="card">
        <CardContent>Card Content</CardContent>
      </Card>
    );
    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('rounded-lg');
    expect(card).toHaveClass('border');
  });

  it('applies variant classes correctly', () => {
    render(
      <Card data-testid="card" variant="elevated">
        <CardContent>Card Content</CardContent>
      </Card>
    );
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('border-none');
    expect(card).toHaveClass('shadow-lg');
  });

  it('applies size classes correctly', () => {
    render(
      <Card data-testid="card" size="sm">
        <CardContent>Card Content</CardContent>
      </Card>
    );
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('p-4');
  });

  it('applies hover classes when hover is true', () => {
    render(
      <Card data-testid="card" hover={true}>
        <CardContent>Card Content</CardContent>
      </Card>
    );
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('transition-shadow');
    expect(card).toHaveClass('hover:shadow-lg');
  });

  it('applies clickable classes when clickable is true', () => {
    render(
      <Card data-testid="card" clickable={true}>
        <CardContent>Card Content</CardContent>
      </Card>
    );
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('cursor-pointer');
    expect(card).toHaveClass('active:scale-[0.99]');
  });

  it('renders with all subcomponents correctly', () => {
    render(
      <Card data-testid="card">
        <CardHeader data-testid="header">
          <CardTitle data-testid="title">Card Title</CardTitle>
          <CardDescription data-testid="description">Card Description</CardDescription>
        </CardHeader>
        <CardContent data-testid="content">Card Content</CardContent>
        <CardFooter data-testid="footer">Card Footer</CardFooter>
      </Card>
    );
    
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('title')).toBeInTheDocument();
    expect(screen.getByTestId('description')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
    expect(screen.getByText('Card Footer')).toBeInTheDocument();
  });

  it('forwards ref to the card element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Card ref={ref}>
        <CardContent>Ref Test</CardContent>
      </Card>
    );
    
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('DIV');
  });

  it('passes additional props to the card element', () => {
    render(
      <Card data-testid="card" aria-label="Test Card" role="region">
        <CardContent>Card Content</CardContent>
      </Card>
    );
    
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('aria-label', 'Test Card');
    expect(card).toHaveAttribute('role', 'region');
  });
});
