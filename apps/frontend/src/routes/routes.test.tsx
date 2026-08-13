import { AuthProvider } from '@/providers/AuthProvider';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './index';

const renderRoutes = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>
  );

describe('AppRoutes', () => {
  test('mounts at root route', () => {
    const { container } = renderRoutes('/');
    expect(container.firstChild).toBeTruthy();
  });

  test('mounts at protected route', () => {
    const { container } = renderRoutes('/dashboard');
    expect(container.firstChild).toBeTruthy();
  });

  test('mounts at unknown route', () => {
    const { container } = renderRoutes('/invalid-route');
    expect(container.firstChild).toBeTruthy();
  });
});
