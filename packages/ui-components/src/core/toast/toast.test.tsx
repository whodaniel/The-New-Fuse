import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Toast, ToastProvider, useToast } from './index.js';

// Mock timer
jest.useFakeTimers();

describe('Toast Component', () => {
  test('renders toast with title and description', () => {
    render(
      <Toast
        title="Test Title"
        description="Test Description"
        data-testid="toast"
      />
    );

    expect(screen.getByTestId('toast')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  test('applies correct variant styles', () => {
    const { rerender } = render(
      <Toast
        title="Success Toast"
        variant="success"
        data-testid="toast"
      />
    );

    const toast = screen.getByTestId('toast');
    expect(toast).toHaveClass('bg-green-50');

    rerender(
      <Toast
        title="Error Toast"
        variant="destructive"
        data-testid="toast"
      />
    );

    expect(toast).toHaveClass('bg-destructive');
  });

  test('renders with custom action', () => {
    const handleAction = jest.fn();
    render(
      <Toast
        title="Toast with Action"
        action={<button onClick={handleAction} data-testid="action-button">Action</button>}
        data-testid="toast"
      />
    );

    const actionButton = screen.getByTestId('action-button');
    expect(actionButton).toBeInTheDocument();
    
    fireEvent.click(actionButton);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });
});

// Test component for useToast hook
const ToastTester = () => {
  const { toast, dismiss, toasts } = useToast();
  
  return (
    <div>
      <button 
        onClick={() => toast({ title: 'Test Toast', variant: 'success' })}
        data-testid="show-toast"
      >
        Show Toast
      </button>
      <button 
        onClick={() => dismiss(toasts[0]?.id)}
        data-testid="dismiss-toast"
      >
        Dismiss Toast
      </button>
      <div data-testid="toast-count">{toasts.length}</div>
    </div>
  );
};

describe('Toast Provider and Hook', () => {
  test('creates and dismisses toasts', () => {
    render(
      <ToastProvider>
        <ToastTester />
      </ToastProvider>
    );

    // Initially no toasts
    expect(screen.getByTestId('toast-count').textContent).toBe('0');
    
    // Show a toast
    fireEvent.click(screen.getByTestId('show-toast'));
    expect(screen.getByTestId('toast-count').textContent).toBe('1');
    
    // Dismiss the toast
    fireEvent.click(screen.getByTestId('dismiss-toast'));
    expect(screen.getByTestId('toast-count').textContent).toBe('0');
  });

  test('auto-dismisses toasts after duration', () => {
    render(
      <ToastProvider>
        <ToastTester />
      </ToastProvider>
    );

    // Show a toast (default duration)
    fireEvent.click(screen.getByTestId('show-toast'));
    expect(screen.getByTestId('toast-count').textContent).toBe('1');
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    // Toast should be auto-dismissed
    expect(screen.getByTestId('toast-count').textContent).toBe('0');
  });
});
