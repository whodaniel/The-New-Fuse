import { useState, useEffect, useRef } from 'react';
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
  const isPublicPage = ['/', '/login', '/register', '/legal/privacy', '/legal/terms'].includes(location.pathname);

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

  // Public Navigation (for non-authenticated users)
  if (!isAuthenticated || isPublicPage) {
    return (
      <nav ref={navRef} className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-blue-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🚀</span>
                </div>
                <h1 className="ml-2 text-xl font-bold text-gray-900">The New Fuse</h1>
              </Link>
            </div>
            
            {/* Public Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                to="/#features" 
                className="text-gray-500 hover:text-blue-600 transition-colors"
                onClick={(e) => {
                  if (location.pathname === '/') {
                    e.preventDefault();
                    const featuresElement = document.getElementById('features');
                    if (featuresElement) {
                      featuresElement.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
                }}
              >
                Features
              </Link>
              <Link to="/agents" className="text-gray-500 hover:text-blue-600 transition-colors">AI Agents</Link>
              <Link to="/workflows" className="text-gray-500 hover:text-blue-600 transition-colors">Workflows</Link>
              <Link to="/analytics" className="text-gray-500 hover:text-blue-600 transition-colors">Analytics</Link>
            </div>
            
            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-500 hover:text-blue-600 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Get Started Free
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
                <Link to="/agents" className="block px-4 py-2 hover:bg-gray-100">📋 All Agents</Link>
                <Link to="/agents/new" className="block px-4 py-2 hover:bg-gray-100">➕ Create Agent</Link>
                <Link to="/agents/unified-creator" className="block px-4 py-2 hover:bg-gray-100">🚀 Unified Creator</Link>
                <Link to="/dashboard/agents" className="block px-4 py-2 hover:bg-gray-100">📊 Agent Dashboard</Link>
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
                <Link to="/workflows" className="block px-4 py-2 hover:bg-gray-100">🔄 All Workflows</Link>
                <Link to="/workflows/builder" className="block px-4 py-2 hover:bg-gray-100">🛠️ Workflow Builder</Link>
                <Link to="/workflows/templates" className="block px-4 py-2 hover:bg-gray-100">📄 Templates</Link>
                <Link to="/workflows/executions" className="block px-4 py-2 hover:bg-gray-100">📊 Executions</Link>
              </div>
            )}
          </div>

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
                <Link to="/tasks" className="block px-4 py-2 hover:bg-gray-100">📋 All Tasks</Link>
                <Link to="/tasks/new" className="block px-4 py-2 hover:bg-gray-100">➕ New Task</Link>
                <Link to="/suggestions" className="block px-4 py-2 hover:bg-gray-100">💡 Suggestions</Link>
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
                <Link to="/workspace/overview" className="block px-4 py-2 hover:bg-gray-100">📋 Overview</Link>
                <Link to="/workspace/analytics" className="block px-4 py-2 hover:bg-gray-100">📊 Analytics</Link>
                <Link to="/workspace/members" className="block px-4 py-2 hover:bg-gray-100">👥 Members</Link>
                <Link to="/workspace/chat" className="block px-4 py-2 hover:bg-gray-100">💬 Chat</Link>
                <Link to="/workspace/settings" className="block px-4 py-2 hover:bg-gray-100">⚙️ Settings</Link>
              </div>
            )}
          </div>

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
                  <Link to="/admin/dashboard" className="block px-4 py-2 hover:bg-gray-100">📊 Admin Dashboard</Link>
                  <Link to="/admin/users" className="block px-4 py-2 hover:bg-gray-100">👥 User Management</Link>
                  <Link to="/admin/workspaces" className="block px-4 py-2 hover:bg-gray-100">🏢 Workspaces</Link>
                  <Link to="/admin/system-health" className="block px-4 py-2 hover:bg-gray-100">💚 System Health</Link>
                  <Link to="/admin/feature-flags" className="block px-4 py-2 hover:bg-gray-100">🏴 Feature Flags</Link>
                  <Link to="/admin/settings" className="block px-4 py-2 hover:bg-gray-100">⚙️ Admin Settings</Link>
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
                <Link to="/settings" className="block px-4 py-2 hover:bg-gray-100">⚙️ General</Link>
                <Link to="/settings/appearance" className="block px-4 py-2 hover:bg-gray-100">🎨 Appearance</Link>
                <Link to="/settings/notifications" className="block px-4 py-2 hover:bg-gray-100">🔔 Notifications</Link>
                <Link to="/settings/security" className="block px-4 py-2 hover:bg-gray-100">🔒 Security</Link>
                <Link to="/settings/api" className="block px-4 py-2 hover:bg-gray-100">🔌 API Settings</Link>
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
                <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100">👤 Profile</Link>
                <Link to="/settings" className="block px-4 py-2 hover:bg-gray-100">⚙️ Settings</Link>
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
