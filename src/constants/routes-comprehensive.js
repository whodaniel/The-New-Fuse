// The New Fuse - Comprehensive Route Constants
export const ROUTES = {
  // Public routes
  HOME: '/',
  LANDING: '/landing',
  
  // Authentication routes
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    SSO: '/auth/sso',
    GOOGLE_CALLBACK: '/auth/google-callback',
    OAUTH_CALLBACK: '/auth/oauth-callback',
    VERIFY_EMAIL: '/auth/verify-email'
  },
  
  // Main application routes
  DASHBOARD: '/dashboard',
  ANALYTICS: '/analytics',
  ACTIVITY: '/activity',
  NOTIFICATIONS: '/notifications',
  
  // Agent management routes
  AGENTS: {
    INDEX: '/agents',
    NEW: '/agents/new',
    DETAIL: '/agents/:id',
    EDIT: '/agents/:id/edit',
    LOGS: '/agents/:id/logs',
    MONITORING: '/agents/:id/monitoring',
    MARKETPLACE: '/agents/marketplace'
  },
  
  // Task management routes
  TASKS: {
    INDEX: '/tasks',
    NEW: '/tasks/new',
    DETAIL: '/tasks/:id',
    EDIT: '/tasks/:id/edit',
    BOARD: '/tasks/board',
    CALENDAR: '/tasks/calendar',
    REPORTS: '/tasks/reports'
  },
  
  // Workflow routes
  WORKFLOWS: {
    INDEX: '/workflows',
    BUILDER: '/workflows/builder',
    TEMPLATES: '/workflows/templates',
    DETAIL: '/workflows/:id',
    EXECUTION: '/workflows/:id/execution'
  },
  
  // Suggestion routes
  SUGGESTIONS: {
    INDEX: '/suggestions',
    NEW: '/suggestions/new',
    DETAIL: '/suggestions/:id',
    EDIT: '/suggestions/:id/edit'
  },
  
  // Integration routes
  INTEGRATION: {
    API_KEYS: '/integration/api-keys',
    WEBHOOKS: '/integration/webhooks',
    THIRD_PARTY: '/integration/third-party',
    API_DOCS: '/integration/api-docs',
    API_EXPLORER: '/integration/api-explorer'
  },
  
  // Admin routes
  ADMIN: {
    INDEX: '/admin',
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    TEAMS: '/admin/teams',
    WORKSPACES: '/admin/workspaces',
    SYSTEM_HEALTH: '/admin/system-health',
    SETTINGS: '/admin/settings',
    AUDIT_LOGS: '/admin/audit-logs',
    USAGE: '/admin/usage',
    BILLING: '/admin/billing',
    PORTS: '/admin/ports'
  },
  
  // Settings routes
  SETTINGS: {
    INDEX: '/settings',
    GENERAL: '/settings/general',
    APPEARANCE: '/settings/appearance',
    API: '/settings/api',
    SECURITY: '/settings/security',
    NOTIFICATIONS: '/settings/notifications',
    EMBEDDING: '/settings/embedding',
    PROFILE: '/settings/profile',
    ACCOUNT: '/settings/account',
    API_ACCESS: '/settings/api-access',
    TEAMS: '/settings/teams'
  },
  
  // Workspace routes
  WORKSPACE: {
    OVERVIEW: '/workspace/:workspaceId/overview',
    MEMBERS: '/workspace/:workspaceId/members',
    ANALYTICS: '/workspace/:workspaceId/analytics',
    SETTINGS: '/workspace/:workspaceId/settings'
  },
  
  // Feature/Demo routes
  CHAT: '/chat',
  MULTI_AGENT_CHAT: '/multi-agent-chat',
  AI_PORTAL: '/ai-portal',
  TIMELINE_DEMO: '/timeline-demo',
  GRAPH_DEMO: '/graph-demo',
  COMPONENTS: '/components',
  COMPONENTS_NAV: '/components-nav',
  LAYOUT_EXAMPLE: '/layout-example',
  UI: '/ui',
  
  // Help routes
  HELP: {
    INDEX: '/help',
    DOCUMENTATION: '/help/documentation',
    TUTORIALS: '/help/tutorials',
    FAQ: '/help/faq',
    SUPPORT: '/help/support',
    COMMUNITY: '/help/community'
  },
  
  // Legal routes
  LEGAL: {
    PRIVACY_POLICY: '/legal/privacy-policy',
    TERMS_OF_SERVICE: '/legal/terms-of-service'
  },
  
  // Onboarding routes
  ONBOARDING: '/onboarding',
  
  // Development/Debug routes
  DEBUG: '/debug',
  DEBUG_ROUTING: '/debug-routing',
  TEST: '/test',
  BUILD_INFO: '/build-info',
  ALL_PAGES: '/all-pages',
  
  // Error routes
  NOT_FOUND: '/404',
  FORBIDDEN: '/403',
  SERVER_ERROR: '/500',
  UNAUTHORIZED: '/unauthorized'
};

