import {
  Activity,
  Bell,
  ChevronDown,
  ChevronRight,
  Database,
  Home,
  LogOut,
  Menu,
  Moon,
  PlusCircle,
  Search,
  Settings,
  Share2,
  Shield,
  Sun,
  User,
  X,
  Zap,
} from 'lucide-react';
import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import { useAuth } from '../../providers/AuthProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { Tooltip } from '../ui/tooltip';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Decorative Floating Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse animation-delay-1000" />
        <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-pink-600/10 rounded-full blur-[100px] animate-pulse animation-delay-2000" />
      </div>

      {/* Glassmorphic Header */}
      {showHeader && (
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-2xl">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left Section */}
              <div className="flex items-center gap-4">
                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200"
                  aria-label="Toggle mobile menu"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>

                {/* Desktop Sidebar Toggle */}
                {showSidebar && (
                  <Tooltip label={layout.sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
                    <button
                      onClick={toggleSidebar}
                      className="hidden md:block p-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200"
                      aria-label="Toggle sidebar"
                    >
                      <Menu className="h-6 w-6" />
                    </button>
                  </Tooltip>
                )}

                {/* Logo */}
                <Link
                  to="/"
                  className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
                >
                  The New Fuse
                </Link>
              </div>

              {/* Center Section - Search */}
              <div className="hidden md:flex flex-1 max-w-md mx-8">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-200 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <Tooltip label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200"
                    aria-label="Toggle theme"
                  >
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </button>
                </Tooltip>

                {/* Notifications */}
                <Tooltip label="Notifications">
                  <button
                    className="relative p-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>
                </Tooltip>

                {/* User Menu */}
                {user && (
                  <div className="relative">
                    <Tooltip label="User menu">
                      <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-2 p-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200"
                        aria-label="User menu"
                        aria-expanded={userMenuOpen}
                        aria-haspopup="true"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                          {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </Tooltip>

                    {/* User Dropdown Menu */}
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl shadow-2xl overflow-hidden">
                        <div className="p-3 border-b border-white/10">
                          <p className="text-sm font-semibold text-white truncate">
                            {user.name || 'User'}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                        <div className="p-2">
                          <Link
                            to="/profile"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <User className="w-4 h-4" />
                            <span className="text-sm">Profile</span>
                          </Link>
                          <Link
                            to="/settings"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Settings className="w-4 h-4" />
                            <span className="text-sm">Settings</span>
                          </Link>
                        </div>
                        <div className="p-2 border-t border-white/10">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all duration-200"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Login/Register for non-authenticated users */}
                {!user && (
                  <div className="flex items-center gap-2">
                    <Link
                      to="/auth/login"
                      className="px-4 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                    >
                      Login
                    </Link>
                    <Link
                      to="/auth/register"
                      className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm">
          <div className="absolute top-16 left-0 right-0 backdrop-blur-xl bg-white/10 border-b border-white/20 shadow-2xl">
            <nav className="p-4">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-500"
                  />
                </div>
              </div>
              <Link
                to="/"
                className="flex items-center gap-2 px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="w-5 h-5" />
                <span>Home</span>
              </Link>
            </nav>
          </div>
        </div>
      )}

      <div className="flex flex-1 relative z-10">
        {/* Glassmorphic Sidebar */}
        {showSidebar && layout.sidebarOpen && (
          <aside className="hidden md:block w-64 fixed left-0 top-16 bottom-0 backdrop-blur-xl bg-white/5 border-r border-white/10 shadow-2xl overflow-y-auto">
            <nav className="p-4 space-y-2">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-4">Core</div>
              <SidebarLink to="/dashboard" icon={<Home className="w-5 h-5" />} label="Command Center" />
              <SidebarLink to="/ai-portal" icon={<User className="w-5 h-5" />} label="AI Agents" />
              <SidebarLink to="/multi-agent-chat" icon={<Bell className="w-5 h-5" />} label="Multi-Agent Chat" />
              
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-6 mb-2 px-4">Automation</div>
              <SidebarLink to="/workflows" icon={<Settings className="w-5 h-5" />} label="Workflow Engine" />
              <SidebarLink to="/workflows/builder" icon={<PlusCircle className="w-5 h-5" />} label="Pipeline Builder" />
              <SidebarLink to="/workflows/console" icon={<Activity className="w-5 h-5" />} label="Workflow Runtime" />
              
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-6 mb-2 px-4">Orchestration</div>
              <SidebarLink to="/mcp-hub" icon={<Zap className="w-5 h-5" />} label="MCP Hub" />
              <SidebarLink to="/knowledge-hub" icon={<Database className="w-5 h-5" />} label="Knowledge Studio" />
              <SidebarLink to="/a2a-control" icon={<Share2 className="w-5 h-5" />} label="A2A Coordination" />
              <SidebarLink to="/live-view" icon={<Activity className="w-5 h-5" />} label="Direct Live View" />
              
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-6 mb-2 px-4">Infrastructure</div>
              <SidebarLink to="/admin/system-health" icon={<Activity className="w-5 h-5" />} label="System Metrics" />
              <SidebarLink to="/admin/port-management" icon={<Shield className="w-5 h-5" />} label="Port Firewall" />
              <SidebarLink to="/build-info" icon={<Settings className="w-5 h-5" />} label="System Config" />
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main
          className={`flex-1 ${showSidebar && layout.sidebarOpen ? 'md:ml-64' : ''} min-h-screen`}
        >
          <div className="p-6">
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
