import React from 'react';
import { useAuth } from '../providers/AuthProvider.js';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Welcome, {user?.displayName || 'User'}!</h2>
            <p className="text-gray-600 dark:text-gray-400">
              This is your dashboard where you can access all the features of The New Fuse.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick access cards */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg shadow-sm">
              <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Analytics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">View your analytics and performance metrics</p>
              <Link
                to="/analytics"
                className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
              >
                View Analytics →
              </Link>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg shadow-sm">
              <h3 className="font-medium text-green-800 dark:text-green-300 mb-2">AI Agent Portal</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Manage your AI agents and workflows</p>
              <Link
                to="/ai-agent-portal"
                className="text-green-600 dark:text-green-400 text-sm font-medium hover:underline"
              >
                Open Portal →
              </Link>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg shadow-sm">
              <h3 className="font-medium text-purple-800 dark:text-purple-300 mb-2">Settings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Configure your account and preferences</p>
              <Link
                to="/settings/general"
                className="text-purple-600 dark:text-purple-400 text-sm font-medium hover:underline"
              >
                Open Settings →
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Quick Navigation</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                to="/timeline-demo"
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded text-center text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Timeline Demo
              </Link>
              <Link
                to="/graph-demo"
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded text-center text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Graph Demo
              </Link>
              <Link
                to="/workspace/sample-workspace/overview"
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded text-center text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Sample Workspace
              </Link>
              <Link
                to="/all-pages"
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded text-center text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                All Pages
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Also keep the default export to prevent breaking other imports
export default Dashboard;
