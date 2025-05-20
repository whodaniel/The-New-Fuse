import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import GoogleCallback from '../GoogleCallback.js';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('GoogleCallback', () => {
  const mockLogin = jest.fn();
  
  const wrapper = ({ children }) => (
    <AuthContext.Provider value={{ login: mockLogin }}>
      <MemoryRouter initialEntries={['/auth/google/callback?code=test_code']}>
        <Routes>
          <Route path="/auth/google/callback" element={children} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state', () => {
    render(<GoogleCallback />, { wrapper });
    expect(screen.getByText(/Processing authentication/i)).toBeInTheDocument();
  });

  it('handles successful authentication', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: 'test_token' }),
    });

    render(<GoogleCallback />, { wrapper });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test_token');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles authentication error', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
    });

    render(<GoogleCallback />, { wrapper });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?error=callback_failed');
    });
  });
});
export {};
