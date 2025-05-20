import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext.js';

describe('ThemeContext', () => {
  const TestComponent = () => {
    const { theme, updateTheme } = useTheme();
    
    return (
      <div>
        <div data-testid="theme-value">{JSON.stringify(theme)}</div>
        <button onClick={() => updateTheme({ fontFamily: 'roboto' })}>
          Update Font
        </button>
      </div>
    );
  };

  it('provides theme context to children', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value')).toBeInTheDocument();
  });

  it('allows updating theme values', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const initialTheme = JSON.parse(screen.getByTestId('theme-value').textContent || '{}');
    fireEvent.click(screen.getByText('Update Font'));
    const updatedTheme = JSON.parse(screen.getByTestId('theme-value').textContent || '{}');

    expect(updatedTheme.fontFamily).toBe('roboto');
    expect(updatedTheme).not.toEqual(initialTheme);
  });
});