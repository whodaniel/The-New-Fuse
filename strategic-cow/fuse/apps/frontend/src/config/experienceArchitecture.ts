export type ExperienceDomain =
  | 'operate'
  | 'automate'
  | 'collaborate'
  | 'observe'
  | 'govern'
  | 'ecosystem';

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
export const EXPERIENCE_SURFACES: ExperienceSurface[] = [
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
    path: '/workflows',
    domain: 'automate',
    lifecycle: 'production',
    canonical: true,
    aliases: ['/workflows-enhanced'],
    owner: 'workflow-platform',
  },
  {
    path: '/workspace/overview',
    domain: 'collaborate',
    lifecycle: 'production',
    canonical: true,
    aliases: ['/workspace'],
    owner: 'workspace-platform',
  },
  {
    path: '/chat',
    domain: 'collaborate',
    lifecycle: 'production',
    canonical: true,
    aliases: ['/multi-agent-chat', '/chat-page'],
    owner: 'conversation-platform',
  },
  {
    path: '/analytics',
    domain: 'observe',
    lifecycle: 'production',
    canonical: true,
    aliases: ['/dashboard/analytics'],
    owner: 'observability-platform',
  },
  {
    path: '/observatory',
    domain: 'observe',
    lifecycle: 'production',
    canonical: true,
    owner: 'observability-platform',
  },
  {
    path: '/admin',
    domain: 'govern',
    lifecycle: 'production',
    canonical: true,
    aliases: ['/admin/dashboard'],
    owner: 'governance-platform',
  },
  {
    path: '/settings',
    domain: 'govern',
    lifecycle: 'production',
    canonical: true,
    aliases: ['/dashboard/settings'],
    owner: 'governance-platform',
  },
  {
    path: '/hub',
    domain: 'ecosystem',
    lifecycle: 'production',
    canonical: true,
    aliases: ['/sophisticated-hub'],
    owner: 'ecosystem-platform',
  },
  {
    path: '/mcp-hub',
    domain: 'ecosystem',
    lifecycle: 'production',
    canonical: true,
    owner: 'ecosystem-platform',
  },
  {
    path: '/marketplace',
    domain: 'ecosystem',
    lifecycle: 'production',
    canonical: true,
    owner: 'ecosystem-platform',
  },
  {
    path: '/all-pages',
    domain: 'ecosystem',
    lifecycle: 'internal',
    canonical: true,
    owner: 'frontend-platform',
  },
];

export const EXPERIENCE_DOMAIN_LABELS: Record<ExperienceDomain, string> = {
  operate: 'Operate',
  automate: 'Automate',
  collaborate: 'Collaborate',
  observe: 'Observe',
  govern: 'Govern',
  ecosystem: 'Ecosystem',
};
