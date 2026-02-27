import {
  Activity,
  BarChart3,
  Bot,
  Boxes,
  ChevronDown,
  ClipboardList,
  Compass,
  Cpu,
  Database,
  Globe,
  Layout,
  Lightbulb,
  LogOut,
  Menu,
  MessageSquare,
  Network,
  Package,
  Plus,
  Settings,
  Shield,
  SquareTerminal,
  User,
  Workflow,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { useAuthorization } from '../hooks/useAuthorization';

// Smart Navigation Component that adapts based on authentication status and user role
function SmartNavigation() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { isSuperAdmin, isAdmin: isAnyAdmin } = useAuthorization();
  const navRef = useRef<HTMLDivElement>(null);

  // Check if user has admin role
  const isAdmin = isAnyAdmin || user?.role === 'admin' || user?.role === 'administrator';
  const isPublicPage =
    [
      '/',
      '/login',
      '/register',
      '/legal/privacy',
      '/legal/terms',
      '/brand',
      '/design-system',
    ].includes(location.pathname) || location.pathname.startsWith('/auth');

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown when navigating to a new page
  useEffect(() => {
    setActiveDropdown(null);
  }, [location.pathname]);

  // Public Navigation (for non-authenticated users) - Premium Dark Theme
  if (!isAuthenticated || isPublicPage) {
    return (
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-white/10 transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link to="/" className="shrink-0 flex items-center group">
                <img
                  src="/assets/brand/logo-monogram-neon.png"
                  alt="The New Fuse Logo"
                  className="h-10 w-10 rounded-xl shadow-lg group-hover:scale-105 transition-transform object-cover"
                />
                <h1 className="ml-3 text-xl font-bold text-white tracking-tight group-hover:opacity-90 transition-opacity">
                  The New Fuse
                </h1>
              </Link>
            </div>

            {/* Public Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/#features"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Features
              </Link>
              <Link
                to="/agents"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                AI Agents
              </Link>
              <Link
                to="/workflows"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Workflows
              </Link>
              <Link
                to="/marketplace"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Platform
              </Link>
              <Link
                to="/pricing"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Pricing
              </Link>
              <Link
                to="/all-pages"
                className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/30"
              >
                📂 All Pages
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-white text-gray-900 hover:bg-gray-100 px-5 py-2 rounded-full font-bold text-sm transition-all transform hover:scale-105 shadow-glow-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Authenticated User Navigation - Premium Obsidian Theme
  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="ml-3 text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                THE NEW FUSE
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === '/dashboard'
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Dashboard
              </Link>

              {/* Operations Menu */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('operations')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                    ['/agents', '/workflows', '/tasks'].some((p) => location.pathname.startsWith(p))
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <SquareTerminal className="w-4 h-4" />
                  Operations
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${activeDropdown === 'operations' ? 'rotate-180' : ''}`}
                  />
                </button>
                {activeDropdown === 'operations' && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-2 z-50 overflow-hidden">
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Core Fleet
                    </div>
                    <Link
                      to="/agents"
                      className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg group"
                    >
                      <Bot className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="text-sm font-medium text-slate-200">Agent Fleet</div>
                        <div className="text-[10px] text-slate-500">Manage autonomous swarms</div>
                      </div>
                    </Link>
                    <Link
                      to="/agents/new"
                      className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg"
                    >
                      <Plus className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">Quick Create Agent</span>
                    </Link>
                    <div className="my-2 border-t border-white/5" />
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Automation
                    </div>
                    <Link
                      to="/workflows"
                      className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg"
                    >
                      <Workflow className="w-4 h-4 text-purple-400" />
                      <span className="text-sm">Workflows</span>
                    </Link>
                    <Link
                      to="/tasks"
                      className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg"
                    >
                      <ClipboardList className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm">Task Management</span>
                    </Link>
                    <Link
                      to="/timeline"
                      className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg"
                    >
                      <Activity className="w-4 h-4 text-orange-400" />
                      <span className="text-sm">Unified Timeline</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Ecosystem Menu */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('ecosystem')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                    activeDropdown === 'ecosystem'
                      ? 'bg-cyan-500/10 text-cyan-400'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  Ecosystem
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${activeDropdown === 'ecosystem' ? 'rotate-180' : ''}`}
                  />
                </button>
                {activeDropdown === 'ecosystem' && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-2 z-50">
                    <Link
                      to="/sophisticated-hub"
                      className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg"
                    >
                      <Layout className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm">Sophisticated Hub</span>
                    </Link>
                    <Link
                      to="/mcp-hub"
                      className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg"
                    >
                      <Boxes className="w-4 h-4 text-orange-400" />
                      <span className="text-sm">MCP Protocol Hub</span>
                    </Link>
                    <Link
                      to="/marketplace"
                      className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg"
                    >
                      <Package className="w-4 h-4 text-pink-400" />
                      <span className="text-sm">Platform Overview</span>
                    </Link>
                    <Link
                      to="/knowledge-hub"
                      className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg"
                    >
                      <Database className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">Knowledge Base</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Intelligence Menu */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('intelligence')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                    activeDropdown === 'intelligence'
                      ? 'bg-purple-500/10 text-purple-400'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Cpu className="w-4 h-4" />
                  Intelligence
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${activeDropdown === 'intelligence' ? 'rotate-180' : ''}`}
                  />
                </button>
                {activeDropdown === 'intelligence' && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-2 z-50">
                    <Link
                      to="/ai-command-center"
                      className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg"
                    >
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="text-sm font-medium text-slate-200">Command Center</div>
                        <div className="text-[10px] text-slate-500">
                          Multi-agent chat environment
                        </div>
                      </div>
                    </Link>
                    <Link
                      to="/live-view"
                      className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg"
                    >
                      <Globe className="w-4 h-4 text-purple-400" />
                      <span className="text-sm">Live Viewer (Cloud Sandbox)</span>
                    </Link>
                    <Link
                      to="/observatory"
                      className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg"
                    >
                      <Network className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm">System Observatory</span>
                    </Link>
                    <div className="my-2 border-t border-white/5" />
                    <Link
                      to="/suggestions"
                      className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg"
                    >
                      <Lightbulb className="w-4 h-4 text-yellow-400" />
                      <div>
                        <div className="text-sm font-medium text-slate-200">Ideation Layer</div>
                        <div className="text-[10px] text-slate-500">
                          AI-driven feature suggestions
                        </div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('admin')}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
                >
                  <Shield className="w-5 h-5" />
                </button>
                {activeDropdown === 'admin' && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-2 z-50">
                    <div className="px-3 py-2 text-[10px] font-bold text-red-500 uppercase tracking-widest">
                      System Administration
                    </div>
                    {isSuperAdmin && (
                      <Link
                        to="/admin/control-panel"
                        className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg text-red-400 font-bold border-b border-white/5 mb-1"
                      >
                        <Zap className="w-4 h-4" />
                        MASTER CONTROL
                      </Link>
                    )}
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg"
                    >
                      <BarChart3 className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">Admin Analytics</span>
                    </Link>
                    <Link
                      to="/admin/users"
                      className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">Identity Management</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div className="relative">
              <button
                onClick={() => toggleDropdown('user')}
                className="flex items-center gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center text-[10px] font-bold">
                  {user?.name?.substring(0, 2).toUpperCase() || 'BS'}
                </div>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>
              {activeDropdown === 'user' && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-2 z-50">
                  <div className="px-3 py-2">
                    <div className="text-sm font-medium text-white">{user?.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
                  </div>
                  <div className="my-1 border-t border-white/10" />
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">Profile</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">Account Settings</span>
                  </Link>
                  <div className="my-1 border-t border-white/10" />
                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            <button className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default SmartNavigation;
