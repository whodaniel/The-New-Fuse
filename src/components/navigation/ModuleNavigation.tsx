import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useModuleContext } from '@/hooks/useModuleContext';

interface ModuleNavProps {
  module: string;
  items: Array<{
    path: string;
    label: string;
    icon?: React.ReactNode;
    children?: Array<{
      path: string;
      label: string;
    }>;
  }>;
}

export const ModuleNavigation: React.FC<ModuleNavProps> = ({ module, items }) => {
  const location = useLocation();
  const { activeModule } = useModuleContext();
  
  if (!activeModule) {
    return null;
  }

  return (
    <nav className="module-navigation">
      {items.map((item) => (
        <div key={item.path} className="nav-item">
          <Link
            to={item.path}
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.icon && <span className="icon">{item.icon}</span>}
            <span className="label">{item.label}</span>
          </Link>
          {item.children && (
            <div className="sub-nav">
              {item.children.map((child) => (
                <Link
                  key={child.path}
                  to={child.path}
                  className={`nav-link ${location.pathname === child.path ? 'active' : ''}`}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
};

// Module-specific navigation configurations
export const WorkspaceNavigation: React.FC = () => (
  <ModuleNavigation
    module="workspace"
    items={[
      { path: '/workspace/overview', label: 'Overview', icon: '📊' },
      { path: '/workspace/members', label: 'Members', icon: '👥' },
      { path: '/workspace/settings', label: 'Settings', icon: '⚙️' },
    ]}
  />
);

export const AgentNavigation: React.FC = () => (
  <ModuleNavigation
    module="agents"
    items={[
      { path: '/agents/list', label: 'All Agents', icon: '🤖' },
      { path: '/agents/marketplace', label: 'Marketplace', icon: '🏪' },
      {
        path: '/agents/settings',
        label: 'Settings',
        icon: '⚙️',
        children: [
          { path: '/agents/settings/general', label: 'General' },
          { path: '/agents/settings/advanced', label: 'Advanced' },
        ],
      },
    ]}
  />
);

export const AnalyticsNavigation: React.FC = () => (
  <ModuleNavigation
    module="analytics"
    items={[
      { path: '/analytics/dashboard', label: 'Dashboard', icon: '📊' },
      { path: '/analytics/reports', label: 'Reports', icon: '📑' },
      { path: '/analytics/visualization', label: 'Visualization', icon: '📈' },
    ]}
  />
);