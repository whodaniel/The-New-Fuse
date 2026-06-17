import type { TnfDesktopEnvironment } from './endpoints';

export interface WebSurface {
  id: string;
  name: string;
  path: string;
  description: string;
  category: 'core' | 'agents' | 'workflows' | 'workspace' | 'admin';
  icon: string;
  /** Native desktop route if available */
  nativeRoute?: string;
}

export const WEB_SURFACES: WebSurface[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    path: '/dashboard',
    description: 'Main metrics and operator overview',
    category: 'core',
    icon: '🏠',
    nativeRoute: '/dashboard',
  },
  {
    id: 'multi-agent-chat',
    name: 'Multi-Agent Chat',
    path: '/multi-agent-chat',
    description: 'Chat with multiple AI agents',
    category: 'agents',
    icon: '💬',
    nativeRoute: '/chat',
  },
  {
    id: 'a2a-control',
    name: 'A2A Control',
    path: '/a2a-control',
    description: 'Agent-to-agent Redis federation bus',
    category: 'agents',
    icon: '🤝',
    nativeRoute: '/a2a',
  },
  {
    id: 'ai-command-center',
    name: 'AI Command Center',
    path: '/ai-command-center',
    description: 'Unified AI grid interface',
    category: 'agents',
    icon: '🎯',
  },
  {
    id: 'knowledge-hub',
    name: 'Knowledge Hub',
    path: '/knowledge-hub',
    description: 'Persistent knowledge graph & PKG',
    category: 'workspace',
    icon: '🧠',
    nativeRoute: '/knowledge',
  },
  {
    id: 'mcp-hub',
    name: 'MCP Hub',
    path: '/mcp-hub',
    description: 'Model Context Protocol management',
    category: 'workspace',
    icon: '🔌',
    nativeRoute: '/mcp',
  },
  {
    id: 'workflow-builder',
    name: 'Workflow Builder',
    path: '/workflows/builder',
    description: 'Visual workflow automation',
    category: 'workflows',
    icon: '⚡',
    nativeRoute: '/workflows',
  },
  {
    id: 'workspace-overview',
    name: 'Workspace Overview',
    path: '/workspace/overview',
    description: 'Team workspace and spaces',
    category: 'workspace',
    icon: '🏢',
  },
  {
    id: 'live-view',
    name: 'Live View',
    path: '/live-view',
    description: 'Real-time AI activity monitor',
    category: 'core',
    icon: '📡',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    path: '/analytics',
    description: 'Synergy metrics and operator analytics',
    category: 'core',
    icon: '📊',
    nativeRoute: '/analytics',
  },
  {
    id: 'platform-overview',
    name: 'Platform Overview',
    path: '/platform',
    description: 'TNF platform capabilities (desktop marketing slice)',
    category: 'core',
    icon: '✨',
    nativeRoute: '/platform',
  },
  {
    id: 'timeline',
    name: 'Timeline',
    path: '/timeline',
    description: 'Operational timeline',
    category: 'core',
    icon: '📅',
  },
];

export function resolveWebAppBaseUrl(environment: TnfDesktopEnvironment): string {
  const fromEnv = String(import.meta.env.VITE_WEB_APP_URL || '').trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }

  switch (environment) {
    case 'local':
      return 'http://localhost:5173';
    case 'sandbox':
    case 'production':
    case 'custom':
    default:
      return 'https://thenewfuse.com';
  }
}

export function webSurfaceUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
