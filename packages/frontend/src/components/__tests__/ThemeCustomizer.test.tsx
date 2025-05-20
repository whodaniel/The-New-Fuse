import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { ThemeProvider } from '../../contexts/ThemeContext.js';
import { ThemeCustomizer } from '../ThemeCustomizer.js';
import { axe } from 'jest-axe';

const customTheme = extendTheme({ colors: { brand: { 900: '#1a365d', 800: '#153e75', 700: '#2a69ac' } } });

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ChakraProvider theme={customTheme}>
      <ThemeProvider>
        {ui}
      </ThemeProvider>
    </ChakraProvider>
  );
};

describe('ThemeCustomizer', () => {
  test('renders without accessibility violations', async () => {
    const { container } = renderWithProviders(<ThemeCustomizer />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('renders theme options correctly', () => {
    renderWithProviders(<ThemeCustomizer />);
    expect(screen.getByText('Theme Customizer')).toBeInTheDocument();
    expect(screen.getByLabelText('Color Mode')).toBeInTheDocument();
    expect(screen.getByLabelText('Font Size')).toBeInTheDocument();
    expect(screen.getByLabelText('Reduce Motion')).toBeInTheDocument();
    expect(screen.getByLabelText('High Contrast')).toBeInTheDocument();
  });

  test('handles color mode changes via select', () => {
    renderWithProviders(<ThemeCustomizer />);
    const select = screen.getByLabelText('Color Mode');
    fireEvent.change(select, { target: { value: 'dark' } });
    expect(select).toHaveValue('dark');
  });

  test('handles font size changes via select', () => {
    renderWithProviders(<ThemeCustomizer />);
    const select = screen.getByLabelText('Font Size');
    fireEvent.change(select, { target: { value: 'lg' } });
    expect(select).toHaveValue('lg');
  });

  test('toggles reduced motion switch', () => {
    renderWithProviders(<ThemeCustomizer />);
    const toggle = screen.getByLabelText('Reduce Motion');
    fireEvent.click(toggle);
    expect(toggle).toBeChecked();
    fireEvent.click(toggle);
    expect(toggle).not.toBeChecked();
  });

  test('toggles high contrast switch', () => {
    renderWithProviders(<ThemeCustomizer />);
    const toggle = screen.getByLabelText('High Contrast');
    fireEvent.click(toggle);
    expect(toggle).toBeChecked();
    fireEvent.click(toggle);
    expect(toggle).not.toBeChecked();
  });
});