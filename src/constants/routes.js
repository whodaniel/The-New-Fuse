// Comprehensive route constants based on ComprehensiveRouter.tsx source of truth
// This file contains ALL actual routes used in the application

// Core Routes
export const CORE_ROUTES = {
  HOME: '/',
  HOME_ALT: '/home',
  DASHBOARD: '/dashboard',
};

// AI & Agent Routes
export const AI_ROUTES = {
  MULTI_AGENT_CHAT: '/multi-agent-chat',
  AI_PORTAL: '/ai-portal',
  CHAT: '/chat',
  AGENTS: '/agents',
  AGENTS_NEW: '/agents/new',
  AGENTS_DETAIL: '/agents/:id',
};

// Workspace Routes
export const WORKSPACE_ROUTES = {
  OVERVIEW: '/workspace/overview',
  ANALYTICS: '/workspace/analytics',
  MEMBERS: '/workspace/members',
  SETTINGS: '/workspace/settings',
  WORKSPACE_CHAT: '/workspace-chat',
};

// Tasks & Workflow Routes
export const TASK_ROUTES = {
  TASKS: '/tasks',
  TASKS_NEW: '/tasks/new',
  TASKS_DETAIL: '/tasks/:id',
  TASKS_EDIT: '/tasks/:id/edit',
  WORKFLOWS: '/workflows',
  WORKFLOWS_BUILDER: '/workflows/builder',
  WORKFLOWS_TEMPLATES: '/workflows/templates',
  WORKFLOWS_DETAIL: '/workflows/:id',
  WORKFLOWS_EXECUTION: '/workflows/:id/execution',
  SUGGESTIONS: '/suggestions',
  SUGGESTIONS_NEW: '/suggestions/new',
  SUGGESTIONS_DETAIL: '/suggestions/:id',
};

// Admin Routes
export const ADMIN_ROUTES = {
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_WORKSPACES: '/admin/workspaces',
  ADMIN_SYSTEM_HEALTH: '/admin/system-health',
  ADMIN_FEATURE_FLAGS: '/admin/feature-flags',
  ADMIN_PORT_MANAGEMENT: '/admin/port-management',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_ONBOARDING: '/admin/onboarding',
  ADMIN_EXPERIMENTAL: '/admin/experimental-features',
};

// Dashboard Sub-routes
export const DASHBOARD_ROUTES = {
  AGENTS: '/dashboard/agents',
  AGENTS_NEW: '/dashboard/agents/new',
  AGENTS_DETAIL: '/dashboard/agents/:id',
  ANALYTICS: '/dashboard/analytics',
  SETTINGS: '/dashboard/settings',
};

// Settings Routes
export const SETTINGS_ROUTES = {
  SETTINGS: '/settings',
  GENERAL: '/settings/general',
  APPEARANCE: '/settings/appearance',
  NOTIFICATIONS: '/settings/notifications',
  SECURITY: '/settings/security',
  API: '/settings/api',
  GENERAL_SETTINGS: '/general-settings',
  EMBEDDING: '/general-settings/embedding',
};

// Authentication Routes
export const AUTH_ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  SSO: '/auth/sso',
  GOOGLE_CALLBACK: '/auth/google-callback',
  OAUTH_CALLBACK: '/auth/oauth-callback',
};

// Landing & Marketing Routes
export const LANDING_ROUTES = {
  LANDING: '/landing',
  LANDING_PAGE: '/landing-page',
  SIMPLE_LANDING: '/simple-landing',
  ONBOARDING: '/onboarding',
  ONBOARDING_PREVIEW: '/preview/onboarding',
};

// Legal Routes
export const LEGAL_ROUTES = {
  PRIVACY: '/legal/privacy',
  TERMS: '/legal/terms',
};

// Analytics Routes
export const ANALYTICS_ROUTES = {
  ANALYTICS: '/analytics',
};

// Components & Demo Routes
export const DEMO_ROUTES = {
  COMPONENTS: '/components',
  TIMELINE_DEMO: '/timeline-demo',
  GRAPH_DEMO: '/graph-demo',
  FRONTEND_SHOWCASE: '/frontend-showcase',
  LAYOUT_EXAMPLE: '/layout-example',
  TEST: '/test',
  COMPONENTS_NAV: '/components-nav',
};

// Development & Debug Routes
export const DEV_ROUTES = {
  DEBUG: '/debug',
  BUILD_INFO: '/build-info',
  DEBUG_ROUTING: '/debug-routing',
  ALL_PAGES: '/all-pages',
};

// Error Routes
export const ERROR_ROUTES = {
  NOT_FOUND: '/404',
  WILDCARD: '*',
};

// All routes combined for easy access
export const ALL_ROUTES = {
  ...CORE_ROUTES,
  ...AI_ROUTES,
  ...WORKSPACE_ROUTES,
  ...TASK_ROUTES,
  ...ADMIN_ROUTES,
  ...DASHBOARD_ROUTES,
  ...SETTINGS_ROUTES,
  ...AUTH_ROUTES,
  ...LANDING_ROUTES,
  ...LEGAL_ROUTES,
  ...ANALYTICS_ROUTES,
  ...DEMO_ROUTES,
  ...DEV_ROUTES,
  ...ERROR_ROUTES,
};

