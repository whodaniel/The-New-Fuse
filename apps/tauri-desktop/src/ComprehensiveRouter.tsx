import React, { Suspense, lazy } from 'react';
import { useRoute } from './components/route-context';
import { useLayout } from './contexts/LayoutContext';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AgentHub = lazy(() => import('./pages/AgentHub'));
const AntigravityHub = lazy(() => import('./pages/AntigravityHub'));
const WorkflowBuilder = lazy(() => import('./pages/WorkflowBuilder'));
const MultiAgentChat = lazy(() => import('./pages/MultiAgentChat'));
const MCPMarketplace = lazy(() => import('./pages/MCPMarketplace'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const WebBrowser = lazy(() => import('./pages/WebBrowser'));
const OAGIHub = lazy(() => import('./pages/OAGIHub'));
const SwarmTerminal = lazy(() => import('./pages/SwarmTerminal'));

/**
 * The New Fuse Tauri Desktop - Comprehensive Router
 * Deep Space Premium Design with Responsive Mobile/Desktop Navigation
 */
const ComprehensiveRouter: React.FC = () => {
  const { currentRoute, navigate } = useRoute();
  const { sidebarCollapsed, sidebarOpen, isMobile, toggleSidebar, setSidebarOpen } = useLayout();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', route: '/dashboard', section: 'main' },
    { id: 'agents', label: 'Agent Hub', icon: '🤖', route: '/agents', section: 'main' },
    { id: 'terminal', label: 'Swarm Terminal', icon: '📟', route: '/terminal', section: 'main' },
    { id: 'oagi', label: 'OAGI Hub', icon: '🖥️', route: '/oagi', section: 'main' },
    { id: 'antigravity', label: 'Antigravity', icon: '🔮', route: '/antigravity', section: 'main' },
    { id: 'chat', label: 'Chat', icon: '💬', route: '/chat', section: 'main' },
    { id: 'workflows', label: 'Workflows', icon: '⚡', route: '/workflows', section: 'main' },
    { id: 'browser', label: 'Web Browser', icon: '🌐', route: '/browser', section: 'main' },
    { id: 'analytics', label: 'Analytics', icon: '📊', route: '/analytics', section: 'main' },
    { id: 'mcp', label: 'MCP Store', icon: '🔧', route: '/mcp', section: 'tools' },
    { id: 'settings', label: 'Settings', icon: '⚙️', route: '/settings', section: 'system' },
  ];

  const mainNav = navItems.filter((item) => item.section === 'main');
  const toolsNav = navItems.filter((item) => item.section === 'tools');
  const systemNav = navItems.filter((item) => item.section === 'system');

  const renderPage = () => {
    switch (currentRoute) {
      case '/agents':
        return <AgentHub />;
      case '/antigravity':
        return <AntigravityHub />;
      case '/oagi':
        return <OAGIHub />;
      case '/terminal':
        return <SwarmTerminal />;
      case '/chat':
        return <MultiAgentChat />;
      case '/workflows':
        return <WorkflowBuilder />;
      case '/analytics':
        return <Analytics />;
      case '/mcp':
        return <MCPMarketplace />;
      case '/settings':
        return <Settings />;
      case '/browser':
        return <WebBrowser />;
      case '/dashboard':
      default:
        return <Dashboard />;
    }
  };

  const handleNavClick = (route: string) => {
    navigate(route);
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="app-container">
      {/* Mobile Header */}
      {isMobile && (
        <header className="mobile-header">
          <button className="hamburger-btn" onClick={toggleSidebar}>
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <div className="mobile-logo">
            <span className="logo-icon">🔥</span>
            <span className="logo-text">The New Fuse</span>
          </div>
          <div className="mobile-header-spacer"></div>
        </header>
      )}

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
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
              {!sidebarCollapsed && <span className="logo-text">The New Fuse</span>}
            </div>
            <button className="collapse-btn" onClick={toggleSidebar}>
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>
        )}

        <nav className="sidebar-nav">
          {/* Main Navigation */}
          {!sidebarCollapsed && <div className="nav-section-label">Main</div>}
          {mainNav.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentRoute === item.route ? 'active' : ''}`}
              onClick={() => handleNavClick(item.route)}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </button>
          ))}

          {/* Tools */}
          {!sidebarCollapsed && <div className="nav-section-label">Tools</div>}
          {toolsNav.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentRoute === item.route ? 'active' : ''}`}
              onClick={() => handleNavClick(item.route)}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </button>
          ))}

          <div className="nav-spacer" />

          {/* System */}
          {systemNav.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentRoute === item.route ? 'active' : ''}`}
              onClick={() => handleNavClick(item.route)}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!sidebarCollapsed && (
            <>
              <div className="connection-indicator">
                <span className="status-dot online"></span>
                <span>Connected</span>
              </div>
              <div className="version-info">
                <span>v4.0.0</span>
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
          font-size: 18px;
          width: 24px;
          text-align: center;
        }

        .nav-label {
          font-weight: 500;
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid var(--tnf-border);
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
  <div className="loading-screen">
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
