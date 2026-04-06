export type ExperienceDomain =
  | 'operate'
  | 'intelligence'
  | 'collaboration'
  | 'assets'
  | 'ecosystem'
  | 'system';

export type SurfaceLifecycle = 'production' | 'beta' | 'internal' | 'deprecated';

export interface ExperienceSurface {
  path: string;
  domain: ExperienceDomain;
  lifecycle: SurfaceLifecycle;
  canonical?: boolean;
  aliases?: string[];
  owner?: string;
}

// Canonical product architecture model used to keep IA decisions explicit and auditable.
// Refined to ensure full feature parity and logical grouping.
export const EXPERIENCE_SURFACES: ExperienceSurface[] = [
  // OPERATE: Daily execution and monitoring
  {
    path: '/dashboard',
    domain: 'operate',
    lifecycle: 'production',
    canonical: true,
    aliases: ['/home'],
    owner: 'frontend-platform',
  },
  {
    path: '/agents',
    domain: 'operate',
    lifecycle: 'production',
    canonical: true,
    aliases: ['/agent-management', '/dashboard/agents'],
    owner: 'agents-platform',
  },
  {
    path: '/tasks',
    domain: 'operate',
    lifecycle: 'production',
    canonical: true,
    aliases: ['/tasks-page'],
    owner: 'execution-platform',
  },
  {
    path: '/timeline',
    domain: 'operate',
    lifecycle: 'production',
    canonical: true,
    aliases: ['/macro-timeline'],
    owner: 'execution-platform',
  },
  {
    path: '/goals',
    domain: 'operate',
    lifecycle: 'production',
    canonical: true,
    owner: 'execution-platform',
  },
  {
    path: '/plans',
    domain: 'operate',
    lifecycle: 'production',
    canonical: true,
    owner: 'execution-platform',
  },
  {
    path: '/suggestions',
    domain: 'operate',
    lifecycle: 'production',
    canonical: true,
    owner: 'execution-platform',
  },

  // INTELLIGENCE: Building and managing agent capabilities
  {
    path: '/workflows',
    domain: 'intelligence',
    lifecycle: 'production',
    canonical: true,
    aliases: ['/workflows-enhanced', '/automations'],
    owner: 'workflow-platform',
  },
  {
    path: '/mcp-hub',
    domain: 'intelligence',
    lifecycle: 'production',
    canonical: true,
    aliases: ['/skills'],
    owner: 'ecosystem-platform',
  },
  {
    path: '/knowledge-hub',
    domain: 'intelligence',
    lifecycle: 'production',
    canonical: true,
    owner: 'intelligence-platform',
  },
  {
    path: '/ai-portal',
    domain: 'intelligence',
    lifecycle: 'production',
    canonical: true,
    aliases: ['/ai-agents', '/ai-agent-portal'],
    owner: 'agents-platform',
  },
  {
    path: '/agent-builder',
    domain: 'intelligence',
    lifecycle: 'production',
    canonical: true,
    aliases: ['/agents/new'],
    owner: 'agents-platform',
  },

  // COLLABORATION: Multi-agent and multi-user environments
  {
    path: '/chat',
    domain: 'collaboration',
    lifecycle: 'production',
    canonical: true,
    aliases: ['/multi-agent-chat', '/chats', '/channels'],
    owner: 'conversation-platform',
  },
  {
    path: '/workspace/overview',
    domain: 'collaboration',
    lifecycle: 'production',
    canonical: true,
    aliases: ['/workspace', '/space'],
    owner: 'workspace-platform',
  },
  {
    path: '/workspace-chat',
    domain: 'collaboration',
    lifecycle: 'production',
    canonical: true,
    owner: 'conversation-platform',
  },
  {
    path: '/spaces',
    domain: 'collaboration',
    lifecycle: 'production',
    canonical: true,
    owner: 'workspace-platform',
  },

  // ASSETS: Data, Files, and Resources
  {
    path: '/files',
    domain: 'assets',
    lifecycle: 'production',
    canonical: true,
    owner: 'assets-platform',
  },
  {
    path: '/datasets',
    domain: 'assets',
    lifecycle: 'production',
    canonical: true,
    owner: 'assets-platform',
  },
  {
    path: '/bookmarks',
    domain: 'assets',
    lifecycle: 'production',
    canonical: true,
    owner: 'assets-platform',
  },
  {
    path: '/resources',
    domain: 'assets',
    lifecycle: 'production',
    canonical: true,
    aliases: ['/tools', '/integrations'],
    owner: 'assets-platform',
  },
  {
    path: '/hosting',
    domain: 'assets',
    lifecycle: 'production',
    canonical: true,
    owner: 'assets-platform',
  },

  // ECOSYSTEM: Public platform and Agency controls
  {
    path: '/marketplace',
    domain: 'ecosystem',
    lifecycle: 'production',
    canonical: true,
    owner: 'ecosystem-platform',
  },
  {
    path: '/hub',
    domain: 'ecosystem',
    lifecycle: 'production',
    canonical: true,
    owner: 'ecosystem-platform',
  },
  {
    path: '/agency/dashboard',
    domain: 'ecosystem',
    lifecycle: 'production',
    canonical: true,
    owner: 'agency-platform',
  },
  {
    path: '/connect',
    domain: 'ecosystem',
    lifecycle: 'production',
    canonical: true,
    owner: 'ecosystem-platform',
  },
  {
    path: '/a2a-control',
    domain: 'ecosystem',
    lifecycle: 'production',
    canonical: true,
    owner: 'ecosystem-platform',
  },

  // SYSTEM: Governance and high-level observability
  {
    path: '/observatory',
    domain: 'system',
    lifecycle: 'production',
    canonical: true,
    owner: 'observability-platform',
  },
  {
    path: '/command-center',
    domain: 'system',
    lifecycle: 'production',
    canonical: true,
    owner: 'observability-platform',
  },
  {
    path: '/live-view',
    domain: 'system',
    lifecycle: 'production',
    canonical: true,
    owner: 'observability-platform',
  },
  {
    path: '/ai-command-center',
    domain: 'system',
    lifecycle: 'production',
    canonical: true,
    owner: 'observability-platform',
  },
  {
    path: '/admin',
    domain: 'system',
    lifecycle: 'production',
    canonical: true,
    aliases: ['/admin/dashboard'],
    owner: 'governance-platform',
  },
  {
    path: '/settings',
    domain: 'system',
    lifecycle: 'production',
    canonical: true,
    aliases: ['/general-settings'],
    owner: 'governance-platform',
  },
  {
    path: '/billing',
    domain: 'system',
    lifecycle: 'production',
    canonical: true,
    aliases: ['/membership'],
    owner: 'governance-platform',
  },
  {
    path: '/platform-parity',
    domain: 'system',
    lifecycle: 'internal',
    canonical: true,
    owner: 'governance-platform',
  },
];

export const EXPERIENCE_DOMAIN_LABELS: Record<ExperienceDomain, string> = {
  operate: 'Operate',
  intelligence: 'Intelligence',
  collaboration: 'Collaboration',
  assets: 'Knowledge & Assets',
  ecosystem: 'Ecosystem',
  system: 'System & Governance',
};
