import React from 'react';
import { create } from 'react-test-renderer';
import { ThemeProvider } from '@/shared/providers/theme/ThemeProvider';

interface SnapshotWrapperProps {
  theme?: 'light' | 'dark';
  children: React.ReactNode;
}

const SnapshotWrapper: React.React.FC<SnapshotWrapperProps> = ({ 
  theme = 'light',
  children 
}) => (
  <ThemeProvider defaultTheme={theme} storageKey="test-theme">
    {children}
  </ThemeProvider>
);

export const createSnapshot = (ui: React.ReactElement, options: { theme?: 'light' | 'dark' } = {}) => {
  const { theme = 'light' } = options;
  return create(
    <SnapshotWrapper theme={theme}>
      {ui}
    </SnapshotWrapper>
  );
};

export const updateSnapshot = (renderer: ReturnType<typeof create>) => {
  expect(renderer.toJSON()).toMatchSnapshot();
};

export const assertSnapshot = (ui: React.ReactElement, options?: { theme?: 'light' | 'dark' }) => {
  const renderer = createSnapshot(ui, options);
  updateSnapshot(renderer);
  return renderer;
};