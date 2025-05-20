import { Permission } from '@the-new-fuse/types';

export interface SiteMapNode {
  path: string;
  title: string;
  description?: string;
  requiredPermissions?: Permission[];
  children?: SiteMapNode[];
  component?: string;
  isPublic?: boolean;
}

export const sitemap: SiteMapNode[] = [
  {
    path: '/',
    title: 'Home',
    isPublic: true,
    children: [
      {
        path: '/dashboard',
        title: 'Dashboard',
        requiredPermissions: [Permission.VIEW_METRICS],
      },
      {
        path: '/workflows',
        title: 'Workflows',
        children: [
          { path: '/workflows/create', title: 'Create Workflow' },
          { path: '/workflows/list', title: 'My Workflows' },
          { path: '/workflows/templates', title: 'Templates' },
        ]
      }
    ]
  },
  {
    path: '/admin',
    title: 'Admin',
    requiredPermissions: [Permission.MANAGE_SYSTEM],
    children: [
      {
        path: '/admin/dashboard',
        title: 'Admin Dashboard',
        component: 'SystemMetrics'
      },
      {
        path: '/admin/users',
        title: 'Users & Roles',
        requiredPermissions: [Permission.MANAGE_USERS],
        children: [
          { path: '/admin/users/list', title: 'User Management' },
          { path: '/admin/users/roles', title: 'Role Management' }
        ]
      },
      {
        path: '/admin/services',
        title: 'Services',
        requiredPermissions: [Permission.MANAGE_SERVICES]
      },
      {
        path: '/admin/monitoring',
        title: 'Monitoring',
        requiredPermissions: [Permission.VIEW_METRICS],
        children: [
          { path: '/admin/monitoring/api', title: 'API Monitor' },
          { path: '/admin/monitoring/performance', title: 'Performance' },
          { path: '/admin/monitoring/errors', title: 'Error Logs' }
        ]
      },
      {
        path: '/admin/config',
        title: 'Configuration',
        requiredPermissions: [Permission.MANAGE_SYSTEM],
        children: [
          { path: '/admin/config/system', title: 'System Settings' },
          { path: '/admin/config/features', title: 'Feature Flags' }
        ]
      },
      {
        path: '/admin/database',
        title: 'Database',
        requiredPermissions: [Permission.MANAGE_DATABASE]
      },
      {
        path: '/admin/scripts',
        title: 'Scripts',
        requiredPermissions: [Permission.RUN_SCRIPTS]
      },
      {
        path: '/admin/audit',
        title: 'Audit Logs',
        requiredPermissions: [Permission.VIEW_LOGS]
      }
    ]
  },
  {
    path: '/agents',
    title: 'Agents',
    children: [
      { path: '/agents/marketplace', title: 'Marketplace' },
      { path: '/agents/my-agents', title: 'My Agents' },
      { path: '/agents/create', title: 'Create Agent' }
    ]
  },
  {
    path: '/settings',
    title: 'Settings',
    children: [
      { path: '/settings/profile', title: 'Profile' },
      { path: '/settings/security', title: 'Security' },
      { path: '/settings/notifications', title: 'Notifications' },
      { path: '/settings/api-keys', title: 'API Keys' }
    ]
  }
];
