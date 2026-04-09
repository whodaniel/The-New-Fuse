/**
 * Application Sitemap Configuration
 *
 * MAXIMALLY INCLUSIVE — Cross-referenced against 32 source files:
 *
 *  Code Files:
 *   - ComprehensiveRouter.tsx (runtime routes, ~150+ routes)
 *   - routeCatalog.ts (dev catalog, 123+ entries)
 *   - sidebarNavigation.ts (sidebar menu)
 *   - experienceArchitecture.ts (domain model)
 *   - legacyRedirects.ts (redirect table)
 *   - PremiumLayout.tsx (layout padding rules)
 *   - SmartNavigation.tsx (public nav)
 *   - routes/index.ts, routes/core.routes.tsx, routes/auth.routes.tsx
 *   - types/routes.ts (route types)
 *
 *  Documentation:
 *   - docs/reference/NAVIGATION_MAP.md
 *   - docs/reference/SITEMAP.md
 *   - docs/reference/routing-structure.md
 *   - docs/reference/all-pages-list.md
 *   - docs/reference/pages-by-directory.md
 *   - docs/reference/pages-by-function.md
 *   - docs/reference/pages-by-type.md
 *   - docs/reference/visual-sitemap.md
 *   - docs/reference/COMPONENTS.md
 *   - docs/ui-ux/UX_AUDIT_COMPREHENSIVE_PAGE_INVENTORY.md
 *   - docs/ui-ux/UI_UX_TRANSFORMATION_ROADMAP.md
 *   - docs/ui-ux/UX_AUDIT_SUMMARY.md
 *   - docs/ui-ux/FEATURE_SHOWCASE_SUMMARY.md
 *   - docs/ui-ux/LANDING_PAGE_OPTIMIZATION.md
 *   - docs/roadmaps/PRODUCT_EXPERIENCE_ARCHITECTURE_2026-03-03.md
 *   - docs/release/TNF_FRONTEND_RELEASE_BOARD_2026-03-03.md
 *   - docs/COMPLETE_URL_MAP.md
 *   - docs/LAUNCH_BACKLOG.md
 *   - docs/LAUNCHPAD.md
 *   - docs/services/TIMELINE_SERVICE_SPEC.md
 *   - docs/services/BIZPLAN_AUDIT_REFERENCE.md
 *   - docs/project-planning/UI_INTEGRATION_PLAN.md
 *   - docs/project/COMPONENT_STATUS.md
 *
 * Last reconciled: 2026-04-05 (32-source deep audit)
 *
 * Used for:
 * - Navigation generation & breadcrumbs
 * - SEO sitemap generation
 * - Dead link validation & coverage audits
 * - Surface lifecycle tracking
 */

export interface SiteMapNode {
  path: string;
  title: string;
  description?: string;
  requiresAuth?: boolean;
  children?: SiteMapNode[];
  component?: string;
  isPublic?: boolean;
  /** lifecycle: production | beta | internal | deprecated */
  lifecycle?: 'production' | 'beta' | 'internal' | 'deprecated';
  /** Source doc(s) where this route was mentioned */
  sources?: string[];
}

