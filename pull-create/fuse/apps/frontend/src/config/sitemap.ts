/**
 * Application Sitemap Configuration
 *
 * This file defines the complete navigation structure of the application.
 * Used for:
 * - Navigation generation
 * - Breadcrumb trails
 * - SEO sitemap generation
 * - Dead link validation
 */

export interface SiteMapNode {
  path: string;
  title: string;
  description?: string;
  requiresAuth?: boolean;
  children?: SiteMapNode[];
  component?: string;
  isPublic?: boolean;
}

export const sitemap: SiteMapNode[] = [
  {
    path: '/',
    title: 'Home',
    isPublic: true,
    description: 'Welcome to The New Fuse - AI Agent Platform',
    children: [
      {
        path: '/dashboard',
        title: 'Dashboard',
        description: 'Your personal dashboard with key metrics',
        requiresAuth: true,
      },
      {
        path: '/analytics',
        title: 'Analytics',
        description: 'System analytics and performance metrics',
        requiresAuth: true,
      },
      {
        path: '/ai-portal',
        title: 'AI Portal',
        description: 'Manage and interact with AI agents',
        requiresAuth: true,
        children: [
          { path: '/agents', title: 'All Agents', requiresAuth: true },
          { path: '/agents/new', title: 'Create Agent', requiresAuth: true },
          { path: '/agents/:id', title: 'Agent Details', requiresAuth: true },
        ],
      },
      {
        path: '/multi-agent-chat',
        title: 'Multi-Agent Chat',
        description: 'Chat with multiple AI agents simultaneously',
        requiresAuth: true,
      },
    ],
  },
  {
    path: '/workflows',
    title: 'Workflows',
    description: 'Create and manage automation workflows',
    requiresAuth: true,
    children: [
      {
        path: '/workflows/templates',
        title: 'Templates',
        description: 'Pre-built workflow templates',
      },
      { path: '/workflows/execution', title: 'Executions', description: 'Monitor workflow runs' },
      { path: '/workflows/:id', title: 'Workflow Editor', description: 'Edit workflow details' },
    ],
  },
  {
    path: '/tasks',
    title: 'Tasks',
    description: 'Task management and tracking',
    requiresAuth: true,
    children: [
      { path: '/tasks/new', title: 'Create Task' },
      { path: '/tasks/:id', title: 'Task Details' },
      { path: '/tasks/:id/edit', title: 'Edit Task' },
    ],
  },
  {
    path: '/workspace',
    title: 'Workspace',
    description: 'Team workspace and collaboration',
    requiresAuth: true,
    children: [
      { path: '/workspace/overview', title: 'Overview', description: 'Workspace summary' },
      {
        path: '/workspace/analytics',
        title: 'Workspace Analytics',
        description: 'Team performance metrics',
      },
      { path: '/workspace/members', title: 'Members', description: 'Team member management' },
      { path: '/workspace/chat', title: 'Team Chat', description: 'Real-time team communication' },
    ],
  },
  {
    path: '/marketplace',
    title: 'Platform Overview',
    description: 'Public orientation page for product surfaces and navigation',
    requiresAuth: false,
  },
  {
    path: '/resources',
    title: 'Resources',
    description: 'Resource marketplace and library (legacy route)',
    requiresAuth: true,
  },
  {
    path: '/suggestions',
    title: 'Suggestions',
    description: 'Feature suggestions and feedback',
    requiresAuth: true,
    children: [
      { path: '/suggestions/new', title: 'New Suggestion' },
      { path: '/suggestions/:id', title: 'Suggestion Details' },
    ],
  },
  {
    path: '/admin',
    title: 'Admin',
    description: 'System administration',
    requiresAuth: true,
    children: [
      { path: '/admin/panel', title: 'Admin Panel', description: 'Main admin dashboard' },
      {
        path: '/admin/port-management',
        title: 'Port Management',
        description: 'Service port configuration',
      },
      {
        path: '/admin/system-health',
        title: 'System Health',
        description: 'System status monitoring',
      },
      {
        path: '/admin/agent-skills',
        title: 'Agent Skills',
        description: 'Configure agent capabilities',
      },
      {
        path: '/admin/web-search',
        title: 'Web Search Config',
        description: 'Search provider settings',
      },
      { path: '/admin/users', title: 'User Management', description: 'Manage system users' },
      { path: '/admin/features', title: 'Feature Flags', description: 'Toggle system features' },
    ],
  },
  {
    path: '/settings',
    title: 'Settings',
    description: 'User settings and preferences',
    requiresAuth: true,
    children: [
      { path: '/settings/profile', title: 'Profile', description: 'Personal profile settings' },
      { path: '/settings/security', title: 'Security', description: 'Security and password' },
      {
        path: '/settings/notifications',
        title: 'Notifications',
        description: 'Notification preferences',
      },
      { path: '/settings/api-keys', title: 'API Keys', description: 'Manage API access keys' },
    ],
  },
  {
    path: '/profile',
    title: 'Profile',
    description: 'User profile page',
    requiresAuth: true,
  },
  // Public pages
  {
    path: '/login',
    title: 'Login',
    isPublic: true,
  },
  {
    path: '/register',
    title: 'Register',
    isPublic: true,
  },
  // Dev/Showcase pages (can be public or auth-gated)
  {
    path: '/components-showcase',
    title: 'Component Showcase',
    description: 'UI component library showcase',
    requiresAuth: true,
  },
  {
    path: '/frontend-showcase',
    title: 'Frontend Showcase',
    description: 'Frontend design showcase',
    requiresAuth: true,
  },
];

/**
 * Helper function to get all routes as a flat array
 */
export function getAllRoutes(nodes: SiteMapNode[] = sitemap): string[] {
  const routes: string[] = [];

  for (const node of nodes) {
    routes.push(node.path);
    if (node.children) {
      routes.push(...getAllRoutes(node.children));
    }
  }

  return routes;
}

/**
 * Helper function to find a node by path
 */
export function findNodeByPath(
  path: string,
  nodes: SiteMapNode[] = sitemap
): SiteMapNode | undefined {
  for (const node of nodes) {
    if (node.path === path) {
      return node;
    }
    if (node.children) {
      const found = findNodeByPath(path, node.children);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Helper function to generate breadcrumbs for a given path
 */
export function getBreadcrumbs(path: string): { title: string; path: string }[] {
  const breadcrumbs: { title: string; path: string }[] = [];
  const segments = path.split('/').filter(Boolean);

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const node = findNodeByPath(currentPath);
    if (node) {
      breadcrumbs.push({ title: node.title, path: node.path });
    }
  }

  return breadcrumbs;
}
