import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Dropdown, DropdownOption } from '../Dropdown';

// Mock the Icon component since it's used in Dropdown
jest.mock('../../Icon', () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`}>{name}</span>
}));

const mockOptions: DropdownOption[] = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2', icon: 'settings' },
  { value: 'option3', label: 'Option 3', disabled: true },
];

describe('Dropdown Component', () => {
  it('renders correctly with placeholder', () => {
    render(<Dropdown options={mockOptions} placeholder="Select item" />);
    expect(screen.getByText('Select item')).toBeInTheDocument();
  });

  it('renders with label if provided', () => {
    render(<Dropdown options={mockOptions} label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('opens dropdown menu when clicked', () => {
    render(<Dropdown options={mockOptions} />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('selects an option and closes dropdown', () => {
    const handleChange = jest.fn();
    render(<Dropdown options={mockOptions} onChange={handleChange} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const option1 = screen.getByText('Option 1');
    fireEvent.click(option1);

    expect(handleChange).toHaveBeenCalledWith('option1');
    expect(screen.getByText('Option 1')).toBeInTheDocument();

    // Dropdown should be closed (Option 2 should not be visible)
    // Note: queryByText returns null if not found
    expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
  });

  it('does not select disabled options', () => {
    const handleChange = jest.fn();
    render(<Dropdown options={mockOptions} onChange={handleChange} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const option3 = screen.getByText('Option 3');
    fireEvent.click(option3);

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('displays selected value from props', () => {
    render(<Dropdown options={mockOptions} value="option2" />);
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('renders error message when error prop is provided', () => {
    render(<Dropdown options={mockOptions} error="Required field" />);
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    const handleChange = jest.fn();
    render(<Dropdown options={mockOptions} disabled onChange={handleChange} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });
});
