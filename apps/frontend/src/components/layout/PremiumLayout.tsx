// @ts-nocheck
import { Activity, ChevronRight, Home, PlusCircle } from 'lucide-react';
import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../providers/ThemeProvider';

interface PremiumLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: { label: string; path: string }[];
  showSidebar?: boolean;
  showHeader?: boolean;
  containerClass?: string;
}

/**
 * Premium Layout Component
 * Provides glassmorphic navigation with backdrop blur, gradient backgrounds,
 * and floating orbs for a premium, modern look across the platform
 */
export const PremiumLayout: React.FC<PremiumLayoutProps> = ({
  children,
  title,
  subtitle,
  breadcrumbs,
  showSidebar = true,
  showHeader = true,
  containerClass = 'max-w-6xl mx-auto',
}) => {
  const { user, logout } = useAuth();
  const { layout, toggleSidebar } = useLayout();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative">
      <div className="flex flex-1 relative pt-16">
        {/* Glassmorphic Sidebar */}
        {showSidebar && layout.sidebarOpen && (
          <aside className="hidden md:block w-60 fixed left-0 top-16 bottom-0 bg-slate-900 border-r border-slate-800 overflow-y-auto">
            <nav className="p-3 space-y-1">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em] mb-3 px-2">
                Main Fleet
              </div>
              <SidebarLink
                to="/dashboard"
                icon={<Home className="w-4 h-4" />}
                label="Command Center"
              />
              <SidebarLink to="/agents" icon={<Bot className="w-4 h-4" />} label="AI Agents" />
              <SidebarLink
                to="/multi-agent-chat"
                icon={<MessageSquare className="w-4 h-4" />}
                label="Swarms"
              />

              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em] mt-6 mb-3 px-2">
                Engineering
              </div>
              <SidebarLink
                to="/workflows"
                icon={<Workflow className="w-4 h-4" />}
                label="Workflow Studio"
              />
              <SidebarLink
                to="/workflows/builder"
                icon={<PlusCircle className="w-4 h-4" />}
                label="Pipeline Editor"
              />

              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.18em] mt-6 mb-3 px-2">
                Monitoring
              </div>
              <SidebarLink
                to="/live-view"
                icon={<Globe className="w-4 h-4" />}
                label="Real-time Vision"
              />
              <SidebarLink
                to="/observatory"
                icon={<Activity className="w-4 h-4" />}
                label="Observatory"
              />
              <SidebarLink
                to="/admin/system-health"
                icon={<Activity className="w-4 h-4" />}
                label="Service Mesh"
              />
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main
          className={`flex-1 ${showSidebar && layout.sidebarOpen ? 'md:ml-60' : ''} min-h-screen`}
        >
          <div className="p-4 sm:p-4 lg:p-4">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="mb-6" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2 text-sm">
                  {breadcrumbs.map((crumb, index) => (
                    <li key={crumb.path} className="flex items-center">
                      {index > 0 && <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground" />}
                      <Link
                        to={crumb.path}
                        className={`${
                          index === breadcrumbs.length - 1
                            ? 'text-white font-medium'
                            : 'text-gray-400 hover:text-white'
                        } transition-colors duration-200`}
                      >
                        {crumb.label}
                      </Link>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {/* Page Header */}
            {(title || subtitle) && (
              <div className="mb-8">
                {title && <h1 className="text-2xl font-semibold text-slate-100 mb-2">{title}</h1>}
                {subtitle && <p className="text-slate-400">{subtitle}</p>}
              </div>
            )}

            {/* Content Container */}
            <div className={containerClass}>{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

/**
 * Sidebar Link Component
 */
interface SidebarLinkProps {
  to: string;
  icon: ReactNode;
  label: string;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-150 group ${
        isActive
          ? 'bg-slate-800 text-white border border-slate-700'
          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
      }`}
    >
      <div className="text-slate-400 group-hover:text-slate-200">{icon}</div>
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
};

export default PremiumLayout;