// Legacy route paths for backward compatibility
export const ROUTE_PATHS = {
  HOME: CORE_ROUTES.HOME,
  MULTI_AGENT_CHAT: AI_ROUTES.MULTI_AGENT_CHAT,
  DASHBOARD: CORE_ROUTES.DASHBOARD,
  COMPONENTS_SHOWCASE: DEMO_ROUTES.COMPONENTS,
  TIMELINE_DEMO: DEMO_ROUTES.TIMELINE_DEMO,
  GRAPH_DEMO: DEMO_ROUTES.GRAPH_DEMO,
  WORKSPACE_OVERVIEW: WORKSPACE_ROUTES.OVERVIEW,
  WORKSPACE_SETTINGS: WORKSPACE_ROUTES.SETTINGS,
  TEST_PAGE: DEMO_ROUTES.TEST,
  DEBUG_INFO: DEV_ROUTES.DEBUG,
  BUILD_INFO: DEV_ROUTES.BUILD_INFO,
  
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

// Home page feature configuration
export const homePageFeatures = [
  { 
    icon: "🤖", 
    title: "Multi-Agent Chat", 
    description: "Firebase-powered chat system", 
    linkTo: AI_ROUTES.MULTI_AGENT_CHAT, 
    linkText: "Open Chat", 
    buttonBgClass: "bg-blue-600" 
  },
  { 
    icon: "📊", 
    title: "Dashboard", 
    description: "Analytics and controls", 
    linkTo: CORE_ROUTES.DASHBOARD, 
    linkText: "View Dashboard", 
    buttonBgClass: "bg-green-600" 
  },
  { 
    icon: "🎨", 
    title: "UI Components", 
    description: "Component showcase", 
    linkTo: DEMO_ROUTES.COMPONENTS, 
    linkText: "View Components", 
    buttonBgClass: "bg-purple-600" 
  },
  { 
    icon: "📈", 
    title: "Graph Demo", 
    description: "Interactive graphs", 
    linkTo: DEMO_ROUTES.GRAPH_DEMO, 
    linkText: "View Demo", 
    buttonBgClass: "bg-indigo-600" 
  },
];

// Route categories for navigation
export const ROUTE_CATEGORIES = {
  CORE: 'Core Application',
  AI: 'AI & Agents',
  WORKSPACE: 'Workspace Management',
  TASKS: 'Tasks & Workflows',
  ADMIN: 'Administration',
  DASHBOARD: 'Dashboard',
  SETTINGS: 'Settings',
  AUTH: 'Authentication',
  LANDING: 'Landing & Marketing',
  LEGAL: 'Legal Pages',
  ANALYTICS: 'Analytics',
  DEMOS: 'Components & Demos',
  DEV: 'Development Tools',
  ERROR: 'Error Handling',
};

// Export total route count
export const TOTAL_ROUTES = Object.keys(ALL_ROUTES).length;

// Route validation helpers
export const isValidRoute = (path) => {
  return Object.values(ALL_ROUTES).includes(path);
};

export const getRouteCategory = (path) => {
  if (Object.values(CORE_ROUTES).includes(path)) return ROUTE_CATEGORIES.CORE;
  if (Object.values(AI_ROUTES).includes(path)) return ROUTE_CATEGORIES.AI;
  if (Object.values(WORKSPACE_ROUTES).includes(path)) return ROUTE_CATEGORIES.WORKSPACE;
  if (Object.values(TASK_ROUTES).includes(path)) return ROUTE_CATEGORIES.TASKS;
  if (Object.values(ADMIN_ROUTES).includes(path)) return ROUTE_CATEGORIES.ADMIN;
  if (Object.values(DASHBOARD_ROUTES).includes(path)) return ROUTE_CATEGORIES.DASHBOARD;
  if (Object.values(SETTINGS_ROUTES).includes(path)) return ROUTE_CATEGORIES.SETTINGS;
  if (Object.values(AUTH_ROUTES).includes(path)) return ROUTE_CATEGORIES.AUTH;
  if (Object.values(LANDING_ROUTES).includes(path)) return ROUTE_CATEGORIES.LANDING;
  if (Object.values(LEGAL_ROUTES).includes(path)) return ROUTE_CATEGORIES.LEGAL;
  if (Object.values(ANALYTICS_ROUTES).includes(path)) return ROUTE_CATEGORIES.ANALYTICS;
  if (Object.values(DEMO_ROUTES).includes(path)) return ROUTE_CATEGORIES.DEMOS;
  if (Object.values(DEV_ROUTES).includes(path)) return ROUTE_CATEGORIES.DEV;
  if (Object.values(ERROR_ROUTES).includes(path)) return ROUTE_CATEGORIES.ERROR;
  return 'Unknown';
};