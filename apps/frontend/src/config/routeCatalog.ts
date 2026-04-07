import {
  EXPERIENCE_SURFACES,
  type ExperienceDomain,
  type SurfaceLifecycle,
} from './experienceArchitecture';

export interface PageInfo {
  name: string;
  path: string;
  description?: string;
  domain?: ExperienceDomain;
  lifecycle?: SurfaceLifecycle;
  canonical?: boolean;
}

export interface PageCategory {
  name: string;
  pages: PageInfo[];
}

const BASE_CATALOG_COUNT = 123;

const RAW_PAGES_CATALOG: PageInfo[] = [
  // Core Application Pages
  { name: 'Home', path: '/', description: 'Enhanced Home Page with Production Status' },
  { name: 'Dashboard', path: '/dashboard', description: 'Main Dashboard with Metrics' },
  {
    name: 'Home Alt aka Dev Index',
    path: '/home',
    description: 'Complete Page Directory (Dev Index)',
  },

  // AI & Agents
  { name: 'Multi-Agent Chat', path: '/multi-agent-chat', description: 'Main Chat Interface' },
  { name: 'AI Agent Portal', path: '/ai-portal', description: 'Agent Management' },
  {
    name: 'AI Portal PFP Studio',
    path: '/ai-portal/pfp-studio',
    description: 'Batch portrait generation and replacement control surface',
  },
  {
    name: 'AI Portal Prompt Catalog',
    path: '/ai-portal/pfp-prompts',
    description: 'Prompt editing catalog connected to portrait generation',
  },
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
  { name: 'Workspace Spaces', path: '/spaces', description: 'Multi-workspace control surface' },

  // Tasks & Workflows
  { name: 'All Tasks', path: '/tasks', description: 'Task Management' },
  { name: 'New Task', path: '/tasks/new', description: 'Create Task' },
  { name: 'Task Detail', path: '/tasks/:id', description: 'Task Details' },
  { name: 'Edit Task', path: '/tasks/:id/edit', description: 'Edit Task' },
  { name: 'Tasks Page', path: '/tasks-page', description: 'Dedicated Tasks Page' },
  { name: 'Timeline', path: '/timeline', description: 'Operational Timeline' },
  { name: 'Goals', path: '/goals', description: 'Strategic Goals' },
  { name: 'Plans', path: '/plans', description: 'Execution Plans' },
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
  { name: 'External Connections', path: '/connect', description: 'Stripe and Provider Connect' },
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
  // Router-only canonical paths added during consolidation
  {
    name: 'Admin Agent Management',
    path: '/admin/agent-management',
    description: 'Full admin agent management',
  },
  {
    name: 'Admin API Analytics',
    path: '/admin/api-analytics',
    description: 'Admin API analytics surface',
  },
  { name: 'Admin Audit Logs', path: '/admin/audit-logs', description: 'Admin audit log viewer' },
  {
    name: 'Admin Backup Restore',
    path: '/admin/backup-restore',
    description: 'Admin backup and restore tools',
  },
  {
    name: 'Admin Configuration',
    path: '/admin/configuration',
    description: 'Admin configuration management',
  },
  { name: 'Admin Database', path: '/admin/database', description: 'Admin database panel' },
  {
    name: 'Admin OpenClaw Security',
    path: '/admin/openclaw-security',
    description: 'OpenClaw security controls',
  },
  {
    name: 'Admin System Metrics',
    path: '/admin/system-metrics',
    description: 'Admin system metrics dashboard',
  },
  {
    name: 'Admin User Management',
    path: '/admin/user-management',
    description: 'Full admin user management',
  },
  { name: 'Agency Dashboard', path: '/agency/dashboard', description: 'Agency owner dashboard' },
  { name: 'Agency Onboard', path: '/agency/onboard', description: 'Agency onboarding flow' },
  { name: 'Agent Builder', path: '/agent-builder', description: 'Unified agent builder entry' },
  {
    name: 'Agent Management',
    path: '/agent-management',
    description: 'Agent management surface alias',
  },
  {
    name: 'Agent Identity',
    path: '/agents/:id/identity',
    description: 'Agent identity and persona configuration',
  },
  { name: 'Agent Onboard', path: '/agents/onboard', description: 'Agent self-registration flow' },
  {
    name: 'AI Agents Portal Alias',
    path: '/ai-agents',
    description: 'AI agent portal alias route',
  },
  { name: 'Blog', path: '/blog', description: 'Marketing blog page' },
  { name: 'Brand', path: '/brand', description: 'Brand identity page' },
  { name: 'FAQ Alias', path: '/faq', description: 'Universal compatibility FAQ alias to TNF docs' },
  {
    name: 'Comparisons Alias',
    path: '/comparisons',
    description: 'Universal compatibility comparisons alias to TNF product map',
  },
  {
    name: 'Careers Alias',
    path: '/careers',
    description: 'Universal compatibility careers alias to TNF community',
  },
  {
    name: 'Ambassador Alias',
    path: '/ambassador',
    description: 'Universal compatibility ambassador alias to TNF community',
  },
  {
    name: 'Testimonials Alias',
    path: '/testimonials',
    description: 'Universal compatibility testimonials alias to TNF landing testimonials section',
  },
  { name: 'Command Center', path: '/command-center', description: 'TNF command center' },
  { name: 'Community', path: '/community', description: 'Community hub page' },
  { name: 'Contact', path: '/contact', description: 'Contact and support entry' },
  { name: 'Design System', path: '/design-system', description: 'Design system page' },
  { name: 'Docs', path: '/docs', description: 'Documentation root' },
  { name: 'Docs Wildcard', path: '/docs/*', description: 'Documentation nested routes' },
  { name: 'Main Workspace', path: '/main', description: 'Main workspace page' },
  { name: 'Observatory', path: '/observatory', description: 'System observatory' },
  {
    name: 'AI Agent Onboarding',
    path: '/onboarding/ai-agent',
    description: 'AI agent onboarding UX',
  },
  { name: 'Pricing', path: '/pricing', description: 'Pricing page' },
  { name: 'Profile Alias', path: '/profile', description: 'Profile alias route' },
  {
    name: 'Platform Overview',
    path: '/marketplace',
    description: 'Public orientation page for TNF surfaces',
  },
  {
    name: 'Resources',
    path: '/resources',
    description: 'Resources marketplace dashboard (legacy)',
  },
  {
    name: 'Files Workspace',
    path: '/files',
    description: 'Operator file workspace for indexed skill files and resource search',
  },
  {
    name: 'Tools Alias',
    path: '/tools',
    description: 'Universal compatibility tools alias mapped to TNF resources workspace',
  },
  {
    name: 'Integrations Alias',
    path: '/integrations',
    description: 'Universal compatibility integrations alias mapped to TNF resources workspace',
  },
  {
    name: 'Channels Alias',
    path: '/channels',
    description: 'Universal compatibility channels alias mapped to TNF chat workspace',
  },
  {
    name: 'Models Alias',
    path: '/models',
    description: 'Universal compatibility models alias mapped to TNF API/model settings',
  },
  {
    name: 'Skills Alias',
    path: '/skills',
    description: 'Universal compatibility skills surface alias',
  },
  {
    name: 'Datasets Workbench',
    path: '/datasets',
    description: 'Dataset catalog and indexed corpus inspection workbench',
  },
  {
    name: 'Automations Alias',
    path: '/automations',
    description: 'Universal compatibility automation surface alias',
  },
  { name: 'Chats Alias', path: '/chats', description: 'Universal compatibility chats alias route' },
  {
    name: 'Space Alias',
    path: '/space',
    description: 'Space control surface with routed project and domain management',
  },
  {
    name: 'Hosting Control Center',
    path: '/hosting',
    description: 'Hosting target management with database-backed custom domain controls',
  },
  {
    name: 'Terminal Alias',
    path: '/terminal',
    description: 'Universal compatibility terminal alias route',
  },
  {
    name: 'Billing Alias',
    path: '/billing',
    description: 'Universal compatibility billing alias route',
  },
  {
    name: 'Bookmarks',
    path: '/bookmarks',
    description: 'Workspace-aware bookmark management with database-backed workspace APIs',
  },
  {
    name: 'Platform Parity Dashboard',
    path: '/platform-parity',
    description: 'Competitive parity tracker for platform feature coverage',
  },
  {
    name: 'System Alias',
    path: '/system',
    description: 'Universal compatibility system health alias route',
  },
  { name: 'Support', path: '/support', description: 'Support page' },
  {
    name: 'Workflow Console',
    path: '/workflows/console',
    description: 'Workflow execution console',
  },
  {
    name: 'Workflow Detail Alias',
    path: '/workflows/detail',
    description: 'Workflow detail alias route',
  },
  {
    name: 'Workflow Execution Alias',
    path: '/workflows/execution',
    description: 'Workflow execution alias route',
  },
];

