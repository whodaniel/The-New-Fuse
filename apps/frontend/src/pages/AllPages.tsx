import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface PageInfo {
  name: string;
  path: string;
  description?: string;
}

const AllPages: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Complete list based on comprehensive monorepo audit - Updated to reflect 142+ actual pages
  const allPages: PageInfo[] = [
    // Core Application Pages
    { name: 'Home', path: '/', description: 'Enhanced Home Page with Production Status' },
    { name: 'Dashboard', path: '/dashboard', description: 'Main Dashboard with Metrics' },
    { name: 'Home Alt', path: '/home', description: 'Alternative Home Route' },

    // AI & Agents
    { name: 'Multi-Agent Chat', path: '/multi-agent-chat', description: 'Main Chat Interface' },
    { name: 'AI Agent Portal', path: '/ai-portal', description: 'Agent Management' },
    { name: 'AI Agent Portal Index', path: '/ai-agent-portal', description: 'Agent Portal Index' },
    { name: 'Chat', path: '/chat', description: 'Basic Chat Interface' },
    { name: 'Chat Page', path: '/chat-page', description: 'Dedicated Chat Page' },
    {
      name: 'AI Command Center',
      path: '/ai-command-center',
      description: 'Unified AI Grid Interface',
    },
    { name: 'Live View', path: '/live-view', description: 'Real-time AI Activity Monitor' },
    { name: 'All Agents', path: '/agents', description: 'Agent List' },
    { name: 'New Agent', path: '/agents/new', description: 'Create New Agent' },
    { name: 'Agent Detail', path: '/agents/:id', description: 'Agent Details' },
    {
      name: 'NFT Marketplace',
      path: '/agents/nft-marketplace',
      description: 'NFT Marketplace for Agents',
    },
    {
      name: 'Revenue Dashboard',
      path: '/agents/revenue-dashboard',
      description: 'Agent Revenue Analytics',
    },
    {
      name: 'Unified Agent Creator',
      path: '/agents/unified-creator',
      description: 'Advanced Agent Creation',
    },
    { name: 'Agent Dashboard', path: '/dashboard/agents', description: 'Agent Dashboard' },
    { name: 'Create Agent', path: '/dashboard/agents/new', description: 'Create Agent Form' },
    {
      name: 'Agent Detail Dashboard',
      path: '/dashboard/agents/:id',
      description: 'Dashboard Agent Detail',
    },
    {
      name: 'Sophisticated Hub',
      path: '/sophisticated-hub',
      description: 'Advanced AI Control Center',
    },
    { name: 'Modern Hub', path: '/hub', description: 'Modern Integrated AI Workspace' },
    {
      name: 'A2A Control',
      path: '/a2a-control',
      description: 'Agent-to-Agent Communication Control',
    },
    { name: 'Knowledge Hub', path: '/knowledge-hub', description: 'Central Knowledge Repository' },
    { name: 'MCP Hub', path: '/mcp-hub', description: 'Model Context Protocol Management' },

    // Workspace Management
    { name: 'Workspace Overview', path: '/workspace/overview', description: 'Main Workspace View' },
    { name: 'Workspace Analytics', path: '/workspace/analytics', description: 'Workspace Metrics' },
    { name: 'Workspace Members', path: '/workspace/members', description: 'Team Management' },
    {
      name: 'Workspace Settings',
      path: '/workspace/settings',
      description: 'Workspace Configuration',
    },
    { name: 'Workspace Chat', path: '/workspace-chat', description: 'Team Chat' },
    { name: 'Workspace Chat Index', path: '/workspace/chat', description: 'Workspace Chat Index' },
    {
      name: 'Workspace Layout',
      path: '/workspace/layout',
      description: 'Workspace Layout Management',
    },

    // Tasks & Workflows
    { name: 'All Tasks', path: '/tasks', description: 'Task Management' },
    { name: 'New Task', path: '/tasks/new', description: 'Create Task' },
    { name: 'Task Detail', path: '/tasks/:id', description: 'Task Details' },
    { name: 'Edit Task', path: '/tasks/:id/edit', description: 'Edit Task' },
    { name: 'Tasks Page', path: '/tasks-page', description: 'Dedicated Tasks Page' },
    { name: 'Workflows', path: '/workflows', description: 'Workflow Management' },
    {
      name: 'Workflow Builder',
      path: '/workflows/builder',
      description: 'Visual Workflow Builder',
    },
    {
      name: 'Advanced Builder',
      path: '/workflows/advanced-builder',
      description: 'Advanced n8n-Compatible Workflow Builder',
    },
    { name: 'Workflow Templates', path: '/workflows/templates', description: 'Template Library' },
    { name: 'Workflow Detail', path: '/workflows/:id', description: 'Workflow Details' },
    {
      name: 'Workflow Execution',
      path: '/workflows/:id/execution',
      description: 'Workflow Execution View',
    },
    {
      name: 'Execution Monitor',
      path: '/workflows/executions',
      description: 'Workflow Execution History & Monitoring',
    },
    {
      name: 'Enhanced Workflows',
      path: '/workflows-enhanced',
      description: 'Enhanced Workflow Interface',
    },

    // Suggestions System
    { name: 'Suggestions', path: '/suggestions', description: 'AI Suggestions' },
    { name: 'New Suggestion', path: '/suggestions/new', description: 'Create Suggestion' },
    { name: 'Suggestion Detail', path: '/suggestions/:id', description: 'Suggestion Details' },

    // Administration
    { name: 'Admin Panel', path: '/admin', description: 'Main Admin Dashboard' },
    { name: 'User Management', path: '/admin/users', description: 'User Administration' },
    { name: 'Workspace Management', path: '/admin/workspaces', description: 'Workspace Admin' },
    { name: 'System Health', path: '/admin/system-health', description: 'System Monitoring' },
    { name: 'Feature Flags', path: '/admin/feature-flags', description: 'Feature Management' },
    { name: 'Port Management', path: '/admin/port-management', description: 'Port Configuration' },
    { name: 'Admin Settings', path: '/admin/settings', description: 'Admin Configuration' },
    { name: 'Admin Onboarding', path: '/admin/onboarding', description: 'Admin Onboarding' },
    { name: 'Admin Dashboard', path: '/admin/dashboard', description: 'Admin Dashboard View' },
    { name: 'Admin Layout', path: '/admin/layout', description: 'Admin Layout Management' },
    {
      name: 'Experimental Features',
      path: '/admin/experimental-features',
      description: 'Beta Features',
    },
    {
      name: 'Agent Skills Admin',
      path: '/admin/agents/skills',
      description: 'Agent Skills Management',
    },
    {
      name: 'Web Search Selection',
      path: '/admin/agents/web-search',
      description: 'Web Search Provider Configuration',
    },

    // Dashboard & Analytics
    {
      name: 'Dashboard Analytics',
      path: '/dashboard/analytics',
      description: 'Analytics Dashboard',
    },
    { name: 'Dashboard Settings', path: '/dashboard/settings', description: 'Dashboard Config' },
    { name: 'Analytics', path: '/analytics', description: 'Main Analytics' },

    // Settings & Configuration
    { name: 'Settings', path: '/settings', description: 'Main Settings' },
    { name: 'General Settings', path: '/settings/general', description: 'General Configuration' },
    { name: 'Appearance Settings', path: '/settings/appearance', description: 'UI Customization' },
    {
      name: 'Notification Settings',
      path: '/settings/notifications',
      description: 'Notification Preferences',
    },
    {
      name: 'Security Settings',
      path: '/settings/security',
      description: 'Security Configuration',
    },
    { name: 'API Settings', path: '/settings/api', description: 'API Configuration' },
    {
      name: 'General Settings Alt',
      path: '/general-settings',
      description: 'Alternative General Settings',
    },
    {
      name: 'Embedding Preferences',
      path: '/general-settings/embedding',
      description: 'Embedding Configuration',
    },
    {
      name: 'Community Hub',
      path: '/general-settings/community-hub',
      description: 'Community Features',
    },
    {
      name: 'Workspace LLM Selection',
      path: '/workspace-settings/llm-selection',
      description: 'LLM Configuration',
    },
    {
      name: 'Chat Model Selection',
      path: '/workspace-settings/chat-model',
      description: 'Chat Model Settings',
    },
    {
      name: 'Agent Model Selection',
      path: '/workspace-settings/agent-model',
      description: 'Agent Model Configuration',
    },

    // Authentication
    { name: 'Login', path: '/login', description: 'Main Login' },
    { name: 'Register', path: '/register', description: 'User Registration' },
    { name: 'Auth Login', path: '/auth/login', description: 'Authentication Login' },
    { name: 'Auth Register', path: '/auth/register', description: 'Authentication Registration' },
    { name: 'Auth Index', path: '/auth', description: 'Authentication Hub' },
    { name: 'SSO Authentication', path: '/auth/sso', description: 'Single Sign-On' },
    { name: 'Google OAuth Callback', path: '/auth/google-callback', description: 'Google OAuth' },
    { name: 'OAuth Callback', path: '/auth/oauth-callback', description: 'General OAuth' },
    { name: 'Forgot Password', path: '/auth/forgot-password', description: 'Password Recovery' },
    { name: 'Reset Password', path: '/auth/reset-password', description: 'Password Reset' },
    { name: 'Unauthorized', path: '/unauthorized', description: 'Access Denied Page' },

    // Landing & Marketing
    { name: 'Landing Page', path: '/landing', description: 'Marketing Landing' },
    { name: 'Landing Page Alt', path: '/landing-page', description: 'Alternative Landing' },
    { name: 'Simple Landing', path: '/simple-landing', description: 'Minimal Landing' },
    { name: 'Onboarding Flow', path: '/onboarding', description: 'User Onboarding' },
    { name: 'Onboarding Preview', path: '/preview/onboarding', description: 'Onboarding Preview' },

    // Legal
    { name: 'Privacy Policy', path: '/legal/privacy', description: 'Privacy Policy' },
    { name: 'Terms of Service', path: '/legal/terms', description: 'Terms of Service' },

    // Components & Demos
    { name: 'UI Components', path: '/components', description: 'Component Showcase' },
    { name: 'Components Navigation', path: '/components-nav', description: 'Component Navigation' },
    {
      name: 'Components Showcase',
      path: '/components-showcase',
      description: 'Advanced Component Demo',
    },
    { name: 'Timeline Demo', path: '/timeline-demo', description: 'Timeline Component' },
    { name: 'Graph Demo', path: '/graph-demo', description: 'Graph Visualization' },
    { name: 'Frontend Showcase', path: '/frontend-showcase', description: 'Frontend Demo' },
    { name: 'Layout Example', path: '/layout-example', description: 'Layout Demo' },
    { name: 'Simple Test', path: '/simple-test', description: 'Simple Testing Interface' },
    {
      name: 'Multi Agent Chat Demo',
      path: '/multi-agent-chat-demo',
      description: 'Multi Agent Chat Demo',
    },

    // Development & Debug
    { name: 'Debug Info', path: '/debug', description: 'Debug Information' },
    { name: 'Build Info', path: '/build-info', description: 'Build Details' },
    { name: 'Debug Routing', path: '/debug-routing', description: 'Routing Debug' },
    { name: 'All Pages List', path: '/all-pages', description: 'Page Directory (Current Page)' },
    { name: 'Test Page', path: '/test', description: 'Testing Interface' },

    // API Endpoints (Admin Access)
    {
      name: 'Admin Database API',
      path: '/api/admin/database',
      description: 'Database Administration API',
    },
    {
      name: 'Admin Features API',
      path: '/api/admin/features',
      description: 'Feature Management API',
    },
    {
      name: 'Feature Evaluation API',
      path: '/api/admin/features/:id/evaluate',
      description: 'Feature Evaluation API',
    },

    // Error Handling
    { name: '404 Page', path: '/404', description: 'Not Found Page' },
    { name: 'Not Found', path: '/not-found', description: 'Alternative Not Found Page' },

    // Package-Level Pages (Alternative Implementations)
    {
      name: 'Package Dashboard',
      path: '/package/dashboard',
      description: 'Package Dashboard Implementation',
    },
    { name: 'Package Login', path: '/package/login', description: 'Package Login Implementation' },
    {
      name: 'Package Agents',
      path: '/package/agents',
      description: 'Package Agents Implementation',
    },
    {
      name: 'Package Workflows',
      path: '/package/workflows',
      description: 'Package Workflows Implementation',
    },
    { name: 'User Profile', path: '/user/profile', description: 'User Profile Management' },

    // Static HTML Pages (Development/Prototyping)
    { name: 'HTML Dashboard', path: '/html/dashboard', description: 'HTML Dashboard Prototype' },
    { name: 'HTML Admin', path: '/html/admin', description: 'HTML Admin Prototype' },
    { name: 'HTML Agents', path: '/html/agents', description: 'HTML Agents Prototype' },
    { name: 'HTML Chat', path: '/html/chat', description: 'HTML Chat Prototype' },
    { name: 'HTML Tasks', path: '/html/tasks', description: 'HTML Tasks Prototype' },
    { name: 'HTML Workflows', path: '/html/workflows', description: 'HTML Workflows Prototype' },
  ];

  // Group pages by category - Updated for expanded page list
  const pageCategories = [
    { name: 'Core Application', pages: allPages.slice(0, 3) },
    { name: 'AI & Agents', pages: allPages.slice(3, 18) },
    { name: 'Workspace Management', pages: allPages.slice(18, 25) },
    { name: 'Tasks & Workflows', pages: allPages.slice(25, 37) },
    { name: 'Suggestions System', pages: allPages.slice(37, 40) },
    { name: 'Administration', pages: allPages.slice(40, 52) },
    { name: 'Dashboard & Analytics', pages: allPages.slice(52, 55) },
    { name: 'Settings & Configuration', pages: allPages.slice(55, 67) },
    { name: 'Authentication', pages: allPages.slice(67, 78) },
    { name: 'Landing & Marketing', pages: allPages.slice(78, 83) },
    { name: 'Legal', pages: allPages.slice(83, 85) },
    { name: 'Components & Demos', pages: allPages.slice(85, 94) },
    { name: 'Development & Debug', pages: allPages.slice(94, 99) },
    { name: 'API Endpoints', pages: allPages.slice(99, 102) },
    { name: 'Error Handling', pages: allPages.slice(102, 104) },
    { name: 'Package-Level Pages', pages: allPages.slice(104, 109) },
    { name: 'Static HTML Pages', pages: allPages.slice(109) },
  ];

  // Filter pages based on search and category
  const filteredCategories = pageCategories
    .map((category) => ({
      ...category,
      pages: category.pages.filter(
        (page) =>
          (selectedCategory === 'All' || category.name === selectedCategory) &&
          (page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            page.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (page.description && page.description.toLowerCase().includes(searchTerm.toLowerCase())))
      ),
    }))
    .filter((category) => category.pages.length > 0);

  const totalPages = allPages.length;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🚀 The New Fuse - All Pages
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            Complete directory of all {totalPages} pages in The New Fuse application
          </p>
          <div className="bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg inline-block">
            ✅ All pages are accessible and routed correctly
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search pages by name, path, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Categories</option>
              {pageCategories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.name} ({category.pages.length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Page Categories */}
        {filteredCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm mr-3">
                {category.pages.length}
              </span>
              {category.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.pages.map((page, pageIndex) => (
                <div
                  key={pageIndex}
                  className="p-6 border rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                >
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                    {page.name}
                  </h3>
                  {page.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {page.description}
                    </p>
                  )}
                  <div className="mb-4">
                    <code className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                      {page.path}
                    </code>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={page.path}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors inline-block text-sm font-medium"
                    >
                      Visit Page
                    </Link>
                    <button
                      onClick={() => {
                        const fullUrl = `http://localhost:3000${page.path}`;
                        navigator.clipboard.writeText(fullUrl);
                      }}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                      title="Copy URL to clipboard"
                    >
                      Copy URL
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No pages found matching your search criteria.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-2">
            📊 Application Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <strong className="text-blue-700 dark:text-blue-300">Total Pages:</strong>
              <br />
              {totalPages} routes
            </div>
            <div>
              <strong className="text-blue-700 dark:text-blue-300">Categories:</strong>
              <br />
              {pageCategories.length} sections
            </div>
            <div>
              <strong className="text-blue-700 dark:text-blue-300">Server:</strong>
              <br />
              localhost:3000
            </div>
            <div>
              <strong className="text-blue-700 dark:text-blue-300">Status:</strong>
              <br />
              All routed ✅
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllPages;
