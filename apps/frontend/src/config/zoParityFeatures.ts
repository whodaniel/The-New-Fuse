export type ParityStatus = 'implemented' | 'partial' | 'planned';

export interface ZoParityFeature {
  id: string;
  zoFeature: string;
  tnfRoute: string;
  status: ParityStatus;
  notes: string;
}

export const ZO_PARITY_FEATURES: ZoParityFeature[] = [
  {
    id: 'home',
    zoFeature: 'Home',
    tnfRoute: '/dashboard',
    status: 'implemented',
    notes: 'Primary dashboard landing surface.',
  },
  {
    id: 'chat',
    zoFeature: 'Chats',
    tnfRoute: '/chat',
    status: 'implemented',
    notes: 'Member chat interface with realtime flows.',
  },
  {
    id: 'channels',
    zoFeature: 'Channels',
    tnfRoute: '/channels',
    status: 'implemented',
    notes: 'Channels route aliases directly into the live TNF chat workspace.',
  },
  {
    id: 'files',
    zoFeature: 'Files',
    tnfRoute: '/files',
    status: 'implemented',
    notes: 'Dedicated Files Workspace with indexed file search, source filtering, and resource cross-reference.',
  },
  {
    id: 'automations',
    zoFeature: 'Automations',
    tnfRoute: '/automations',
    status: 'implemented',
    notes: 'Aliased to workflow automation surfaces.',
  },
  {
    id: 'space',
    zoFeature: 'Space',
    tnfRoute: '/space',
    status: 'implemented',
    notes: 'Dedicated Space Control with routed project views and persisted custom domain management.',
  },
  {
    id: 'skills',
    zoFeature: 'Skills',
    tnfRoute: '/skills',
    status: 'implemented',
    notes: 'Mapped to TNF resource marketplace skill browser.',
  },
  {
    id: 'tools',
    zoFeature: 'Tools',
    tnfRoute: '/tools',
    status: 'implemented',
    notes: 'Tools route aliases to TNF live resources dashboard (tool and skill catalog).',
  },
  {
    id: 'integrations',
    zoFeature: 'Integrations',
    tnfRoute: '/integrations',
    status: 'implemented',
    notes: 'Integrations route aliases to TNF live resources dashboard and integration catalog.',
  },
  {
    id: 'models',
    zoFeature: 'Models',
    tnfRoute: '/models',
    status: 'implemented',
    notes: 'Models route aliases to TNF API/model settings surface.',
  },
  {
    id: 'hosting',
    zoFeature: 'Hosting',
    tnfRoute: '/hosting',
    status: 'implemented',
    notes: 'Dedicated Hosting Control Center with live add/remove custom domains backed by workspace domain APIs.',
  },
  {
    id: 'datasets',
    zoFeature: 'Datasets',
    tnfRoute: '/datasets',
    status: 'implemented',
    notes: 'Dedicated Datasets Workbench with source catalog, indexed dataset browsing, and JSON export.',
  },
  {
    id: 'system',
    zoFeature: 'System',
    tnfRoute: '/system',
    status: 'implemented',
    notes: 'Mapped to system health and observability views.',
  },
  {
    id: 'terminal',
    zoFeature: 'Terminal',
    tnfRoute: '/terminal',
    status: 'implemented',
    notes: 'Mapped to terminal graph and terminal operations pages.',
  },
  {
    id: 'billing',
    zoFeature: 'Billing',
    tnfRoute: '/billing',
    status: 'implemented',
    notes: 'Mapped to membership and billing rails.',
  },
  {
    id: 'bookmarks',
    zoFeature: 'Bookmarks',
    tnfRoute: '/bookmarks',
    status: 'implemented',
    notes: 'Workspace-aware bookmark manager with live workspace bookmark APIs plus import/export.',
  },
  {
    id: 'settings',
    zoFeature: 'Settings',
    tnfRoute: '/settings',
    status: 'implemented',
    notes: 'Full settings stack already present in TNF.',
  },
];
