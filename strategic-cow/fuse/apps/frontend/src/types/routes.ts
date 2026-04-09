// @ts-nocheck
// Comprehensive route type definitions based on ComprehensiveRouter.tsx
// This ensures type safety across the routing system

import { RouteObject } from 'react-router-dom';

// Route path types
export type CoreRoute = '/' | '/home' | '/dashboard';

export type AIRoute =
  | '/multi-agent-chat'
  | '/ai-portal'
  | '/chat'
  | '/agents'
  | '/agents/new'
  | '/agents/:id';

export type WorkspaceRoute =
  | '/workspace/overview'
  | '/workspace/analytics'
  | '/workspace/members'
  | '/workspace/settings'
  | '/workspace-chat';

export type TaskRoute =
  | '/tasks'
  | '/tasks/new'
  | '/tasks/:id'
  | '/tasks/:id/edit'
  | '/workflows'
  | '/workflows/builder'
  | '/workflows/templates'
  | '/workflows/:id'
  | '/workflows/:id/execution'
  | '/suggestions'
  | '/suggestions/new'
  | '/suggestions/:id';

export type AdminRoute =
  | '/admin'
  | '/admin/users'
  | '/admin/workspaces'
  | '/admin/system-health'
  | '/admin/feature-flags'
  | '/admin/port-management'
  | '/admin/settings'
  | '/admin/onboarding'
  | '/admin/experimental-features';

export type DashboardRoute =
  | '/dashboard/agents'
  | '/dashboard/agents/new'
  | '/dashboard/agents/:id'
  | '/dashboard/analytics'
  | '/dashboard/settings';

export type SettingsRoute =
  | '/settings'
  | '/settings/general'
  | '/settings/appearance'
  | '/settings/notifications'
  | '/settings/security'
  | '/settings/api'
  | '/general-settings'
  | '/general-settings/embedding';

export type AuthRoute =
  | '/login'
  | '/register'
  | '/auth/login'
  | '/auth/register'
  | '/auth/sso'
  | '/auth/google-callback'
  | '/auth/oauth-callback';

export type LandingRoute =
  | '/landing'
  | '/landing-page'
  | '/simple-landing'
  | '/onboarding'
  | '/preview/onboarding';

export type LegalRoute = '/legal/privacy' | '/legal/terms';

export type AnalyticsRoute = '/analytics';

export type DemoRoute =
  | '/components'
  | '/timeline-demo'
  | '/graph-demo'
  | '/frontend-showcase'
  | '/layout-example'
  | '/test'
  | '/components-nav';

export type DevRoute = '/debug' | '/build-info' | '/debug-routing' | '/all-pages';

export type ErrorRoute = '/404' | '*';

// Union type of all possible routes
export type AppRouteType =
  | CoreRoute
  | AIRoute
  | WorkspaceRoute
  | TaskRoute
  | AdminRoute
  | DashboardRoute
  | SettingsRoute
  | AuthRoute
  | LandingRoute
  | LegalRoute
  | AnalyticsRoute
  | DemoRoute
  | DevRoute
  | ErrorRoute;

// Enhanced route interface
export interface AppRoute extends RouteObject {
  path: string;
  name?: string;
  description?: string;
  requiresAuth?: boolean;
  roles?: string[];
  icon?: string;
  category?: RouteCategory;
}

// Route category types
export type RouteCategory =
  | 'core'
  | 'ai'
  | 'workspace'
  | 'tasks'
  | 'admin'
  | 'dashboard'
  | 'settings'
  | 'auth'
  | 'landing'
  | 'legal'
  | 'analytics'
  | 'demos'
  | 'dev'
  | 'error';

// Enhanced route configuration
export interface RouteConfig {
  routes: AppRoute[];
  defaultRoute?: string;
  authRoutes: string[];
  publicRoutes: string[];
  adminRoutes: string[];
  protectedRoutes: string[];
  redirects: Record<string, string>;
}

// Navigation item interface
export interface NavigationItem {
  name: string;
  path: string;
  icon?: string;
  children?: NavigationItem[];
  requiresAuth?: boolean;
  roles?: string[];
  category: RouteCategory;
}

