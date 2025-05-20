import React from 'react';
import { Link } from 'react-router-dom';

// No need to import these components as we're just linking to their routes

interface PageInfo {
  name: string;
  path: string;
  description?: string;
}

const AllPages: React.FC = () => {
  // Define all pages with their paths
  const pages = [
    // Main pages
    { name: 'Landing', path: '/', description: 'Main landing page'},
    { name: 'Dashboard', path: '/dashboard', description: 'Main dashboard (requires login)'},

    // Auth pages
    { name: 'Login', path: '/auth/login', description: 'User login page'},
    { name: 'Register', path: '/auth/register', description: 'User registration page'},
    { name: 'Forgot Password', path: '/auth/forgot-password', description: 'Password recovery page'},
    { name: 'Reset Password', path: '/auth/reset-password/token', description: 'Password reset page'},
    { name: 'SSO', path: '/auth/sso/google', description: 'Single sign-on page'},

    // Demo pages
    { name: 'Timeline Demo', path: '/timeline-demo', description: 'Timeline feature demonstration'},
    { name: 'Graph Demo', path: '/graph-demo', description: 'Graph visualization demo'},

    // Analytics
    { name: 'Analytics', path: '/analytics', description: 'Analytics dashboard (requires login)'},

    // Admin pages
    { name: 'Admin Dashboard', path: '/admin/dashboard', description: 'Admin dashboard (requires login)'},
    { name: 'Admin Users', path: '/admin/users', description: 'User management (requires login)'},
    { name: 'Admin Workspaces', path: '/admin/workspaces', description: 'Workspace management (requires login)'},
    { name: 'System Health', path: '/admin/system-health', description: 'System health monitoring (requires login)'},
    { name: 'Admin Settings', path: '/admin/settings', description: 'Admin settings (requires login)'},

    // Workspace pages
    { name: 'Workspaces', path: '/workspace', description: 'Workspace management (requires login)'},

    // Settings pages
    { name: 'Settings', path: '/settings', description: 'User settings (requires login)'},
    { name: 'General Settings', path: '/settings/general', description: 'General settings (requires login)'},
    { name: 'Appearance', path: '/settings/appearance', description: 'Appearance settings (requires login)'},
    { name: 'API Keys', path: '/settings/api', description: 'API key management (requires login)'},
    { name: 'Security', path: '/settings/security', description: 'Security settings (requires login)'},
    { name: 'Notifications', path: '/settings/notifications', description: 'Notification settings (requires login)'},

    // Feature pages
    { name: 'AI Agent Portal', path: '/ai-agent-portal', description: 'AI agent management portal (requires login)'},

    // Legal pages
    { name: 'Terms of Service', path: '/terms', description: 'Terms of service page'},
    { name: 'Privacy Policy', path: '/privacy', description: 'Privacy policy page'},

    // Support pages
    { name: 'Help Center', path: '/help', description: 'Help and support center'},
    { name: 'Documentation', path: '/documentation', description: 'Documentation pages'},

    // Error pages
    { name: '404 Not Found', path: '/404', description: 'Error page for 404 errors'},
  ];

  // Group pages by category
  const pageCategories = [
    { name: 'Main Pages', pages: pages.slice(0, 2) },
    { name: 'Auth Pages', pages: pages.slice(2, 7) },
    { name: 'Demo Pages', pages: pages.slice(7, 9) },
    { name: 'Analytics', pages: pages.slice(9, 10) },
    { name: 'Admin Pages', pages: pages.slice(10, 15) },
    { name: 'Workspace Pages', pages: pages.slice(15, 16) },
    { name: 'Settings Pages', pages: pages.slice(16, 22) },
    { name: 'Feature Pages', pages: pages.slice(22, 23) },
    { name: 'Legal Pages', pages: pages.slice(23, 25) },
    { name: 'Support Pages', pages: pages.slice(25, 27) },
    { name: 'Error Pages', pages: pages.slice(27) },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">The New Fuse - All Pages</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
          This page provides links to all available pages in The New Fuse application.
          Use this for navigation during development and testing.
        </p>

        {pageCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 border-b pb-2">{category.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.pages.map((page, pageIndex) => (
                <div key={pageIndex} className="p-6 border rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{page.name}</h3>
                  {page.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{page.description}</p>
                  )}
                  <p className="text-xs font-mono text-gray-500 dark:text-gray-500 mb-4 bg-gray-100 dark:bg-gray-700 p-1 rounded">{page.path}</p>
                  <div className="mt-4">
                    <Link
                      to={page.path}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors inline-block"
                    >
                      View Page
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllPages;
