import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card } from './Card.js';

describe('Card', () => {
  it('renders correctly', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    render(<Card className="custom-class">Card content</Card>);
    const card = screen.getByText('Card content').parentElement;
    expect(card).toHaveClass('custom-class');
  });

  it('renders with additional props', () => {
    render(<Card data-testid="test-card">Card content</Card>);
    expect(screen.getByTestId('test-card')).toBeInTheDocument();
  });

  it('renders Card.Header correctly', () => {
    render(
      <Card>
        <Card.Header>Header content</Card.Header>
      </Card>
    );
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('renders Card.Title correctly', () => {
    render(
      <Card>
        <Card.Header>
          <Card.Title>Card title</Card.Title>
        </Card.Header>
      </Card>
    );
    expect(screen.getByText('Card title')).toBeInTheDocument();
  });

  it('renders Card.Description correctly', () => {
    render(
      <Card>
        <Card.Header>
          <Card.Description>Card description</Card.Description>
        </Card.Header>
      </Card>
    );
    expect(screen.getByText('Card description')).toBeInTheDocument();
  });

  it('renders Card.Content correctly', () => {
    render(
      <Card>
        <Card.Content>Content area</Card.Content>
      </Card>
    );
    expect(screen.getByText('Content area')).toBeInTheDocument();
  });

  it('renders Card.Footer correctly', () => {
    render(
      <Card>
        <Card.Footer>Footer content</Card.Footer>
      </Card>
    );
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('renders a complete card with all subcomponents', () => {
    render(
      <Card>
        <Card.Header>
          <Card.Title>Card Title</Card.Title>
          <Card.Description>Card Description</Card.Description>
        </Card.Header>
        <Card.Content>
          <p>Main content</p>
        </Card.Content>
        <Card.Footer>
          <button>Action</button>
        </Card.Footer>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Main content')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });
});
