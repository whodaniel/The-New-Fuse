export type ParityStatus = 'implemented' | 'partial' | 'planned';

export interface PlatformParityFeature {
  id: string;
  targetFeature: string;
  tnfRoute: string;
  status: ParityStatus;
  notes: string;
}

export const PLATFORM_PARITY_FEATURES: PlatformParityFeature[] = [
  {
    id: 'home',
    targetFeature: 'Home',
    tnfRoute: '/dashboard',
    status: 'implemented',
    notes: 'Primary dashboard landing surface.',
  },
  {
    id: 'chat',
    targetFeature: 'Chats',
    tnfRoute: '/chat',
    status: 'implemented',
    notes: 'Member chat interface with realtime flows.',
  },
  {
    id: 'channels',
    targetFeature: 'Channels',
    tnfRoute: '/channels',
    status: 'implemented',
    notes: 'Channels route aliases directly into the live TNF chat workspace.',
  },
  {
    id: 'files',
    targetFeature: 'Files',
    tnfRoute: '/files',
    status: 'implemented',
    notes:
      'Dedicated Files Workspace with indexed file search, source filtering, and resource cross-reference.',
  },
  {
    id: 'automations',
    targetFeature: 'Automations',
    tnfRoute: '/automations',
    status: 'implemented',
    notes: 'Aliased to workflow automation surfaces.',
  },
  {
    id: 'space',
    targetFeature: 'Space',
    tnfRoute: '/space',
    status: 'implemented',
    notes:
      'Dedicated Space Control with routed project views and persisted custom domain management.',
  },
  {
    id: 'skills',
    targetFeature: 'Skills',
    tnfRoute: '/skills',
    status: 'implemented',
    notes: 'Mapped to TNF resource marketplace skill browser.',
  },
  {
    id: 'tools',
    targetFeature: 'Tools',
    tnfRoute: '/tools',
    status: 'implemented',
    notes: 'Tools route aliases to TNF live resources dashboard (tool and skill catalog).',
  },
  {
    id: 'integrations',
    targetFeature: 'Integrations',
    tnfRoute: '/integrations',
    status: 'implemented',
    notes: 'Integrations route aliases to TNF live resources dashboard and integration catalog.',
  },
  {
    id: 'models',
    targetFeature: 'Models',
    tnfRoute: '/models',
    status: 'implemented',
    notes: 'Models route aliases to TNF API/model settings surface.',
  },
  {
    id: 'hosting',
    targetFeature: 'Hosting',
    tnfRoute: '/hosting',
    status: 'implemented',
    notes:
      'Dedicated Hosting Control Center with live add/remove custom domains backed by workspace domain APIs.',
  },
  {
    id: 'datasets',
    targetFeature: 'Datasets',
    tnfRoute: '/datasets',
    status: 'implemented',
    notes:
      'Dedicated Datasets Workbench with source catalog, indexed dataset browsing, and JSON export.',
  },
  {
    id: 'system',
    targetFeature: 'System',
    tnfRoute: '/system',
    status: 'implemented',
    notes: 'Mapped to system health and observability views.',
  },
  {
    id: 'terminal',
    targetFeature: 'Terminal',
    tnfRoute: '/terminal',
    status: 'implemented',
    notes: 'Mapped to terminal graph and terminal operations pages.',
  },
  {
    id: 'billing',
    targetFeature: 'Billing',
    tnfRoute: '/billing',
    status: 'implemented',
    notes: 'Mapped to membership and billing rails.',
  },
  {
    id: 'bookmarks',
    targetFeature: 'Bookmarks',
    tnfRoute: '/bookmarks',
    status: 'implemented',
    notes: 'Workspace-aware bookmark manager with live workspace bookmark APIs plus import/export.',
  },
  {
    id: 'settings',
    targetFeature: 'Settings',
    tnfRoute: '/settings',
    status: 'implemented',
    notes: 'Full settings stack already present in TNF.',
  },
];