// Route metadata for SEO and analytics
export interface RouteMetadata {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ name: string; path?: string }>;
  category: RouteCategory;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
}

// Route parameters for dynamic routes
export interface RouteParams {
  id?: string;
  workspaceId?: string;
  token?: string;
  provider?: string;
}

// Route guard function type
export type RouteGuard = (route: AppRouteType, params: RouteParams) => boolean;

// Protected route configuration
export interface ProtectedRouteConfig extends AppRoute {
  requiresAuth: true;
  fallbackRoute?: AppRouteType;
  guards?: RouteGuard[];
}

// Public route configuration
export interface PublicRouteConfig extends AppRoute {
  requiresAuth: false;
  redirectIfAuthenticated?: AppRouteType;
}

// Navigation state interface
export interface NavigationState {
  activeRoute: AppRouteType;
  previousRoute: AppRouteType | null;
  breadcrumbs: NavigationItem[];
  isLoading: boolean;
  error: string | null;
}

// Route registry for dynamic route management
export interface RouteRegistry {
  routes: Map<AppRouteType, AppRoute>;
  register: (route: AppRouteType, definition: AppRoute) => void;
  unregister: (route: AppRouteType) => void;
  get: (route: AppRouteType) => AppRoute | undefined;
  getAll: () => AppRoute[];
  getByCategory: (category: RouteCategory) => AppRoute[];
}

// Router context interface
export interface RouterContextValue {
  currentRoute: AppRouteType;
  navigate: (route: AppRouteType, params?: RouteParams) => void;
  goBack: () => void;
  goForward: () => void;
  isLoading: boolean;
  error: string | null;
  registry: RouteRegistry;
}

// Export route constants as types
export const ROUTE_CATEGORIES = {
  CORE: 'core',
  AI: 'ai',
  WORKSPACE: 'workspace',
  TASKS: 'tasks',
  ADMIN: 'admin',
  DASHBOARD: 'dashboard',
  SETTINGS: 'settings',
  AUTH: 'auth',
  LANDING: 'landing',
  LEGAL: 'legal',
  ANALYTICS: 'analytics',
  DEMOS: 'demos',
  DEV: 'dev',
  ERROR: 'error',
} as const;

// Type assertion helpers
export function isValidRoute(path: string): path is AppRouteType {
  // This would be implemented with actual route validation logic
  return typeof path === 'string' && path.startsWith('/');
}

export function getRouteCategory(route: AppRouteType): RouteCategory {
  if (route === '/' || route === '/home' || route === '/dashboard') return 'core';
  if (
    route.startsWith('/multi-agent-chat') ||
    route.startsWith('/ai-portal') ||
    route.startsWith('/chat') ||
    route.startsWith('/agents')
  )
    return 'ai';
  if (route.startsWith('/workspace')) return 'workspace';
  if (
    route.startsWith('/tasks') ||
    route.startsWith('/workflows') ||
    route.startsWith('/suggestions')
  )
    return 'tasks';
  if (route.startsWith('/admin')) return 'admin';
  if (route.startsWith('/dashboard/')) return 'dashboard';
  if (route.startsWith('/settings') || route.startsWith('/general-settings')) return 'settings';
  if (route.startsWith('/login') || route.startsWith('/register') || route.startsWith('/auth'))
    return 'auth';
  if (
    route.startsWith('/landing') ||
    route.startsWith('/onboarding') ||
    route.startsWith('/preview') ||
    route.startsWith('/simple-landing')
  )
    return 'landing';
  if (route.startsWith('/legal')) return 'legal';
  if (route === '/analytics') return 'analytics';
  if (
    route.startsWith('/components') ||
    route.startsWith('/timeline-demo') ||
    route.startsWith('/graph-demo') ||
    route.startsWith('/frontend-showcase') ||
    route.startsWith('/layout-example') ||
    route === '/test'
  )
    return 'demos';
  if (
    route.startsWith('/debug') ||
    route.startsWith('/build-info') ||
    route.startsWith('/all-pages')
  )
    return 'dev';
  return 'error';
}
