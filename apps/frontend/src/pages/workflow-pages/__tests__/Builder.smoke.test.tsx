import { AuthProvider } from '@/providers/AuthProvider';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BuilderPage from '../Builder';

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // React Flow expects a constructor-style ResizeObserver in test environment.
  (globalThis as any).ResizeObserver = ResizeObserverMock;
});

describe('Workflow Builder Page', () => {
  it('renders without crashing', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <BuilderPage />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('Workflow Canvas')).toBeInTheDocument();
  });
});
