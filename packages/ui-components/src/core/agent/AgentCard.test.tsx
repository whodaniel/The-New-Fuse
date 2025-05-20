import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentCard, AgentCardProps } from './AgentCard.js';

describe('AgentCard', () => {
  const baseProps: AgentCardProps = {
    agent: {
      id: 'agent-1',
      name: 'Test Agent',
      description: 'A test agent',
      status: 'active',
      type: 'CONVERSATIONAL',
      capabilities: ['code-generation', 'chat'],
      metadata: { version: '1.0.0', lastActive: new Date() },
    },
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  it('renders agent name and description', () => {
    render(<AgentCard {...baseProps} />);
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.getByText('A test agent')).toBeInTheDocument();
  });

  it('renders agent capabilities', () => {
    render(<AgentCard {...baseProps} />);
    expect(screen.getByText('code-generation')).toBeInTheDocument();
    expect(screen.getByText('chat')).toBeInTheDocument();
  });

  it('calls onEdit when Edit button is clicked', () => {
    render(<AgentCard {...baseProps} />);
    fireEvent.click(screen.getByText(/Edit/i));
    expect(baseProps.onEdit).toHaveBeenCalledWith('agent-1');
  });

  it('calls onDelete when Delete button is clicked', () => {
    render(<AgentCard {...baseProps} />);
    fireEvent.click(screen.getByText(/Delete/i));
    expect(baseProps.onDelete).toHaveBeenCalledWith('agent-1');
  });
});
