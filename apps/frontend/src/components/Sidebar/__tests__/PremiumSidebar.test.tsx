/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { PremiumSidebar } from '../PremiumSidebar';

// Mock useAuth
const mockLogout = vi.fn();
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    logout: mockLogout,
    user: { name: 'Test User' },
    isAuthenticated: true,
  }),
}));

vi.mock('../../../hooks/useAuthorization', () => ({
  useAuthorization: () => ({
    hasRole: () => true,
  }),
}));

// Mock useLocation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({
      pathname: '/',
    }),
  };
});

const renderSidebar = (props: any = {}) => {
  const defaultProps = {
    isOpen: true,
    setIsOpen: vi.fn(),
    isCollapsed: false,
    setIsCollapsed: vi.fn(),
  };
  return render(
    <BrowserRouter>
      <PremiumSidebar {...defaultProps} {...props} />
    </BrowserRouter>
  );
};

describe('PremiumSidebar Accessibility', () => {
  it('renders correctly', () => {
    renderSidebar();
    expect(screen.getByText('The New Fuse')).toBeInTheDocument();
  });

  it('toggle button has correct aria-label when expanded', () => {
    renderSidebar({ isCollapsed: false });
    const toggleButton = screen.getByLabelText('Collapse sidebar');
    expect(toggleButton).toBeInTheDocument();
  });

  it('toggle button has correct aria-label when collapsed', () => {
    renderSidebar({ isCollapsed: true });
    const toggleButton = screen.getByLabelText('Expand sidebar');
    expect(toggleButton).toBeInTheDocument();
  });

  it('navigation links have aria-label matching name when collapsed', () => {
    renderSidebar({ isCollapsed: true });
    const workspaceLink = screen.getByLabelText('Workspace');
    expect(workspaceLink).toBeInTheDocument();
  });

  it('renders parent navigation toggles for grouped sub-pages when expanded', () => {
    renderSidebar({ isCollapsed: false });
    expect(screen.getByLabelText('Expand Workspace navigation')).toBeInTheDocument();
  });

  it('logout button has aria-label "Sign Out" when collapsed', () => {
    renderSidebar({ isCollapsed: true });
    const logoutButton = screen.getByLabelText('Sign Out');
    expect(logoutButton).toBeInTheDocument();
  });
});
