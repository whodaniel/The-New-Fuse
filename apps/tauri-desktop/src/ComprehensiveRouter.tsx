import React, { Suspense, lazy } from 'react';
import { useRoute } from './components/route-context';
import { useLayout } from './contexts/LayoutContext';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AgentHub = lazy(() => import('./pages/AgentHub'));
const WorkflowBuilder = lazy(() => import('./pages/WorkflowBuilder'));
const Settings = lazy(() => import('./pages/Settings'));

/**
 * The New Fuse Tauri Desktop - Comprehensive Router
 * Deep Space Premium Design
 */
const ComprehensiveRouter: React.FC = () => {
  const { currentRoute, navigate } = useRoute();
  const { sidebarCollapsed, toggleSidebar, sidebarOpen } = useLayout();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', route: '/dashboard' },
    { id: 'agents', label: 'Agent Hub', icon: '🤖', route: '/agents' },
    { id: 'workflows', label: 'Workflows', icon: '⚡', route: '/workflows' },
    { id: 'settings', label: 'Settings', icon: '⚙️', route: '/settings' },
  ];

  const renderPage = () => {
    switch (currentRoute) {
      case '/agents':
        return <AgentHub />;
      case '/workflows':
        return <WorkflowBuilder />;
      case '/settings':
        return <Settings />;
      case '/dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside
        className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${!sidebarOpen ? 'hidden' : ''}`}
      >
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🔥</span>
            {!sidebarCollapsed && <span className="logo-text">The New Fuse</span>}
          </div>
          <button className="collapse-btn" onClick={toggleSidebar}>
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${currentRoute === item.route ? 'active' : ''}`}
              onClick={() => navigate(item.route)}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!sidebarCollapsed && (
            <div className="version-info">
              <span>v1.0.0</span>
              <span className="status-dot"></span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Suspense fallback={<LoadingScreen />}>{renderPage()}</Suspense>
      </main>

      <style>{`
        .app-container {
          display: flex;
          height: 100vh;
          background: var(--tnf-obsidian, #020617);
          color: var(--tnf-text-primary, #f8fafc);
          font-family: var(--tnf-font-body, 'Plus Jakarta Sans', sans-serif);
        }

        /* Sidebar */
        .sidebar {
          width: 260px;
          background: var(--tnf-surface, rgba(255, 255, 255, 0.02));
          backdrop-filter: blur(24px);
          border-right: 1px solid var(--tnf-border, rgba(255, 255, 255, 0.08));
          display: flex;
          flex-direction: column;
          transition: width 0.3s var(--tnf-spring, cubic-bezier(0.34, 1.56, 0.64, 1));
          z-index: 100;
        }

        .sidebar.collapsed {
          width: 72px;
        }

        .sidebar.hidden {
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

        .version-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--tnf-text-muted);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--tnf-success, #10b981);
          box-shadow: 0 0 8px var(--tnf-success);
        }

        /* Main Content */
        .main-content {
          flex: 1;
          overflow-y: auto;
          background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6, 182, 212, 0.08) 0%, transparent 50%),
                      radial-gradient(ellipse 60% 40% at 80% 0%, rgba(139, 92, 246, 0.05) 0%, transparent 40%),
                      var(--tnf-obsidian);
        }

        /* Scrollbar */
        .main-content::-webkit-scrollbar {
          width: 6px;
        }

        .main-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .main-content::-webkit-scrollbar-thumb {
          background: var(--tnf-border);
          border-radius: 3px;
        }

        .main-content::-webkit-scrollbar-thumb:hover {
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
