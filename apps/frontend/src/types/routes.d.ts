import { RouteObject } from 'react-router-dom';
export type CoreRoute = '/' | '/home' | '/dashboard';
export type AIRoute = '/multi-agent-chat' | '/ai-portal' | '/chat' | '/agents' | '/agents/new' | '/agents/:id';
export type WorkspaceRoute = '/workspace/overview' | '/workspace/analytics' | '/workspace/members' | '/workspace/settings' | '/workspace-chat';
export type TaskRoute = '/tasks' | '/tasks/new' | '/tasks/:id' | '/tasks/:id/edit' | '/workflows' | '/workflows/builder' | '/workflows/templates' | '/workflows/:id' | '/workflows/:id/execution' | '/suggestions' | '/suggestions/new' | '/suggestions/:id';
export type AdminRoute = '/admin' | '/admin/users' | '/admin/workspaces' | '/admin/system-health' | '/admin/feature-flags' | '/admin/port-management' | '/admin/settings' | '/admin/onboarding' | '/admin/experimental-features';
export type DashboardRoute = '/dashboard/agents' | '/dashboard/agents/new' | '/dashboard/agents/:id' | '/dashboard/analytics' | '/dashboard/settings';
export type SettingsRoute = '/settings' | '/settings/general' | '/settings/appearance' | '/settings/notifications' | '/settings/security' | '/settings/api' | '/general-settings' | '/general-settings/embedding';
export type AuthRoute = '/login' | '/register' | '/auth/login' | '/auth/register' | '/auth/sso' | '/auth/google-callback' | '/auth/oauth-callback';
export type LandingRoute = '/landing' | '/landing-page' | '/simple-landing' | '/onboarding' | '/preview/onboarding';
export type LegalRoute = '/legal/privacy' | '/legal/terms';
export type AnalyticsRoute = '/analytics';
export type DemoRoute = '/components' | '/timeline-demo' | '/graph-demo' | '/frontend-showcase' | '/layout-example' | '/test' | '/components-nav';
export type DevRoute = '/debug' | '/build-info' | '/debug-routing' | '/all-pages';
export type ErrorRoute = '/404' | '*';
export type AppRouteType = CoreRoute | AIRoute | WorkspaceRoute | TaskRoute | AdminRoute | DashboardRoute | SettingsRoute | AuthRoute | LandingRoute | LegalRoute | AnalyticsRoute | DemoRoute | DevRoute | ErrorRoute;
export interface AppRoute extends RouteObject {
    path: string;
    name?: string;
    description?: string;
    requiresAuth?: boolean;
    roles?: string[];
    icon?: string;
    category?: RouteCategory;
}
export type RouteCategory = 'core' | 'ai' | 'workspace' | 'tasks' | 'admin' | 'dashboard' | 'settings' | 'auth' | 'landing' | 'legal' | 'analytics' | 'demos' | 'dev' | 'error';
export interface RouteConfig {
    routes: AppRoute[];
    defaultRoute?: string;
    authRoutes: string[];
    publicRoutes: string[];
    adminRoutes: string[];
    protectedRoutes: string[];
    redirects: Record<string, string>;
}
export interface NavigationItem {
    name: string;
    path: string;
    icon?: string;
    children?: NavigationItem[];
    requiresAuth?: boolean;
    roles?: string[];
    category: RouteCategory;
}
export interface RouteMetadata {
    title: string;
    description?: string;
    breadcrumbs?: Array<{
        name: string;
        path?: string;
    }>;
    category: RouteCategory;
    keywords?: string[];
    ogImage?: string;
    canonical?: string;
    noindex?: boolean;
}
export interface RouteParams {
    id?: string;
    workspaceId?: string;
    token?: string;
    provider?: string;
}
export type RouteGuard = (route: AppRouteType, params: RouteParams) => boolean;
export interface ProtectedRouteConfig extends AppRoute {
    requiresAuth: true;
    fallbackRoute?: AppRouteType;
    guards?: RouteGuard[];
}
export interface PublicRouteConfig extends AppRoute {
    requiresAuth: false;
    redirectIfAuthenticated?: AppRouteType;
}
export interface NavigationState {
    activeRoute: AppRouteType;
    previousRoute: AppRouteType | null;
    breadcrumbs: NavigationItem[];
    isLoading: boolean;
    error: string | null;
}
export interface RouteRegistry {
    routes: Map<AppRouteType, AppRoute>;
    register: (route: AppRouteType, definition: AppRoute) => void;
    unregister: (route: AppRouteType) => void;
    get: (route: AppRouteType) => AppRoute | undefined;
    getAll: () => AppRoute[];
    getByCategory: (category: RouteCategory) => AppRoute[];
}
export interface RouterContextValue {
    currentRoute: AppRouteType;
    navigate: (route: AppRouteType, params?: RouteParams) => void;
    goBack: () => void;
    goForward: () => void;
    isLoading: boolean;
    error: string | null;
    registry: RouteRegistry;
}
export declare const ROUTE_CATEGORIES: {
    readonly CORE: "core";
    readonly AI: "ai";
    readonly WORKSPACE: "workspace";
    readonly TASKS: "tasks";
    readonly ADMIN: "admin";
    readonly DASHBOARD: "dashboard";
    readonly SETTINGS: "settings";
    readonly AUTH: "auth";
    readonly LANDING: "landing";
    readonly LEGAL: "legal";
    readonly ANALYTICS: "analytics";
    readonly DEMOS: "demos";
    readonly DEV: "dev";
    readonly ERROR: "error";
};
export declare function isValidRoute(path: string): path is AppRouteType;
export declare function getRouteCategory(route: AppRouteType): RouteCategory;
