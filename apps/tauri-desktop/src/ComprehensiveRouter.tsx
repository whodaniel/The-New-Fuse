import { ChevronDown, ChevronRight, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import React, { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import TnfLogo from './components/brand/TnfLogo';
import CommandPalette, { useCommandPaletteShortcut } from './components/layout/CommandPalette';
import NavIcon from './components/layout/NavIcon';
import SidebarAuth from './components/layout/SidebarAuth';
import ThemeToggle from './components/layout/ThemeToggle';
import { useRoute } from './components/route-context';
import './ComprehensiveRouter.css';
import { ROUTE_COMPONENTS } from './config/routeComponents';
import {
  DESKTOP_ROUTES,
  isKnownRoute,
  isSecondaryNavGroup,
  NAV_GROUPS,
  resolveLegacyRedirect,
  routesForGroup,
  SECONDARY_NAV_GROUPS,
} from './config/routes';
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

  const goHome = useCallback(() => {
    navigate('/');
    if (isMobile) setSidebarOpen(false);
  }, [isMobile, navigate, setSidebarOpen]);

  const showFirstRunCue = !synergy.relayConnected && !synergy.apiOnline;
  const activeRouteMeta = useMemo(
    () => DESKTOP_ROUTES.find((route) => route.path === resolveLegacyRedirect(currentRoute)),
    [currentRoute]
  );
  const activeNeedsSecondary = Boolean(
    activeRouteMeta && isSecondaryNavGroup(activeRouteMeta.group)
  );
  const [showSecondaryNav, setShowSecondaryNav] = useState(activeNeedsSecondary);
  const secondaryExpanded = showSecondaryNav || activeNeedsSecondary;

  const renderPage = () => {
    const resolvedRoute = resolveLegacyRedirect(currentRoute);
    const PageComponent = ROUTE_COMPONENTS[resolvedRoute];
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
            {sidebarOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
          </button>
          <div className="mobile-logo">
            <TnfLogo size={28} compactWordmark onClick={goHome} />
          </div>
          <ThemeToggle collapsed className="mobile-header-theme" />
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
              {sidebarCollapsed ? (
                <TnfLogo size={32} onClick={goHome} />
              ) : (
                <TnfLogo size={36} showWordmark onClick={goHome} />
              )}
            </div>
            <button
              type="button"
              className="collapse-btn"
              onClick={toggleSidebar}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen size={16} strokeWidth={2} />
              ) : (
                <PanelLeftClose size={16} strokeWidth={2} />
              )}
            </button>
          </div>
        )}

        {!sidebarCollapsed && showFirstRunCue ? (
          <button
            type="button"
            className="first-run-cue"
            onClick={() => handleNavClick('/settings')}
          >
            <span className="first-run-cue-title">Connect the runtime</span>
            <span className="first-run-cue-body">
              Relay and API are offline. Open Settings to finish first-run wiring.
            </span>
          </button>
        ) : null}

        <nav className="sidebar-nav" aria-label="Primary">
          {NAV_GROUPS.filter(
            (group) => group.id !== 'system' && !isSecondaryNavGroup(group.id)
          ).map((group) => {
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
                    onClick={() => {
                      if (item.externalUrl) {
                        void import('./lib/openExternal').then(m => m.openExternal(item.externalUrl!));
                      } else {
                        handleNavClick(item.path);
                      }
                    }}
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

          {!sidebarCollapsed ? (
            <button
              type="button"
              className={`nav-more-toggle ${secondaryExpanded ? 'expanded' : ''}`}
              onClick={() => setShowSecondaryNav((prev) => !prev)}
              aria-expanded={secondaryExpanded}
            >
              {secondaryExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span>More</span>
              <span className="nav-more-count">{SECONDARY_NAV_GROUPS.length}</span>
            </button>
          ) : (
            <button
              type="button"
              className={`nav-item ${secondaryExpanded ? 'active' : ''}`}
              onClick={() => setShowSecondaryNav((prev) => !prev)}
              title="More"
              aria-expanded={secondaryExpanded}
            >
              <span className="nav-icon">
                {secondaryExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </span>
            </button>
          )}

          {secondaryExpanded
            ? NAV_GROUPS.filter((group) => isSecondaryNavGroup(group.id)).map((group) => {
                const groupRoutes = routesForGroup(group.id);
                if (groupRoutes.length === 0) return null;
                return (
                  <React.Fragment key={group.id}>
                    {!sidebarCollapsed ? (
                      <div className="nav-section-label secondary">{group.label}</div>
                    ) : null}
                    {groupRoutes.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`nav-item ${currentRoute === item.path ? 'active' : ''}`}
                        onClick={() => {
                          if (item.externalUrl) {
                            void import('./lib/openExternal').then(m => m.openExternal(item.externalUrl!));
                          } else {
                            handleNavClick(item.path);
                          }
                        }}
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
              })
            : null}

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
          <ThemeToggle collapsed={sidebarCollapsed} />
          <SidebarAuth collapsed={sidebarCollapsed} />
          {!sidebarCollapsed && (
            <>
              <button
                type="button"
                className="command-hint"
                onClick={() => setPaletteOpen(true)}
                title="Open command palette"
              >
                <span>Command palette</span>
                <kbd>⌘K</kbd>
              </button>
              <button
                type="button"
                className={`connection-indicator ${connectionDotClass !== 'online' ? 'actionable' : ''}`}
                onClick={() => {
                  if (connectionDotClass !== 'online') navigate('/settings');
                }}
                title={connectionDotClass !== 'online' ? 'Diagnose Connection' : undefined}
              >
                <span className={`status-dot ${connectionDotClass}`}></span>
                <span>{connectionLabel}</span>
              </button>
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
    </div>
  );
};

// Loading Screen Component
const LoadingScreen: React.FC = () => (
  <div className="loading-screen" role="status" aria-live="polite">
    <div className="loading-content loading-brand">
      <TnfLogo size={48} />
      <p>Loading The New Fuse…</p>
    </div>
  </div>
);

export default ComprehensiveRouter;
