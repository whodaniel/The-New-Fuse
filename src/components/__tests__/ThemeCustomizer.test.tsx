import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { ThemeProvider } from '../../contexts/ThemeContext.js';
import { ThemeCustomizer } from '../ThemeCustomizer.js';

describe('ThemeCustomizer', () => {
  const renderWithTheme = (component: React.ReactNode) => {
    return render(
      <ThemeProvider>
        {component}
      </ThemeProvider>
    );
  };

  it('renders theme options', () => {
    renderWithTheme(<ThemeCustomizer />);
    expect(screen.getByText(/Light/i)).toBeInTheDocument();
    expect(screen.getByText(/Dark/i)).toBeInTheDocument();
    expect(screen.getByText(/System/i)).toBeInTheDocument();
  });

  it('changes theme when option is clicked', () => {
    renderWithTheme(<ThemeCustomizer />);
    const darkButton = screen.getByText(/Dark/i);
    fireEvent.click(darkButton);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});