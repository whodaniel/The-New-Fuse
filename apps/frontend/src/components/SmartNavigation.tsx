import { Globe } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

// Smart Navigation Component that adapts based on authentication status and user role
function SmartNavigation() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const navRef = useRef<HTMLDivElement>(null);

  // Check if user has admin role
  const isAdmin = user?.role === 'admin' || user?.role === 'administrator';
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
                to="/resources"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Resources
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

  // Authenticated User Navigation
  return (
    <nav ref={navRef} className="bg-blue-600 text-white p-4 shadow-lg relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/dashboard" className="text-xl font-bold hover:text-blue-200 transition-colors">
          🚀 The New Fuse
        </Link>

        <div className="flex items-center space-x-2 flex-wrap">
          <Link to="/dashboard" className="hover:text-blue-200 px-3 py-2 rounded transition-colors">
            📊 Dashboard
          </Link>

          {/* AI Agents Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('agents')}
              className="hover:text-blue-200 px-3 py-2 rounded transition-colors bg-blue-700 flex items-center"
            >
              🤖 AI Agents <span className="ml-1">▼</span>
            </button>
            {activeDropdown === 'agents' && (
              <div className="absolute top-full left-0 mt-1 bg-white text-black rounded shadow-lg z-50 min-w-48">
                <Link to="/agents" className="block px-4 py-2 hover:bg-gray-100">
                  📋 All Agents
                </Link>
                <Link to="/agents/new" className="block px-4 py-2 hover:bg-gray-100">
                  ➕ Create Agent
                </Link>
                <Link
                  to="/ai-command-center"
                  className="block px-4 py-2 hover:bg-gray-100 font-bold text-blue-600"
                >
                  🎛️ AI Command Center
                </Link>
                <Link
                  to="/live-view"
                  className="block px-4 py-2 hover:bg-gray-100 font-bold text-purple-600"
                >
                  👁️ Live View
                </Link>
                <Link to="/agents/unified-creator" className="block px-4 py-2 hover:bg-gray-100">
                  🚀 Unified Creator
                </Link>
                <Link to="/dashboard/agents" className="block px-4 py-2 hover:bg-gray-100">
                  📊 Agent Dashboard
                </Link>
              </div>
            )}
          </div>

          {/* Explore Hubs Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('explore')}
              className="hover:text-blue-200 px-3 py-2 rounded transition-colors bg-cyan-700 flex items-center"
            >
              🌐 Explore <span className="ml-1">▼</span>
            </button>
            {activeDropdown === 'explore' && (
              <div className="absolute top-full left-0 mt-1 bg-white text-black rounded shadow-lg z-50 min-w-56">
                <Link
                  to="/sophisticated-hub"
                  className="block px-4 py-2 hover:bg-gray-100 font-bold text-cyan-600"
                >
                  🏛️ Sophisticated Hub
                </Link>
                <Link to="/hub" className="block px-4 py-2 hover:bg-gray-100">
                  🏙️ Modern Hub
                </Link>
                <Link to="/mcp-hub" className="block px-4 py-2 hover:bg-gray-100">
                  🔌 MCP Hub
                </Link>
                <Link to="/knowledge-hub" className="block px-4 py-2 hover:bg-gray-100">
                  🧠 Knowledge Hub
                </Link>
                <Link to="/a2a-control" className="block px-4 py-2 hover:bg-gray-100">
                  🎮 A2A Control
                </Link>
                <Link to="/agency/dashboard" className="block px-4 py-2 hover:bg-gray-100">
                  🏢 Agency Dashboard
                </Link>
                <div className="border-t border-gray-100 my-1"></div>
                <Link
                  to="/all-pages"
                  className="block px-4 py-2 hover:bg-gray-100 font-medium text-blue-600"
                >
                  📁 Site Directory (All Pages)
                </Link>
              </div>
            )}
          </div>

          {/* Workflows Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('workflows')}
              className="hover:text-blue-200 px-3 py-2 rounded transition-colors bg-indigo-600 flex items-center"
            >
              🔄 Workflows <span className="ml-1">▼</span>
            </button>
            {activeDropdown === 'workflows' && (
              <div className="absolute top-full left-0 mt-1 bg-white text-black rounded shadow-lg z-50 min-w-48">
                <Link to="/workflows" className="block px-4 py-2 hover:bg-gray-100">
                  🔄 All Workflows
                </Link>
                <Link to="/workflows/builder" className="block px-4 py-2 hover:bg-gray-100">
                  🛠️ Workflow Builder
                </Link>
                <Link to="/workflows/templates" className="block px-4 py-2 hover:bg-gray-100">
                  📄 Templates
                </Link>
                <Link to="/workflows/executions" className="block px-4 py-2 hover:bg-gray-100">
                  📊 Executions
                </Link>
              </div>
            )}
          </div>

          {/* Resources Marketplace Link */}
          <Link
            to="/resources"
            className="hover:text-blue-200 px-3 py-2 rounded transition-colors bg-linear-to-r from-purple-600 to-pink-600"
          >
            📦 Resources
          </Link>

          {/* Tasks Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('tasks')}
              className="hover:text-blue-200 px-3 py-2 rounded transition-colors bg-green-600 flex items-center"
            >
              📋 Tasks <span className="ml-1">▼</span>
            </button>
            {activeDropdown === 'tasks' && (
              <div className="absolute top-full left-0 mt-1 bg-white text-black rounded shadow-lg z-50 min-w-48">
                <Link to="/tasks" className="block px-4 py-2 hover:bg-gray-100">
                  📋 All Tasks
                </Link>
                <Link to="/tasks/new" className="block px-4 py-2 hover:bg-gray-100">
                  ➕ New Task
                </Link>
                <Link to="/suggestions" className="block px-4 py-2 hover:bg-gray-100">
                  💡 Suggestions
                </Link>
              </div>
            )}
          </div>

          {/* Workspace Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('workspace')}
              className="hover:text-blue-200 px-3 py-2 rounded transition-colors bg-purple-600 flex items-center"
            >
              🏢 Workspace <span className="ml-1">▼</span>
            </button>
            {activeDropdown === 'workspace' && (
              <div className="absolute top-full left-0 mt-1 bg-white text-black rounded shadow-lg z-50 min-w-48">
                <Link to="/workspace/overview" className="block px-4 py-2 hover:bg-gray-100">
                  📋 Overview
                </Link>
                <Link to="/workspace/analytics" className="block px-4 py-2 hover:bg-gray-100">
                  📊 Analytics
                </Link>
                <Link to="/workspace/members" className="block px-4 py-2 hover:bg-gray-100">
                  👥 Members
                </Link>
                <Link to="/workspace/chat" className="block px-4 py-2 hover:bg-gray-100">
                  💬 Chat
                </Link>
                <Link to="/workspace/settings" className="block px-4 py-2 hover:bg-gray-100">
                  ⚙️ Settings
                </Link>
              </div>
            )}
          </div>

          {/* Observatory Link */}
          <Link
            to="/observatory"
            className="hover:text-blue-200 px-3 py-2 rounded transition-colors bg-blue-700 flex items-center gap-2"
          >
            <Globe className="w-4 h-4" /> Observatory
          </Link>

          {/* Analytics Link */}
          <Link to="/analytics" className="hover:text-blue-200 px-3 py-2 rounded transition-colors">
            📊 Analytics
          </Link>

          {/* Admin Dropdown - Only show for admin users */}
          {isAdmin && (
            <div className="relative">
              <button
                onClick={() => toggleDropdown('admin')}
                className="hover:text-blue-200 px-3 py-2 rounded transition-colors bg-red-600 flex items-center"
              >
                👨‍💼 Admin <span className="ml-1">▼</span>
              </button>
              {activeDropdown === 'admin' && (
                <div className="absolute top-full left-0 mt-1 bg-white text-black rounded shadow-lg z-50 min-w-48">
                  <Link to="/admin/dashboard" className="block px-4 py-2 hover:bg-gray-100">
                    📊 Admin Dashboard
                  </Link>
                  <Link to="/admin/users" className="block px-4 py-2 hover:bg-gray-100">
                    👥 User Management
                  </Link>
                  <Link to="/admin/workspaces" className="block px-4 py-2 hover:bg-gray-100">
                    🏢 Workspaces
                  </Link>
                  <Link to="/admin/system-health" className="block px-4 py-2 hover:bg-gray-100">
                    💚 System Health
                  </Link>
                  <Link to="/admin/feature-flags" className="block px-4 py-2 hover:bg-gray-100">
                    🏴 Feature Flags
                  </Link>
                  <Link to="/admin/settings" className="block px-4 py-2 hover:bg-gray-100">
                    ⚙️ Admin Settings
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <Link
                    to="/all-pages"
                    className="block px-4 py-2 hover:bg-gray-100 font-bold text-blue-600"
                  >
                    📁 All Pages Directory
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Settings Dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('settings')}
              className="hover:text-blue-200 px-3 py-2 rounded transition-colors bg-gray-600 flex items-center"
            >
              ⚙️ Settings <span className="ml-1">▼</span>
            </button>
            {activeDropdown === 'settings' && (
              <div className="absolute top-full left-0 mt-1 bg-white text-black rounded shadow-lg z-50 min-w-48">
                <Link to="/settings" className="block px-4 py-2 hover:bg-gray-100">
                  ⚙️ General
                </Link>
                <Link to="/settings/appearance" className="block px-4 py-2 hover:bg-gray-100">
                  🎨 Appearance
                </Link>
                <Link to="/settings/notifications" className="block px-4 py-2 hover:bg-gray-100">
                  🔔 Notifications
                </Link>
                <Link to="/settings/security" className="block px-4 py-2 hover:bg-gray-100">
                  🔒 Security
                </Link>
                <Link to="/settings/api" className="block px-4 py-2 hover:bg-gray-100">
                  🔌 API Settings
                </Link>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('user')}
              className="hover:text-blue-200 px-3 py-2 rounded transition-colors bg-gray-700 flex items-center"
            >
              👤 User <span className="ml-1">▼</span>
            </button>
            {activeDropdown === 'user' && (
              <div className="absolute top-full right-0 mt-1 bg-white text-black rounded shadow-lg z-50 min-w-48">
                <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100">
                  👤 Profile
                </Link>
                <Link to="/settings" className="block px-4 py-2 hover:bg-gray-100">
                  ⚙️ Settings
                </Link>
                <Link
                  to="/all-pages"
                  className="block px-4 py-2 hover:bg-gray-100 font-bold text-blue-600"
                >
                  📁 Site Directory (All Pages)
                </Link>
                <div className="border-t border-gray-200"></div>
                <button
                  onClick={async () => {
                    try {
                      await logout();
                      setActiveDropdown(null);
                    } catch (error) {
                      console.error('Logout failed:', error);
                    }
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default SmartNavigation;
