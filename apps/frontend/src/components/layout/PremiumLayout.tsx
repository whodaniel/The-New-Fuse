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
  containerClass = 'max-w-7xl mx-auto',
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
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Decorative Floating Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[35%] h-[35%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="flex flex-1 relative z-10 pt-16">
        {/* Glassmorphic Sidebar */}
        {showSidebar && layout.sidebarOpen && (
          <aside className="hidden md:block w-64 fixed left-0 top-16 bottom-0 backdrop-blur-3xl bg-slate-900/50 border-r border-white/5 shadow-2xl overflow-y-auto">
            <nav className="p-4 space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 px-3">
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

              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-8 mb-4 px-3">
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

              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-8 mb-4 px-3">
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
          className={`flex-1 ${showSidebar && layout.sidebarOpen ? 'md:ml-64' : ''} min-h-screen`}
        >
          <div className="p-4 sm:p-8 lg:p-12">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="mb-6" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2 text-sm">
                  {breadcrumbs.map((crumb, index) => (
                    <li key={crumb.path} className="flex items-center">
                      {index > 0 && <ChevronRight className="w-4 h-4 mx-2 text-gray-500" />}
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
                {title && (
                  <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {title}
                  </h1>
                )}
                {subtitle && <p className="text-gray-400">{subtitle}</p>}
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
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
        isActive
          ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-white shadow-lg'
          : 'text-gray-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      <div
        className={`${
          isActive
            ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg'
            : 'bg-white/10 group-hover:bg-white/20'
        } p-2 rounded-lg transition-all duration-200`}
      >
        {icon}
      </div>
      <span className="font-medium">{label}</span>
    </Link>
  );
};

export default PremiumLayout;
