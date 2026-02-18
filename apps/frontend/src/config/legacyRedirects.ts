export interface LegacyRedirect {
  from: string;
  to: string;
}

// Compatibility redirects to preserve legacy entry points while consolidating IA.
export const LEGACY_REDIRECTS: LegacyRedirect[] = [
  // OpenClaw-style operational aliases - REMOVED conflicting entries that are now handled in ComprehensiveRouter
  // { from: '/overview', to: '/dashboard' }, -> Now /workspace/overview
  // { from: '/channels', to: '/command-center' }, -> Now lazy page
  // { from: '/instances', to: '/observatory' }, -> Now lazy page
  // { from: '/sessions', to: '/multi-agent-chat' }, -> Now lazy page
  // { from: '/usage', to: '/analytics' }, -> Now lazy page
  // { from: '/cron-jobs', to: '/tasks' }, -> Now lazy page
  // { from: '/skills', to: '/resources' }, -> Now /admin/agents/skills
  // { from: '/nodes', to: '/observatory' }, -> Now lazy page
  // { from: '/config', to: '/settings' }, -> Now /admin/configuration
  // { from: '/logs', to: '/admin/audit-logs' }, -> Handled in router, can remove here or keep (removed for consistency)

  { from: '/admin/panel', to: '/admin' },
  { from: '/team', to: '/workspace/members' },
  { from: '/agents/unified-creator', to: '/agents/new' },
  { from: '/workspace/chat', to: '/workspace-chat' },
  { from: '/workspace/layout', to: '/workspace/overview' },
  { from: '/landing-page', to: '/landing' },
  { from: '/simple-landing', to: '/landing' },
  { from: '/components-nav', to: '/components' },
  { from: '/tasks-page', to: '/tasks' },
  { from: '/chat-page', to: '/chat' },
  { from: '/admin/dashboard', to: '/admin' },
  { from: '/admin/experimental-features', to: '/admin/feature-flags' },
  { from: '/admin/onboarding', to: '/admin' },
  { from: '/general-settings/community-hub', to: '/general-settings' },
  { from: '/api/admin/features/:id/evaluate', to: '/api/admin/features' },
];