const experienceByPath = new Map<
  string,
  { domain: ExperienceDomain; lifecycle: SurfaceLifecycle; canonical?: boolean }
>();

for (const surface of EXPERIENCE_SURFACES) {
  experienceByPath.set(surface.path, {
    domain: surface.domain,
    lifecycle: surface.lifecycle,
    canonical: surface.canonical,
  });
  surface.aliases?.forEach((alias) =>
    experienceByPath.set(alias, {
      domain: surface.domain,
      lifecycle: surface.lifecycle,
      canonical: false,
    })
  );
}

export const ALL_PAGES_CATALOG: PageInfo[] = RAW_PAGES_CATALOG.map((page) => {
  const mapping = experienceByPath.get(page.path);
  if (!mapping) {
    return { ...page, lifecycle: 'internal' };
  }

  return {
    ...page,
    domain: mapping.domain,
    lifecycle: mapping.lifecycle,
    canonical: mapping.canonical,
  };
});

export const ALL_PAGE_CATEGORIES: PageCategory[] = [
  { name: 'Core Application', pages: ALL_PAGES_CATALOG.slice(0, 3) },
  { name: 'AI & Agents', pages: ALL_PAGES_CATALOG.slice(3, 18) },
  { name: 'Workspace Management', pages: ALL_PAGES_CATALOG.slice(18, 25) },
  { name: 'Tasks & Workflows', pages: ALL_PAGES_CATALOG.slice(25, 37) },
  { name: 'Suggestions System', pages: ALL_PAGES_CATALOG.slice(37, 40) },
  { name: 'Administration', pages: ALL_PAGES_CATALOG.slice(40, 52) },
  { name: 'Dashboard & Analytics', pages: ALL_PAGES_CATALOG.slice(52, 55) },
  { name: 'Settings & Configuration', pages: ALL_PAGES_CATALOG.slice(55, 67) },
  { name: 'Authentication', pages: ALL_PAGES_CATALOG.slice(67, 78) },
  { name: 'Landing & Marketing', pages: ALL_PAGES_CATALOG.slice(78, 83) },
  { name: 'Legal', pages: ALL_PAGES_CATALOG.slice(83, 85) },
  { name: 'Components & Demos', pages: ALL_PAGES_CATALOG.slice(85, 94) },
  { name: 'Development & Debug', pages: ALL_PAGES_CATALOG.slice(94, 99) },
  { name: 'API Endpoints', pages: ALL_PAGES_CATALOG.slice(99, 102) },
  { name: 'Error Handling', pages: ALL_PAGES_CATALOG.slice(102, 104) },
  { name: 'Package-Level Pages', pages: ALL_PAGES_CATALOG.slice(104, 109) },
  { name: 'Static HTML Pages', pages: ALL_PAGES_CATALOG.slice(109, BASE_CATALOG_COUNT) },
  { name: 'Router Coverage Additions', pages: ALL_PAGES_CATALOG.slice(BASE_CATALOG_COUNT) },
];

export const TOTAL_CATALOG_PAGES = ALL_PAGES_CATALOG.length;
