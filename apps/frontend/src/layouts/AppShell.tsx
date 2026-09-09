import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['member'] },
  { path: '/agents', label: 'Agents', icon: '🤖', roles: ['member'] },
  { path: '/workflows', label: 'Workflows', icon: '⚙️', roles: ['member'] },
  { path: '/chat', label: 'Chat', icon: '💬', roles: ['member'] },
  { path: '/resources', label: 'Resources', icon: '📦', roles: ['member'] },
  { path: '/settings', label: 'Settings', icon: '⚙️', roles: ['member'] },
  { path: '/admin', label: 'Admin', icon: '🛡️', roles: ['admin', 'super_admin'] },
] as const;

export function AppShell() {
  const { user, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  // Responsive: auto-collapse on desktop < 1024px
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const handler = (e: MediaQueryListEvent) => setCollapsed(e.matches);
    setCollapsed(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const filteredNav = NAV_ITEMS.filter((item) =>
    item.roles.some((r) => r === 'member' || (user && hasRole(r)))
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCommandOpen(true);
    }
    if (e.key === 'Escape') setCommandOpen(false);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown as EventListener);
    return () => window.removeEventListener('keydown', handleKeyDown as EventListener);
  }, []);

  return (
    <div className="app-shell" onKeyDown={handleKeyDown}>
      {/* Sidebar */}
      <aside
        className={`app-shell-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="sidebar-header">
          {!collapsed && (
            <a href="/dashboard" className="brand-link" aria-label="TNF Console">
              <span className="brand-icon">⚡</span>
              <span className="brand-text">The New Fuse</span>
            </a>
          )}
          <button
            className="collapse-toggle"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul role="list">
            {filteredNav.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  title={collapsed ? item.label : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          {!collapsed && user && (
            <div className="user-preview">
              <div className="user-avatar" aria-hidden="true">
                {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="user-info">
                <span className="user-name">{user.displayName || user.email}</span>
                <span className="user-role">{user.roles?.[0] || 'member'}</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      {/* Mobile menu toggle */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={mobileOpen}
        aria-controls="sidebar"
      >
        ☰
      </button>

      {/* Main content */}
      <main className="app-shell-main" role="main">
        {/* Top bar */}
        <header className="app-shell-topbar">
          <div className="topbar-left">
            <h1 className="page-title" id="page-title">
              {filteredNav.find((n) => location.pathname.startsWith(n.path))?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="topbar-right">
            {/* Command palette trigger */}
            <button
              className="cmd-palette-trigger"
              onClick={() => setCommandOpen(true)}
              aria-label="Open command palette (⌘K)"
            >
              <span className="cmd-icon">⌘</span>
              <span className="cmd-text">Search...</span>
              <kbd className="cmd-hint">⌘K</kbd>
            </button>

            {/* Notifications */}
            <button className="icon-btn" aria-label="Notifications">
              <span className="icon-btn-badge" aria-hidden="true">
                🔔
              </span>
              <span className="notification-count" aria-live="polite">
                3
              </span>
            </button>

            {/* User menu */}
            <div className="user-menu">
              <button
                className="user-menu-trigger"
                aria-label="User menu"
                aria-expanded="false"
                aria-haspopup="true"
              >
                <div className="user-avatar" aria-hidden="true">
                  {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                {!collapsed && (
                  <span className="user-name">{user?.displayName || user?.email}</span>
                )}
              </button>
              <div className="user-dropdown" role="menu">
                <div className="dropdown-header">
                  <span>{user?.displayName || user?.email}</span>
                  <small>{user?.roles?.[0] || 'member'}</small>
                </div>
                <NavLink to="/settings/profile" className="dropdown-item" role="menuitem">
                  👤 Profile
                </NavLink>
                <NavLink to="/settings/preferences" className="dropdown-item" role="menuitem">
                  ⚙️ Preferences
                </NavLink>
                <hr />
                <button className="dropdown-item danger" role="menuitem">
                  🚪 Sign out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="app-shell-content">
          <Outlet />
        </div>
      </main>

      {/* Command Palette Modal */}
      {commandOpen && (
        <div className="cmd-palette-overlay" onClick={() => setCommandOpen(false)}>
          <div
            className="cmd-palette"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <div className="cmd-palette-header">
              <kbd>⌘K</kbd>
              <input
                type="text"
                placeholder="Type a command or search..."
                className="cmd-palette-input"
                autoFocus
                aria-label="Command palette input"
              />
            </div>
            <div className="cmd-palette-results">
              {filteredNav.map((item) => (
                <button
                  key={item.path}
                  className="cmd-result"
                  onClick={() => {
                    navigate(item.path);
                    setCommandOpen(false);
                  }}
                  role="option"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  <kbd className="cmd-shortcut">{item.path}</kbd>
                </button>
              ))}
              <hr />
              <button className="cmd-result" role="option">
                <span>🔍</span>
                <span>Search all pages...</span>
                <kbd>/</kbd>
              </button>
              <button className="cmd-result" role="option">
                <span>📖</span>
                <span>Open documentation</span>
                <kbd>?</kbd>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppShell;
