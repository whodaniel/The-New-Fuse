/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PremiumSidebar } from '../PremiumSidebar';
import { BrowserRouter } from 'react-router-dom';

// Mock useAuth
const mockLogout = vi.fn();
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    logout: mockLogout,
    user: { name: 'Test User' },
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
    // Navigation items: Home, Dashboard, etc.
    const homeLink = screen.getByLabelText('Home');
    expect(homeLink).toBeInTheDocument();
  });

  it('logout button has aria-label "Sign Out" when collapsed', () => {
    renderSidebar({ isCollapsed: true });
    const logoutButton = screen.getByLabelText('Sign Out');
    expect(logoutButton).toBeInTheDocument();
  });
});