export const sitemap: SiteMapNode[] = [
  // ═══════════════════════════════════════════════════
  // CORE APPLICATION
  // ═══════════════════════════════════════════════════
  {
    path: '/',
    title: 'Home',
    isPublic: true,
    lifecycle: 'production',
    description: 'Welcome to The New Fuse - AI Agent Platform',
    children: [
      {
        path: '/dashboard',
        title: 'Dashboard',
        description: 'Main Dashboard with Metrics',
        requiresAuth: true,
        lifecycle: 'production',
        children: [
          { path: '/dashboard/analytics', title: 'Analytics', requiresAuth: true },
          { path: '/dashboard/architecture', title: 'Architecture', requiresAuth: true },
          { path: '/dashboard/observability', title: 'Observability', requiresAuth: true },
          { path: '/dashboard/logs', title: 'Logs', requiresAuth: true },
          { path: '/dashboard/settings', title: 'Dashboard Settings', requiresAuth: true },
          { path: '/dashboard/agents', title: 'Agent Dashboard', requiresAuth: true },
          { path: '/dashboard/agents/new', title: 'Create Agent', requiresAuth: true },
          { path: '/dashboard/agents/:id', title: 'Dashboard Agent Detail', requiresAuth: true },
        ],
      },
      {
        path: '/analytics',
        title: 'Analytics',
        description: 'System analytics and performance metrics',
        requiresAuth: true,
        lifecycle: 'production',
        children: [
          {
            path: '/analytics/dashboard',
            title: 'Analytics Dashboard',
            requiresAuth: true,
            sources: ['NAVIGATION_MAP.md'],
          },
          {
            path: '/analytics/reports',
            title: 'Reports',
            requiresAuth: true,
            sources: ['NAVIGATION_MAP.md'],
          },
          {
            path: '/analytics/visualization',
            title: 'Visualization',
            requiresAuth: true,
            sources: ['NAVIGATION_MAP.md'],
          },
        ],
      },
    ],
  },
  {
    path: '/home',
    title: 'Home Alt / Dev Index',
    description: 'Complete Page Directory (Dev Index)',
    isPublic: true,
    lifecycle: 'internal',
  },
  { path: '/home-page', title: 'Home Page Alt', isPublic: true, lifecycle: 'deprecated' },
  {
    path: '/launchpad',
    title: 'Launchpad',
    description: 'TNF Launchpad Dashboard',
    requiresAuth: true,
    lifecycle: 'production',
    sources: ['LAUNCH_BACKLOG.md', 'LAUNCHPAD.md'],
  },
  {
    path: '/perpetual-status',
    title: 'Perpetual Status',
    description: 'Perpetual swarm status monitor',
    requiresAuth: true,
    lifecycle: 'production',
    sources: ['LAUNCH_BACKLOG.md'],
  },
  { path: '/activity', title: 'Activity Log', requiresAuth: true, sources: ['visual-sitemap.md'] },
  {
    path: '/notifications',
    title: 'Notifications Center',
    requiresAuth: true,
    sources: ['visual-sitemap.md'],
  },

  // ═══════════════════════════════════════════════════
  // AI & AGENTS
  // ═══════════════════════════════════════════════════
  {
    path: '/ai-portal',
    title: 'AI Agent Portal',
    description: 'Manage and interact with AI agents',
    requiresAuth: true,
    lifecycle: 'production',
    children: [
      { path: '/agents', title: 'Agent Fleet', requiresAuth: true },
      { path: '/agents/new', title: 'Create Agent', requiresAuth: true },
      { path: '/agents/:id', title: 'Agent Details', requiresAuth: true },
      {
        path: '/agents/:id/edit',
        title: 'Edit Agent',
        requiresAuth: true,
        sources: ['visual-sitemap.md'],
      },
      {
        path: '/agents/:id/logs',
        title: 'Agent Logs',
        requiresAuth: true,
        sources: ['visual-sitemap.md'],
      },
      {
        path: '/agents/:id/monitoring',
        title: 'Agent Monitoring',
        requiresAuth: true,
        sources: ['visual-sitemap.md'],
      },
      {
        path: '/agents/:id/identity',
        title: 'Agent Identity',
        requiresAuth: true,
        sources: ['routeCatalog.ts'],
      },
      { path: '/agents/onboard', title: 'Agent Onboarding', requiresAuth: true },
      { path: '/agents/unified-creator', title: 'Unified Agent Creator', requiresAuth: true },
      { path: '/agents/profiles', title: 'Agent Profiles', requiresAuth: true },
      { path: '/agents/profiles/:slug', title: 'Catalog Profile', requiresAuth: true },
      {
        path: '/agents/marketplace',
        title: 'Agent Marketplace',
        requiresAuth: true,
        sources: ['NAVIGATION_MAP.md', 'visual-sitemap.md'],
      },
      {
        path: '/agents/list',
        title: 'Agent List (Alias)',
        requiresAuth: true,
        sources: ['NAVIGATION_MAP.md'],
      },
      {
        path: '/ai-portal/pfp-studio',
        title: 'PFP Studio',
        description: 'Batch portrait operations, regenerate, and image replacement',
        requiresAuth: true,
      },
      {
        path: '/ai-portal/pfp-prompts',
        title: 'Prompt Catalog',
        description: 'Prompt editing and prompt-to-image operations',
        requiresAuth: true,
      },
      { path: '/agents/pfp-studio', title: 'PFP Studio (Agent Path)', requiresAuth: true },
      { path: '/agents/pfp-prompts', title: 'PFP Prompts (Agent Path)', requiresAuth: true },
      { path: '/agents/nft-marketplace', title: 'NFT Marketplace', requiresAuth: true },
      { path: '/agents/revenue-dashboard', title: 'Revenue Dashboard', requiresAuth: true },
    ],
  },
  {
    path: '/ai-agent-portal',
    title: 'AI Agent Portal Index',
    requiresAuth: true,
    sources: ['SITEMAP.md'],
    children: [
      {
        path: '/ai-agent-portal/marketplace',
        title: 'Discover Agents',
        requiresAuth: true,
        sources: ['SITEMAP.md'],
      },
      {
        path: '/ai-agent-portal/create',
        title: 'Agent Creation Studio',
        requiresAuth: true,
        sources: ['SITEMAP.md'],
      },
      {
        path: '/ai-agent-portal/training',
        title: 'Agent Training Arena',
        requiresAuth: true,
        sources: ['SITEMAP.md'],
      },
      {
        path: '/ai-agent-portal/workflows',
        title: 'Agent Workflow Manager',
        requiresAuth: true,
        sources: ['SITEMAP.md'],
      },
    ],
  },
  { path: '/ai-agents', title: 'AI Agents (Alias)', requiresAuth: true },
  { path: '/agent-builder', title: 'Agent Builder', requiresAuth: true },
  { path: '/agent-management', title: 'Agent Management (Alias)', requiresAuth: true },
  {
    path: '/ai-command-center',
    title: 'AI Command Center',
    description: 'Multiple AI chat interfaces in one view',
    requiresAuth: true,
    lifecycle: 'production',
  },
  {
    path: '/live-view',
    title: 'Live View',
    description: 'Real-time AI browser activity viewer',
    requiresAuth: true,
    lifecycle: 'production',
  },
  {
    path: '/sophisticated-hub',
    title: 'Sophisticated Hub',
    description: 'Advanced AI Control Center',
    requiresAuth: true,
    lifecycle: 'beta',
  },
  {
    path: '/hub',
    title: 'Modern Hub',
    description: 'Modern Integrated AI Workspace',
    requiresAuth: true,
    lifecycle: 'production',
  },
  {
    path: '/a2a-control',
    title: 'A2A Control',
    description: 'Agent-to-Agent Communication Control',
    requiresAuth: true,
    lifecycle: 'production',
  },
  {
    path: '/knowledge-hub',
    title: 'Knowledge Hub',
    description: 'Central Knowledge Repository',
    requiresAuth: true,
    lifecycle: 'production',
  },
  {
    path: '/mcp-hub',
    title: 'MCP Hub',
    description: 'Model Context Protocol Management',
    requiresAuth: true,
    lifecycle: 'production',
  },
  {
    path: '/memory/:agentId',
    title: 'Memory Inspector',
    requiresAuth: true,
    sources: ['all-pages-list.md'],
  },

  // ═══════════════════════════════════════════════════
  // CHAT & COMMUNICATION
  // ═══════════════════════════════════════════════════
  {
    path: '/chat',
    title: 'Chat',
    description: 'Multi-agent and team chat interfaces',
    requiresAuth: true,
    lifecycle: 'production',
    children: [
      {
        path: '/multi-agent-chat',
        title: 'Multi-Agent Chat',
        description: 'Chat with multiple AI agents simultaneously',
        requiresAuth: true,
      },
      { path: '/workspace-chat', title: 'Workspace Chat', requiresAuth: true },
      { path: '/channels', title: 'Channels', requiresAuth: true },
      { path: '/channels/*', title: 'Channel Detail', requiresAuth: true },
      { path: '/chats', title: 'Chats (Alias)', requiresAuth: true },
      {
        path: '/chat/rooms',
        title: 'Chat Rooms',
        requiresAuth: true,
        sources: ['NAVIGATION_MAP.md'],
      },
      {
        path: '/chat/room/:id',
        title: 'Chat Room',
        requiresAuth: true,
        sources: ['NAVIGATION_MAP.md'],
      },
      {
        path: '/chat/settings',
        title: 'Chat Settings',
        requiresAuth: true,
        sources: ['NAVIGATION_MAP.md'],
      },
    ],
  },
  { path: '/chat-page', title: 'Chat Page (Alt)', requiresAuth: true },
  {
    path: '/chat-room',
    title: 'Chat Room (Standalone)',
    requiresAuth: true,
    sources: ['SITEMAP.md'],
  },
  { path: '/multi-agent-chat-demo', title: 'Multi Agent Chat Demo', requiresAuth: true },
  {
    path: '/video-chat',
    title: 'Video Chat',
    requiresAuth: true,
    lifecycle: 'beta',
    sources: ['SITEMAP.md'],
  },

  // ═══════════════════════════════════════════════════
  // WORKFLOWS
  // ═══════════════════════════════════════════════════
  {
    path: '/workflows',
    title: 'Workflows',
    description: 'Create and manage automation workflows',
    requiresAuth: true,
    lifecycle: 'production',
    children: [
      { path: '/workflows/builder', title: 'Builder', description: 'Visual Workflow Builder' },
      {
        path: '/workflows/advanced-builder',
        title: 'Advanced Builder',
        description: 'n8n-Compatible Workflow Editor',
      },
      {
        path: '/workflows/templates',
        title: 'Templates',
        description: 'Pre-built workflow templates',
      },
      {
        path: '/workflows/executions',
        title: 'Executions',
        description: 'Workflow Execution History & Monitoring',
      },
      { path: '/workflows/console', title: 'Console', description: 'Execution console' },
      { path: '/workflows/new', title: 'Create Workflow', sources: ['visual-sitemap.md'] },
      { path: '/workflows/:id', title: 'Workflow Detail', description: 'Edit workflow details' },
      { path: '/workflows/:id/edit', title: 'Edit Workflow', sources: ['visual-sitemap.md'] },
      {
        path: '/workflows/:id/execution',
        title: 'Execution Detail',
        description: 'Run detail view',
      },
      { path: '/workflows/detail', title: 'Workflow Detail (Alias)' },
      { path: '/workflows/execution', title: 'Workflow Execution (Alias)' },
    ],
  },
  { path: '/workflows-enhanced', title: 'Enhanced Workflows', requiresAuth: true },
  { path: '/automations', title: 'Automations (Alias)', requiresAuth: true },
  // Singular aliases from NAVIGATION_MAP.md
  {
    path: '/workflow/list',
    title: 'Workflow List (Alias)',
    requiresAuth: true,
    sources: ['NAVIGATION_MAP.md'],
  },
  {
    path: '/workflow/editor/:id',
    title: 'Workflow Editor (Alias)',
    requiresAuth: true,
    sources: ['NAVIGATION_MAP.md'],
  },
  {
    path: '/workflow/templates',
    title: 'Workflow Templates (Alias)',
    requiresAuth: true,
    sources: ['NAVIGATION_MAP.md'],
  },

  // ═══════════════════════════════════════════════════
  // TASKS, GOALS, PLANS, SUGGESTIONS
  // ═══════════════════════════════════════════════════
  {
    path: '/tasks',
    title: 'Tasks',
    description: 'Task management and tracking',
    requiresAuth: true,
    lifecycle: 'production',
    children: [
      { path: '/tasks/new', title: 'Create Task' },
      { path: '/tasks/:id', title: 'Task Details' },
      { path: '/tasks/:id/edit', title: 'Edit Task' },
      { path: '/tasks/board', title: 'Kanban Board', sources: ['visual-sitemap.md'] },
      { path: '/tasks/calendar', title: 'Calendar View', sources: ['visual-sitemap.md'] },
      { path: '/tasks/reports', title: 'Task Reports', sources: ['visual-sitemap.md'] },
    ],
  },
  { path: '/tasks-page', title: 'Tasks Page (Alt)', requiresAuth: true },
  {
    path: '/suggestions',
    title: 'Suggestions',
    description: 'Feature suggestions and feedback',
    requiresAuth: true,
    lifecycle: 'production',
    children: [
      { path: '/suggestions/new', title: 'New Suggestion' },
      { path: '/suggestions/:id', title: 'Suggestion Details' },
      { path: '/suggestions/:id/edit', title: 'Edit Suggestion', sources: ['visual-sitemap.md'] },
    ],
  },
  {
    path: '/goals',
    title: 'Goals',
    description: 'Goal tracking and management',
    requiresAuth: true,
  },
  { path: '/goals/:id', title: 'Goal Detail', requiresAuth: true },
  { path: '/plans', title: 'Plans', description: 'Planning workspace', requiresAuth: true },
  { path: '/plans/:id', title: 'Plan Detail', requiresAuth: true },
  {
    path: '/timeline',
    title: 'Timeline',
    description: 'Unified timeline of platform events',
    requiresAuth: true,
  },
  {
    path: '/macro-timeline',
    title: 'Macro Timeline',
    description: 'High-level project timeline',
    requiresAuth: true,
  },
  { path: '/timeline/module', title: 'Timeline Module', requiresAuth: true },

  // ═══════════════════════════════════════════════════
  // WORKSPACE
  // ═══════════════════════════════════════════════════
  {
    path: '/workspace',
    title: 'Workspace',
    description: 'Team workspace and collaboration',
    requiresAuth: true,
    lifecycle: 'production',
    children: [
      { path: '/workspace/overview', title: 'Overview', description: 'Workspace summary' },
      {
        path: '/workspace/analytics',
        title: 'Workspace Analytics',
        description: 'Team performance metrics',
      },
      { path: '/workspace/members', title: 'Members', description: 'Team member management' },
      {
        path: '/workspace/settings',
        title: 'Workspace Settings',
        description: 'Workspace configuration',
      },
      {
        path: '/workspace/chat',
        title: 'Workspace Chat (Index)',
        description: 'Workspace Chat Index',
      },
      {
        path: '/workspace/layout',
        title: 'Workspace Layout',
        description: 'Workspace Layout Management',
      },
    ],
  },
  {
    path: '/marketplace',
    title: 'Marketplace',
    description: 'Resource marketplace and library',
    requiresAuth: false,
  },
  {
    path: '/resources',
    title: 'Resources',
    description: 'Resources marketplace dashboard',
    requiresAuth: true,
  },
  { path: '/skills', title: 'Skills', description: 'Skill browser', requiresAuth: true },
  { path: '/tools', title: 'Tools (Alias)', requiresAuth: true },
  { path: '/tools/*', title: 'Tools Detail', requiresAuth: true },
  {
    path: '/integrations',
    title: 'Integrations',
    description: 'Integration showcase',
    requiresAuth: true,
    sources: ['UX_AUDIT_SUMMARY.md'],
  },
  { path: '/integrations/*', title: 'Integration Detail', requiresAuth: true },
  {
    path: '/hosting',
    title: 'Hosting',
    description: 'Hosting target management',
    requiresAuth: true,
  },
  {
    path: '/spaces',
    title: 'Spaces',
    description: 'TNF Hosted project spaces',
    requiresAuth: true,
  },
  { path: '/space', title: 'Space (Alias)', requiresAuth: true },
  { path: '/terminal', title: 'Terminal Graph', requiresAuth: true },
  { path: '/models', title: 'Models (Alias)', requiresAuth: true },

  // ═══════════════════════════════════════════════════
  // INTEGRATION & API (from visual-sitemap.md)
  // ═══════════════════════════════════════════════════
  {
    path: '/integration',
    title: 'Integration & API',
    requiresAuth: true,
    sources: ['visual-sitemap.md'],
    children: [
      { path: '/integration/api-keys', title: 'API Keys Management', requiresAuth: true },
      { path: '/integration/webhooks', title: 'Webhooks Configuration', requiresAuth: true },
      { path: '/integration/third-party', title: 'Third-Party Integrations', requiresAuth: true },
      { path: '/integration/api-docs', title: 'API Documentation', requiresAuth: true },
      { path: '/integration/api-explorer', title: 'API Explorer', requiresAuth: true },
    ],
  },

  // ═══════════════════════════════════════════════════
  // ECOSYSTEM & MARKETPLACE
  // ═══════════════════════════════════════════════════
  {
    path: '/marketplace',
    title: 'Platform Marketplace',
    description: 'Resource marketplace and library',
    isPublic: true,
  },
  {
    path: '/nft/marketplace',
    title: 'NFT Marketplace (Public Path)',
    isPublic: true,
    sources: ['all-pages-list.md'],
  },
  {
    path: '/product-map',
    title: 'Product Map',
    description: 'Platform capabilities overview',
    isPublic: true,
  },
  { path: '/capabilities', title: 'Capabilities', isPublic: true },
  {
    path: '/connect',
    title: 'Connect Extension',
    description: 'Browser extension connection',
    requiresAuth: true,
  },

  // ═══════════════════════════════════════════════════
  // AGENCY
  // ═══════════════════════════════════════════════════
  {
    path: '/agency/dashboard',
    title: 'Agency Dashboard',
    description: 'White-label agency management',
    requiresAuth: true,
  },
  { path: '/agency/onboard', title: 'Agency Onboarding', requiresAuth: true },

  // ═══════════════════════════════════════════════════
  // ADMIN
  // ═══════════════════════════════════════════════════
  {
    path: '/admin',
    title: 'Admin',
    description: 'System administration',
    requiresAuth: true,
    lifecycle: 'production',
    children: [
      { path: '/admin/control-panel', title: 'Super Admin Control Panel' },
      { path: '/admin/dashboard', title: 'Admin Dashboard View' },
      { path: '/admin/users', title: 'User Management' },
      { path: '/admin/user-management', title: 'Full User Management' },
      { path: '/admin/workspaces', title: 'Workspace Management' },
      { path: '/admin/teams', title: 'Team Management', sources: ['visual-sitemap.md'] },
      { path: '/admin/agent-management', title: 'Full Agent Management' },
      { path: '/admin/system-health', title: 'System Health' },
      { path: '/admin/system-metrics', title: 'System Metrics Dashboard' },
      { path: '/admin/security', title: 'Security Dashboard', sources: ['all-pages-list.md'] },
      { path: '/admin/monitoring', title: 'System Monitoring', sources: ['all-pages-list.md'] },
      { path: '/admin/audit-logs', title: 'Audit Logs' },
      { path: '/admin/feature-flags', title: 'Feature Flags' },
      { path: '/admin/features', title: 'Feature Flags (Alias)', sources: ['all-pages-list.md'] },
      { path: '/admin/port-management', title: 'Port Management' },
      { path: '/admin/database', title: 'Database Panel' },
      { path: '/admin/api-analytics', title: 'API Analytics' },
      { path: '/admin/configuration', title: 'Configuration Management' },
      { path: '/admin/settings', title: 'Admin Settings' },
      { path: '/admin/backup-restore', title: 'Backup & Restore' },
      { path: '/admin/openclaw-security', title: 'OpenClaw Security' },
      { path: '/admin/marketplace', title: 'Marketplace Console' },
      { path: '/admin/onboarding', title: 'Admin Onboarding' },
      { path: '/admin/experimental-features', title: 'Experimental Features' },
      { path: '/admin/agents/skills', title: 'Agent Skills Management' },
      { path: '/admin/agents/web-search', title: 'Web Search Config' },
      {
        path: '/admin/agent-skills',
        title: 'Agent Skills (Alias)',
        sources: ['all-pages-list.md'],
      },
      { path: '/admin/web-search', title: 'Web Search (Alias)', sources: ['all-pages-list.md'] },
      { path: '/admin/usage', title: 'Usage Statistics', sources: ['visual-sitemap.md'] },
      { path: '/admin/billing', title: 'Admin Billing', sources: ['visual-sitemap.md'] },
      { path: '/admin/layout', title: 'Admin Layout' },
    ],
  },

  // ═══════════════════════════════════════════════════
  // SYSTEM OPERATIONS
  // ═══════════════════════════════════════════════════
  {
    path: '/observatory',
    title: 'Observatory',
    description: 'System observatory, 3D network visualizer',
    requiresAuth: true,
  },
  { path: '/nexus', title: 'Nexus 3D', description: '3D system visualizer', requiresAuth: true },
  {
    path: '/command-center',
    title: 'Command Center',
    description: 'TNF Command Core',
    requiresAuth: true,
  },
  { path: '/system', title: 'System (Alias)', requiresAuth: true },
  {
    path: '/platform-parity',
    title: 'Platform Parity',
    description: 'Competitive parity tracker',
    requiresAuth: true,
  },

  // ═══════════════════════════════════════════════════
  // SETTINGS & CONFIGURATION
  // ═══════════════════════════════════════════════════
  {
    path: '/settings',
    title: 'Settings',
    description: 'User settings and preferences',
    requiresAuth: true,
    lifecycle: 'production',
    children: [
      { path: '/settings/general', title: 'General' },
      { path: '/settings/appearance', title: 'Appearance' },
      { path: '/settings/notifications', title: 'Notifications' },
      { path: '/settings/security', title: 'Security' },
      { path: '/settings/api', title: 'API Keys' },
      {
        path: '/settings/profile',
        title: 'User Profile (Settings)',
        sources: ['NAVIGATION_MAP.md'],
      },
      { path: '/settings/preferences', title: 'User Preferences', sources: ['NAVIGATION_MAP.md'] },
      { path: '/settings/account', title: 'Account Settings', sources: ['visual-sitemap.md'] },
      {
        path: '/settings/api-access',
        title: 'Personal API Access',
        sources: ['visual-sitemap.md'],
      },
      { path: '/settings/teams', title: 'Team Membership', sources: ['visual-sitemap.md'] },
      {
        path: '/settings/embedding-preferences',
        title: 'Embedding Preferences (Alt)',
        sources: ['SITEMAP.md'],
      },
    ],
  },
  {
    path: '/general-settings',
    title: 'General Settings',
    requiresAuth: true,
    lifecycle: 'production',
    children: [
      { path: '/general-settings/embedding', title: 'Embedding Preferences' },
      { path: '/general-settings/community-hub', title: 'Community Hub (Settings)' },
      {
        path: '/general-settings/appearance',
        title: 'Appearance',
        sources: ['pages-by-directory.md'],
      },
      { path: '/general-settings/api-keys', title: 'API Keys', sources: ['pages-by-directory.md'] },
      { path: '/general-settings/security', title: 'Security', sources: ['pages-by-directory.md'] },
      {
        path: '/general-settings/privacy-data',
        title: 'Privacy & Data',
        sources: ['pages-by-directory.md'],
      },
      {
        path: '/general-settings/transcription',
        title: 'Transcription Preference',
        sources: ['pages-by-directory.md'],
      },
      {
        path: '/general-settings/browser-extension',
        title: 'Browser Extension API Key',
        sources: ['pages-by-directory.md'],
      },
      {
        path: '/general-settings/embed-chats',
        title: 'Embed Chats',
        sources: ['pages-by-directory.md'],
      },
      {
        path: '/general-settings/audio',
        title: 'Audio Preference',
        sources: ['pages-by-directory.md'],
      },
      {
        path: '/general-settings/vector-database',
        title: 'Vector Database',
        sources: ['pages-by-directory.md'],
      },
      {
        path: '/general-settings/llm',
        title: 'LLM Preference',
        sources: ['pages-by-directory.md'],
      },
      {
        path: '/general-settings/chats',
        title: 'Chats Settings',
        sources: ['pages-by-directory.md'],
      },
      {
        path: '/general-settings/embed-configs',
        title: 'Embed Configs',
        sources: ['pages-by-directory.md'],
      },
    ],
  },
  {
    path: '/workspace-settings',
    title: 'Workspace Settings',
    requiresAuth: true,
    children: [
      { path: '/workspace-settings/llm-selection', title: 'LLM Selection' },
      { path: '/workspace-settings/chat-model', title: 'Chat Model' },
      { path: '/workspace-settings/agent-model', title: 'Agent Model' },
    ],
  },
  { path: '/billing', title: 'Billing & Plans', requiresAuth: true },
  { path: '/membership', title: 'Membership', requiresAuth: true },
  { path: '/user/profile', title: 'User Profile', requiresAuth: true },
  { path: '/profile', title: 'Profile (Alias)', requiresAuth: true },

  // ═══════════════════════════════════════════════════
  // AUTHENTICATION (Public)
  // ═══════════════════════════════════════════════════
  { path: '/login', title: 'Login', isPublic: true },
  { path: '/register', title: 'Register', isPublic: true },
  { path: '/auth', title: 'Auth Index', isPublic: true },
  { path: '/auth/login', title: 'Auth Login', isPublic: true },
  { path: '/auth/register', title: 'Auth Register', isPublic: true },
  { path: '/auth/forgot-password', title: 'Forgot Password', isPublic: true },
  { path: '/auth/reset-password', title: 'Reset Password', isPublic: true },
  {
    path: '/auth/reset-password/:token',
    title: 'Reset Password (Token)',
    isPublic: true,
    sources: ['routing-structure.md'],
  },
  { path: '/auth/sso', title: 'SSO', isPublic: true },
  {
    path: '/auth/sso/:provider',
    title: 'SSO Provider',
    isPublic: true,
    sources: ['routing-structure.md'],
  },
  { path: '/auth/google-callback', title: 'Google OAuth Callback', isPublic: true },
  { path: '/auth/google/callback', title: 'Google OAuth Callback (Alt)', isPublic: true },
  { path: '/auth/callback', title: 'Auth Callback', isPublic: true },
  { path: '/auth/oauth-callback', title: 'OAuth Callback', isPublic: true },
  {
    path: '/verify-email',
    title: 'Email Verification',
    isPublic: true,
    sources: ['visual-sitemap.md'],
  },
  { path: '/unauthorized', title: 'Unauthorized', isPublic: true },
  {
    path: '/forgot-password',
    title: 'Forgot Password (Legacy)',
    isPublic: true,
    sources: ['routing-structure.md'],
  },

  // ═══════════════════════════════════════════════════
  // LANDING & MARKETING (Public)
  // ═══════════════════════════════════════════════════
  { path: '/landing', title: 'Landing Page', isPublic: true },
  { path: '/landing-page', title: 'Landing Page (Alt)', isPublic: true },
  { path: '/simple-landing', title: 'Simple Landing', isPublic: true },
  { path: '/community', title: 'Community Hub', isPublic: true },
  { path: '/support', title: 'Support', isPublic: true },
  { path: '/contact', title: 'Contact', isPublic: true },
  { path: '/brand', title: 'Brand Identity', isPublic: true },
  { path: '/design-system', title: 'Design System', isPublic: true },
  { path: '/blog', title: 'Blog', isPublic: true },
  { path: '/docs', title: 'Documentation', isPublic: true },
  { path: '/docs/*', title: 'Documentation (Nested)', isPublic: true },
  { path: '/pricing', title: 'Pricing', isPublic: true },
  { path: '/features', title: 'Features', isPublic: true },
  { path: '/onboarding', title: 'Onboarding Flow', isPublic: true },
  { path: '/onboarding/ai-agent', title: 'AI Agent Onboarding', isPublic: true },
  { path: '/visualizations', title: 'Visualizations', isPublic: true },
  { path: '/visualizations/terminals', title: 'Terminal Visualizations', isPublic: true },
  { path: '/terminals', title: 'Terminals', isPublic: true },
  // Universal compatibility aliases
  { path: '/about', title: 'About (Alias → Brand)', isPublic: true },
  { path: '/faq', title: 'FAQ (Alias → Docs)', isPublic: true },
  { path: '/comparisons', title: 'Comparisons', isPublic: true },
  { path: '/careers', title: 'Careers', isPublic: true },
  { path: '/ambassador', title: 'Ambassador', isPublic: true },
  { path: '/testimonials', title: 'Testimonials', isPublic: true },
  { path: '/platform', title: 'Platform (Alias → Product Map)', isPublic: true },
  { path: '/help', title: 'Help Center', isPublic: true, sources: ['routing-structure.md'] },
  {
    path: '/documentation',
    title: 'Documentation (Alt)',
    isPublic: true,
    sources: ['routing-structure.md'],
  },
  { path: '/terms', title: 'Terms (Legacy)', isPublic: true, sources: ['routing-structure.md'] },
  {
    path: '/privacy',
    title: 'Privacy (Legacy)',
    isPublic: true,
    sources: ['routing-structure.md'],
  },

  // ═══════════════════════════════════════════════════
  // HELP & SUPPORT (from visual-sitemap.md)
  // ═══════════════════════════════════════════════════
  {
    path: '/help',
    title: 'Help & Support',
    isPublic: true,
    sources: ['visual-sitemap.md'],
    children: [
      { path: '/help/documentation', title: 'Documentation', isPublic: true },
      { path: '/help/tutorials', title: 'Tutorials', isPublic: true },
      { path: '/help/faq', title: 'FAQ', isPublic: true },
      { path: '/help/support', title: 'Support Tickets', isPublic: true },
      { path: '/help/community', title: 'Community Forum', isPublic: true },
    ],
  },

  // ═══════════════════════════════════════════════════
  // LEGAL (Public)
  // ═══════════════════════════════════════════════════
  { path: '/legal/privacy', title: 'Privacy Policy', isPublic: true },
  { path: '/legal/terms', title: 'Terms of Service', isPublic: true },
  {
    path: '/legal/privacy-policy',
    title: 'Privacy Policy (Alt Path)',
    isPublic: true,
    sources: ['SITEMAP.md'],
  },
  {
    path: '/legal/terms-of-service',
    title: 'Terms of Service (Alt Path)',
    isPublic: true,
    sources: ['SITEMAP.md'],
  },

  // ═══════════════════════════════════════════════════
  // PREVIEW
  // ═══════════════════════════════════════════════════
  { path: '/preview/onboarding', title: 'Onboarding Preview', isPublic: true },

  // ═══════════════════════════════════════════════════
  // COMPONENTS & DEMOS
  // ═══════════════════════════════════════════════════
  {
    path: '/components',
    title: 'UI Components',
    description: 'Component Showcase',
    requiresAuth: true,
  },
  { path: '/components-showcase', title: 'Components Showcase (Alt)', requiresAuth: true },
  { path: '/components-nav', title: 'Components Navigation', requiresAuth: true },
  { path: '/timeline-demo', title: 'Timeline Demo', isPublic: true },
  { path: '/graph-demo', title: 'Graph Demo', isPublic: true },
  { path: '/frontend-showcase', title: 'Frontend Showcase', requiresAuth: true },
  { path: '/layout-example', title: 'Layout Examples', requiresAuth: true },
  { path: '/simple-test', title: 'Simple Test', requiresAuth: true },

  // ═══════════════════════════════════════════════════
  // DEVELOPMENT & DEBUG
  // ═══════════════════════════════════════════════════
  { path: '/debug', title: 'Debug Info', requiresAuth: true, lifecycle: 'internal' },
  { path: '/build-info', title: 'Build Info', requiresAuth: true, lifecycle: 'internal' },
  { path: '/debug-routing', title: 'Debug Routing', requiresAuth: true, lifecycle: 'internal' },
  {
    path: '/all-pages',
    title: 'All Pages / Surface Map',
    requiresAuth: true,
    lifecycle: 'internal',
  },
  { path: '/test', title: 'Test Page', requiresAuth: true, lifecycle: 'internal' },

  // ═══════════════════════════════════════════════════
  // ONBOARDING FLOW STEPS (from pages-by-directory.md)
  // ═══════════════════════════════════════════════════
  {
    path: '/onboarding/home',
    title: 'Onboarding Home',
    isPublic: true,
    sources: ['pages-by-directory.md'],
  },
  {
    path: '/onboarding/user-setup',
    title: 'User Setup',
    isPublic: true,
    sources: ['pages-by-directory.md'],
  },
  {
    path: '/onboarding/create-workspace',
    title: 'Create Workspace',
    isPublic: true,
    sources: ['pages-by-directory.md'],
  },
  {
    path: '/onboarding/llm-preference',
    title: 'LLM Preference',
    isPublic: true,
    sources: ['pages-by-directory.md'],
  },
  {
    path: '/onboarding/data-handling',
    title: 'Data Handling',
    isPublic: true,
    sources: ['pages-by-directory.md'],
  },
  {
    path: '/onboarding/survey',
    title: 'Survey',
    isPublic: true,
    sources: ['pages-by-directory.md'],
  },

  // ═══════════════════════════════════════════════════
  // API ENDPOINTS (Admin Access)
  // ═══════════════════════════════════════════════════
  {
    path: '/api/admin/database',
    title: 'Admin Database API',
    requiresAuth: true,
    lifecycle: 'internal',
  },
  {
    path: '/api/admin/features',
    title: 'Admin Features API',
    requiresAuth: true,
    lifecycle: 'internal',
  },
  {
    path: '/api/admin/features/:id/evaluate',
    title: 'Feature Evaluation API',
    requiresAuth: true,
    lifecycle: 'internal',
  },

  // ═══════════════════════════════════════════════════
  // ERROR HANDLING
  // ═══════════════════════════════════════════════════
  { path: '/404', title: '404 Page', isPublic: true },
  { path: '/not-found', title: 'Not Found', isPublic: true },

  // ═══════════════════════════════════════════════════
  // PACKAGE-LEVEL PAGES (Alternative Implementations)
  // ═══════════════════════════════════════════════════
  {
    path: '/package/dashboard',
    title: 'Package Dashboard',
    requiresAuth: true,
    lifecycle: 'internal',
  },
  { path: '/package/login', title: 'Package Login', requiresAuth: true, lifecycle: 'internal' },
  { path: '/package/agents', title: 'Package Agents', requiresAuth: true, lifecycle: 'internal' },
  {
    path: '/package/workflows',
    title: 'Package Workflows',
    requiresAuth: true,
    lifecycle: 'internal',
  },

  // ═══════════════════════════════════════════════════
  // STATIC HTML PAGES (Development/Prototyping)
  // ═══════════════════════════════════════════════════
  {
    path: '/html/dashboard',
    title: 'HTML Dashboard Prototype',
    requiresAuth: true,
    lifecycle: 'internal',
  },
  { path: '/html/admin', title: 'HTML Admin Prototype', requiresAuth: true, lifecycle: 'internal' },
  {
    path: '/html/agents',
    title: 'HTML Agents Prototype',
    requiresAuth: true,
    lifecycle: 'internal',
  },
  { path: '/html/chat', title: 'HTML Chat Prototype', requiresAuth: true, lifecycle: 'internal' },
  { path: '/html/tasks', title: 'HTML Tasks Prototype', requiresAuth: true, lifecycle: 'internal' },
  {
    path: '/html/workflows',
    title: 'HTML Workflows Prototype',
    requiresAuth: true,
    lifecycle: 'internal',
  },

  // ═══════════════════════════════════════════════════
  // SPA ENTRY POINT
  // ═══════════════════════════════════════════════════
  { path: '/app.html', title: 'App Entry (→ Dashboard)', isPublic: true },
];

// ═══════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════

/**
 * Flatten all routes into a single array
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
 * Find a node by path (depth-first)
 */
export function findNodeByPath(
  path: string,
  nodes: SiteMapNode[] = sitemap
): SiteMapNode | undefined {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.children) {
      const found = findNodeByPath(path, node.children);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Generate breadcrumbs for a given path
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

/**
 * Get all routes filtered by lifecycle
 */
export function getRoutesByLifecycle(lifecycle: SiteMapNode['lifecycle']): SiteMapNode[] {
  const result: SiteMapNode[] = [];
  function walk(nodes: SiteMapNode[]) {
    for (const node of nodes) {
      if (node.lifecycle === lifecycle) result.push(node);
      if (node.children) walk(node.children);
    }
  }
  walk(sitemap);
  return result;
}

/**
 * Get all production routes (for nav rendering)
 */
export function getProductionRoutes(): SiteMapNode[] {
  return getRoutesByLifecycle('production');
}

/**
 * Count total routes in the sitemap (including nested)
 */
export function countTotalRoutes(): number {
  return getAllRoutes().length;
}