// Route categories for organization
export const ROUTE_CATEGORIES = {
  PUBLIC: ['/', '/landing'],
  AUTH: Object.values(ROUTES.AUTH),
  MAIN: [ROUTES.DASHBOARD, ROUTES.ANALYTICS, ROUTES.ACTIVITY, ROUTES.NOTIFICATIONS],
  ADMIN: Object.values(ROUTES.ADMIN),
  SETTINGS: Object.values(ROUTES.SETTINGS),
  WORKSPACE: Object.values(ROUTES.WORKSPACE),
  FEATURE: [ROUTES.CHAT, ROUTES.MULTI_AGENT_CHAT, ROUTES.AI_PORTAL, ROUTES.TIMELINE_DEMO, ROUTES.GRAPH_DEMO],
  LEGAL: Object.values(ROUTES.LEGAL),
  ERROR: [ROUTES.NOT_FOUND, ROUTES.FORBIDDEN, ROUTES.SERVER_ERROR, ROUTES.UNAUTHORIZED]
};

// Helper functions
export const isAuthRoute = (path) => ROUTE_CATEGORIES.AUTH.includes(path);
export const isPublicRoute = (path) => ROUTE_CATEGORIES.PUBLIC.includes(path);
export const isAdminRoute = (path) => ROUTE_CATEGORIES.ADMIN.includes(path);
export const requiresAuth = (path) => !isPublicRoute(path) && !isAuthRoute(path);

// Route metadata for navigation and breadcrumbs
export const ROUTE_METADATA = {
  [ROUTES.HOME]: { title: 'Home', category: 'public' },
  [ROUTES.DASHBOARD]: { title: 'Dashboard', category: 'main' },
  [ROUTES.ANALYTICS]: { title: 'Analytics', category: 'main' },
  [ROUTES.AUTH.LOGIN]: { title: 'Login', category: 'auth' },
  [ROUTES.AUTH.REGISTER]: { title: 'Register', category: 'auth' },
  [ROUTES.ADMIN.DASHBOARD]: { title: 'Admin Dashboard', category: 'admin' },
  [ROUTES.SETTINGS.GENERAL]: { title: 'General Settings', category: 'settings' },
  // Add more metadata as needed
};

// Backward compatibility with existing ROUTE_PATHS
export const ROUTE_PATHS = {
  HOME: ROUTES.HOME,
  MULTI_AGENT_CHAT: ROUTES.MULTI_AGENT_CHAT,
  DASHBOARD: ROUTES.DASHBOARD,
  COMPONENTS_SHOWCASE: ROUTES.COMPONENTS,
  TIMELINE_DEMO: ROUTES.TIMELINE_DEMO,
  GRAPH_DEMO: ROUTES.GRAPH_DEMO,
  WORKSPACE_OVERVIEW: '/workspace/overview',
  WORKSPACE_SETTINGS: '/workspace/settings',
  TEST_PAGE: ROUTES.TEST,
  DEBUG_INFO: ROUTES.DEBUG,
  BUILD_INFO: ROUTES.BUILD_INFO,
  
  // HTML Pages (external)
  HTML_INDEX: '/ui-html-css/index.html',
  HTML_LOGIN: '/ui-html-css/pages/login.html',
  HTML_DASHBOARD_STATIC: '/ui-html-css/pages/dashboard.html',
  HTML_CHAT_INTERFACE: '/ui-html-css/pages/chat.html',
  HTML_ADMIN_PANEL: '/ui-html-css/pages/admin.html',
  HTML_SETTINGS_STATIC: '/ui-html-css/pages/settings.html',
  
  // Dev Tools (external/internal)
  DEV_SERVER_STATUS: 'http://localhost:3001',
};
