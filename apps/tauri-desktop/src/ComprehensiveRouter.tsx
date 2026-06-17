import React, { lazy, Suspense, useCallback, useState } from 'react';
import CommandPalette, { useCommandPaletteShortcut } from './components/layout/CommandPalette';
import NavIcon from './components/layout/NavIcon';
import SidebarAuth from './components/layout/SidebarAuth';
import { useRoute } from './components/route-context';
import './ComprehensiveRouter.css';
import { ROUTE_COMPONENTS } from './config/routeComponents';
import { isKnownRoute, NAV_GROUPS, routesForGroup } from './config/routes';
import { useLayout } from './contexts/LayoutContext';
import { useOperatorSynergy } from './hooks/useOperatorSynergy';

const NotFound = lazy(() => import('./pages/NotFound'));

/**
 * The New Fuse Tauri Desktop - Comprehensive Router
 * Deep Space Premium Design with Responsive Mobile/Desktop Navigation
 */
const ComprehensiveRouter: React.FC = () => {
  const { currentRoute, navigate } = useRoute();
  const { sidebarCollapsed, sidebarOpen, isMobile, toggleSidebar, setSidebarOpen } = useLayout();
  const { state: synergy } = useOperatorSynergy();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const togglePalette = useCallback(() => setPaletteOpen((prev) => !prev), []);
  useCommandPaletteShortcut(togglePalette);

  const renderPage = () => {
    const PageComponent = ROUTE_COMPONENTS[currentRoute];
    if (!isKnownRoute(currentRoute) || !PageComponent) {
      return <NotFound attemptedRoute={currentRoute} />;
    }
    return <PageComponent />;
  };

  const handleNavClick = (route: string) => {
    navigate(route);
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const connectionDotClass = (() => {
    if (synergy.relayConnected) {
      return 'online';
    }
    if (synergy.relayRegistered) {
      return 'warn';
    }
    return 'offline';
  })();

  const connectionLabel = (() => {
    if (synergy.relayRegistered) {
      return `Federation · ${synergy.unifiedAgents.length} agents`;
    }
    if (synergy.relayConnected) {
      return 'Relay connected';
    }
    return 'Offline';
  })();

  return (
    <div className="app-container">
      {/* Mobile Header */}
      {isMobile && (
        <header className="mobile-header">
          <button
            type="button"
            className="hamburger-btn"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <div className="mobile-logo">
            <span className="logo-icon">🔥</span>
            <span className="logo-text">TNF Desktop</span>
            <span className="logo-sub">The New Fuse</span>
          </div>
          <div className="mobile-header-spacer"></div>
        </header>
      )}

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${sidebarOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : 'desktop'}`}
      >
        {/* Desktop Logo */}
        {!isMobile && (
          <div className="sidebar-header">
            <div className="logo">
              <span className="logo-icon">🔥</span>
              {!sidebarCollapsed && (
                <>
                  <span className="logo-text">TNF Desktop</span>
                  <span className="logo-sub">The New Fuse</span>
                </>
              )}
            </div>
            <button
              type="button"
              className="collapse-btn"
              onClick={toggleSidebar}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>
        )}

        <nav className="sidebar-nav" aria-label="Primary">
          {NAV_GROUPS.filter((group) => group.id !== 'system').map((group) => {
            const groupRoutes = routesForGroup(group.id);
            if (groupRoutes.length === 0) return null;
            return (
              <React.Fragment key={group.id}>
                {!sidebarCollapsed ? <div className="nav-section-label">{group.label}</div> : null}
                {groupRoutes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`nav-item ${currentRoute === item.path ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.path)}
                    title={sidebarCollapsed ? item.label : undefined}
                    aria-current={currentRoute === item.path ? 'page' : undefined}
                  >
                    <span className="nav-icon">
                      <NavIcon id={item.id} />
                    </span>
                    {!sidebarCollapsed ? (
                      <span className="nav-label">
                        {item.label}
                        {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                      </span>
                    ) : null}
                  </button>
                ))}
              </React.Fragment>
            );
          })}

          <div className="nav-spacer" />

          {routesForGroup('system').map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${currentRoute === item.path ? 'active' : ''}`}
              onClick={() => handleNavClick(item.path)}
              title={sidebarCollapsed ? item.label : undefined}
              aria-current={currentRoute === item.path ? 'page' : undefined}
            >
              <span className="nav-icon">
                <NavIcon id={item.id} />
              </span>
              {!sidebarCollapsed ? <span className="nav-label">{item.label}</span> : null}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <SidebarAuth collapsed={sidebarCollapsed} />
          {!sidebarCollapsed && (
            <>
              <div className="connection-indicator">
                <span className={`status-dot ${connectionDotClass}`}></span>
                <span>{connectionLabel}</span>
              </div>
              <div className="version-info">
                <span>v4.1.0</span>
                <span className="build-type">Tauri</span>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${isMobile ? 'mobile' : ''}`}>
        <Suspense fallback={<LoadingScreen />}>{renderPage()}</Suspense>
      </main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <style>{`
        .app-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: var(--tnf-obsidian, #020617);
          color: var(--tnf-text-primary, #f8fafc);
          font-family: var(--tnf-font-body, 'Plus Jakarta Sans', sans-serif);
        }

        @media (min-width: 768px) {
          .app-container {
            flex-direction: row;
          }
        }

        /* Mobile Header */
        .mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 56px;
          padding: 0 16px;
          background: var(--tnf-surface, rgba(255, 255, 255, 0.02));
          border-bottom: 1px solid var(--tnf-border, rgba(255, 255, 255, 0.08));
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .hamburger-btn {
          width: 40px;
          height: 40px;
          background: transparent;
          border: none;
          color: var(--tnf-text-primary);
          font-size: 22px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mobile-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .mobile-header-spacer {
          width: 40px;
        }

        /* Sidebar Overlay (Mobile) */
        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 90;
          border: none;
          padding: 0;
          cursor: pointer;
        }

        /* Sidebar */
        .sidebar {
          width: 260px;
          background: var(--tnf-surface, rgba(255, 255, 255, 0.02));
          backdrop-filter: blur(24px);
          border-right: 1px solid var(--tnf-border, rgba(255, 255, 255, 0.08));
          display: flex;
          flex-direction: column;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 100;
        }

        /* Mobile Sidebar */
        .sidebar.mobile {
          position: fixed;
          top: 56px;
          left: 0;
          bottom: 0;
          transform: translateX(-100%);
        }

        .sidebar.mobile.open {
          transform: translateX(0);
        }

        /* Desktop Sidebar */
        .sidebar.desktop.collapsed {
          width: 72px;
        }

        .sidebar.desktop.closed {
          display: none;
        }

        .sidebar-header {
          height: 64px;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--tnf-border);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          font-size: 24px;
          filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.5));
        }

        .logo-text {
          font-family: var(--tnf-font-heading, 'Outfit', sans-serif);
          font-weight: 700;
          font-size: 18px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .logo-sub {
          display: block;
          font-size: 11px;
          color: var(--tnf-text-muted, #64748b);
          font-weight: 500;
          margin-top: 2px;
        }

        .collapse-btn {
          background: transparent;
          border: none;
          color: var(--tnf-text-muted, #64748b);
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .collapse-btn:hover {
          background: var(--tnf-surface-hover, rgba(255, 255, 255, 0.05));
          color: var(--tnf-text-primary);
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
        }

        .nav-section-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--tnf-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 16px 16px 8px;
        }

        .nav-spacer {
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: transparent;
          border: none;
          border-radius: 10px;
          color: var(--tnf-text-muted);
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          font-size: 14px;
        }

        .nav-item:hover {
          background: var(--tnf-surface-hover);
          color: var(--tnf-text-primary);
          transform: translateX(4px);
        }

        .nav-item.active {
          background: linear-gradient(90deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0) 100%);
          color: var(--tnf-primary-light, #8b5cf6);
          border-left: 3px solid var(--tnf-primary, #6366f1);
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          color: inherit;
          opacity: 0.85;
        }

        .nav-item.active .nav-icon {
          opacity: 1;
          color: var(--tnf-primary-light, #8b5cf6);
        }

        .nav-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }

        .nav-badge {
          font-size: 9px;
          letter-spacing: 0.08em;
          padding: 2px 6px;
          border-radius: 999px;
          background: rgba(99, 102, 241, 0.18);
          color: #c4b5fd;
          border: 1px solid rgba(99, 102, 241, 0.35);
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid var(--tnf-border);
        }

        .sidebar-auth {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }

        .sidebar-auth-muted {
          font-size: 11px;
          color: var(--tnf-text-muted);
        }

        .sidebar-auth-user {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .sidebar-auth-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          flex-shrink: 0;
          object-fit: cover;
        }

        .sidebar-auth-initial {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(99, 102, 241, 0.25);
          color: #c4b5fd;
          font-weight: 700;
          font-size: 13px;
        }

        .sidebar-auth-meta {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .sidebar-auth-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--tnf-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-auth-email {
          font-size: 11px;
          color: var(--tnf-text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-auth-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid var(--tnf-border);
          background: var(--tnf-surface);
          color: var(--tnf-text-secondary);
          font-size: 12px;
          cursor: pointer;
        }

        .sidebar-auth-btn:hover {
          background: var(--tnf-surface-hover);
        }

        .sidebar-auth-primary {
          border-color: rgba(99, 102, 241, 0.35);
          color: #c4b5fd;
        }

        .sidebar-auth-error {
          font-size: 11px;
          color: var(--tnf-error);
        }

        .connection-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--tnf-text-muted);
          margin-bottom: 8px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.online {
          background: var(--tnf-success, #10b981);
          box-shadow: 0 0 8px var(--tnf-success);
        }

        .status-dot.warn {
          background: var(--tnf-warning, #f59e0b);
          box-shadow: 0 0 8px var(--tnf-warning);
        }

        .status-dot.offline {
          background: var(--tnf-error, #ef4444);
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
        }

        .version-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: var(--tnf-text-muted);
        }

        .build-type {
          background: rgba(99, 102, 241, 0.2);
          color: var(--tnf-primary-light);
          padding: 2px 8px;
          border-radius: 8px;
        }

        /* Main Content */
        .main-content {
          flex: 1;
          overflow-y: auto;
          background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6, 182, 212, 0.08) 0%, transparent 50%),
                      radial-gradient(ellipse 60% 40% at 80% 0%, rgba(139, 92, 246, 0.05) 0%, transparent 40%),
                      var(--tnf-obsidian);
        }

        .main-content.mobile {
          padding-bottom: env(safe-area-inset-bottom);
        }

        /* Scrollbar */
        .main-content::-webkit-scrollbar,
        .sidebar-nav::-webkit-scrollbar {
          width: 6px;
        }

        .main-content::-webkit-scrollbar-track,
        .sidebar-nav::-webkit-scrollbar-track {
          background: transparent;
        }

        .main-content::-webkit-scrollbar-thumb,
        .sidebar-nav::-webkit-scrollbar-thumb {
          background: var(--tnf-border);
          border-radius: 3px;
        }

        .main-content::-webkit-scrollbar-thumb:hover,
        .sidebar-nav::-webkit-scrollbar-thumb:hover {
          background: var(--tnf-border-hover);
        }
      `}</style>
    </div>
  );
};

// Loading Screen Component
const LoadingScreen: React.FC = () => (
  <div className="loading-screen" role="status" aria-live="polite">
    <div className="loading-content">
      <div className="loading-spinner"></div>
      <p>Loading...</p>
    </div>
    <style>{`
      .loading-screen {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--tnf-text-muted, #64748b);
      }
      .loading-content {
        text-align: center;
      }
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--tnf-border, rgba(255, 255, 255, 0.08));
        border-top-color: var(--tnf-primary, #6366f1);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 16px;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default ComprehensiveRouter;
