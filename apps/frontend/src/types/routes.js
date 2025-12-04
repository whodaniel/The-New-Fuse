// Comprehensive route type definitions based on ComprehensiveRouter.tsx
// This ensures type safety across the routing system
// Export route constants as types
export var ROUTE_CATEGORIES = {
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
};
// Type assertion helpers
export function isValidRoute(path) {
    // This would be implemented with actual route validation logic
    return typeof path === 'string' && path.startsWith('/');
}
export function getRouteCategory(route) {
    if (route === '/' || route === '/home' || route === '/dashboard')
        return 'core';
    if (route.startsWith('/multi-agent-chat') || route.startsWith('/ai-portal') || route.startsWith('/chat') || route.startsWith('/agents'))
        return 'ai';
    if (route.startsWith('/workspace'))
        return 'workspace';
    if (route.startsWith('/tasks') || route.startsWith('/workflows') || route.startsWith('/suggestions'))
        return 'tasks';
    if (route.startsWith('/admin'))
        return 'admin';
    if (route.startsWith('/dashboard/'))
        return 'dashboard';
    if (route.startsWith('/settings') || route.startsWith('/general-settings'))
        return 'settings';
    if (route.startsWith('/login') || route.startsWith('/register') || route.startsWith('/auth'))
        return 'auth';
    if (route.startsWith('/landing') || route.startsWith('/onboarding') || route.startsWith('/preview') || route.startsWith('/simple-landing'))
        return 'landing';
    if (route.startsWith('/legal'))
        return 'legal';
    if (route === '/analytics')
        return 'analytics';
    if (route.startsWith('/components') || route.startsWith('/timeline-demo') || route.startsWith('/graph-demo') || route.startsWith('/frontend-showcase') || route.startsWith('/layout-example') || route === '/test')
        return 'demos';
    if (route.startsWith('/debug') || route.startsWith('/build-info') || route.startsWith('/all-pages'))
        return 'dev';
    return 'error';
}
