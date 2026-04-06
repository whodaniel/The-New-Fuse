import {
  Activity,
  BarChart3,
  Bookmark,
  Bot,
  Boxes,
  Bug,
  Building2,
  ClipboardList,
  Compass,
  Cpu,
  CreditCard,
  Database,
  Eye,
  FolderOpen,
  Globe,
  Grip,
  LayoutDashboard,
  Library,
  Lightbulb,
  Map,
  MessageSquare,
  Network,
  Package,
  Plug,
  Rocket,
  ScrollText,
  Settings,
  Shield,
  Target,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import type { ComponentType } from 'react';

export interface SidebarNavChildItem {
  name: string;
  href: string;
  icon?: ComponentType<{ className?: string }>;
  access?: 'public' | 'authenticated';
  requiredRoles?: string[];
}

export interface SidebarNavItem {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  section: 'dashboard' | 'workspace' | 'forge' | 'nexus' | 'apex' | 'advanced';
  access?: 'public' | 'authenticated';
  requiredRoles?: string[];
  children?: SidebarNavChildItem[];
}

// Canonical sidebar source of truth for PremiumLayout surfaces.
// IA: functional workspace grouping (work, build, knowledge, operations).
// Every user-navigable route in ComprehensiveRouter MUST have an entry here.
export const SIDEBAR_NAVIGATION: SidebarNavItem[] = [
  // ─────────────────────────── WORKSPACE ───────────────────────────
  {
    name: 'Workspace',
    href: '/dashboard',
    icon: LayoutDashboard,
    section: 'workspace',
    access: 'authenticated',
    children: [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, access: 'authenticated' },
      { name: 'Timeline', href: '/timeline', icon: Activity, access: 'authenticated' },
      { name: 'Macro Timeline', href: '/macro-timeline', icon: Activity, access: 'authenticated' },
      { name: 'Analytics', href: '/analytics', icon: BarChart3, access: 'authenticated' },
      {
        name: 'Dashboard Analytics',
        href: '/dashboard/analytics',
        icon: BarChart3,
        access: 'authenticated',
      },
      {
        name: 'Dashboard Architecture',
        href: '/dashboard/architecture',
        icon: Network,
        access: 'authenticated',
      },
      {
        name: 'Dashboard Observability',
        href: '/dashboard/observability',
        icon: Eye,
        access: 'authenticated',
      },
      {
        name: 'Dashboard Logs',
        href: '/dashboard/logs',
        icon: ScrollText,
        access: 'authenticated',
      },
      {
        name: 'Dashboard Settings',
        href: '/dashboard/settings',
        icon: Settings,
        access: 'authenticated',
      },
      { name: 'Chat', href: '/chat', icon: MessageSquare, access: 'authenticated' },
      {
        name: 'Workspace Chat',
        href: '/workspace-chat',
        icon: MessageSquare,
        access: 'authenticated',
      },
      {
        name: 'Multi-Agent Chat',
        href: '/multi-agent-chat',
        icon: MessageSquare,
        access: 'authenticated',
      },
      { name: 'Tasks', href: '/tasks', icon: ClipboardList, access: 'authenticated' },
      { name: 'Suggestions', href: '/suggestions', icon: Lightbulb, access: 'authenticated' },
      { name: 'Goals', href: '/goals', icon: Target, access: 'authenticated' },
      { name: 'Plans', href: '/plans', icon: Map, access: 'authenticated' },
      {
        name: 'Dashboard Agents',
        href: '/dashboard/agents',
        icon: Bot,
        access: 'authenticated',
      },
      {
        name: 'Create Dashboard Agent',
        href: '/dashboard/agents/new',
        icon: Bot,
        access: 'authenticated',
      },
      {
        name: 'Workspace Home',
        href: '/workspace/overview',
        icon: Users,
        access: 'authenticated',
      },
      {
        name: 'Workspace Analytics',
        href: '/workspace/analytics',
        icon: BarChart3,
        access: 'authenticated',
      },
      { name: 'Members', href: '/workspace/members', icon: Users, access: 'authenticated' },
      { name: 'Files', href: '/files', icon: FolderOpen, access: 'authenticated' },
      { name: 'Bookmarks', href: '/bookmarks', icon: Bookmark, access: 'authenticated' },
      { name: 'Spaces', href: '/spaces', icon: Globe, access: 'authenticated' },
      {
        name: 'Workspace Settings',
        href: '/workspace/settings',
        icon: Settings,
        access: 'authenticated',
      },
    ],
  },

  // ─────────────────────────── BUILD (FORGE) ───────────────────────────
  {
    name: 'Build',
    href: '/agents',
    icon: Bot,
    section: 'forge',
    access: 'authenticated',
    children: [
      { name: 'Agent Fleet', href: '/agents', icon: Bot, access: 'authenticated' },
      {
        name: 'Agent Builder',
        href: '/agent-builder',
        icon: Bot,
        access: 'authenticated',
      },
      {
        name: 'Agent Onboarding',
        href: '/agents/onboard',
        icon: Bot,
        access: 'authenticated',
      },
      { name: 'AI Portal', href: '/ai-portal', icon: Cpu, access: 'authenticated' },
      { name: 'Agent Profiles', href: '/agents/profiles', icon: Users, access: 'authenticated' },
      {
        name: 'NFT Marketplace',
        href: '/agents/nft-marketplace',
        icon: Package,
        access: 'authenticated',
      },
      {
        name: 'Revenue Dashboard',
        href: '/agents/revenue-dashboard',
        icon: BarChart3,
        access: 'authenticated',
      },
      { name: 'Workflows', href: '/workflows', icon: Workflow, access: 'authenticated' },
      {
        name: 'Workflow Builder',
        href: '/workflows/builder',
        icon: Workflow,
        access: 'authenticated',
      },
      {
        name: 'Advanced Builder',
        href: '/workflows/advanced-builder',
        icon: Workflow,
        access: 'authenticated',
      },
      {
        name: 'Workflow Templates',
        href: '/workflows/templates',
        icon: ScrollText,
        access: 'authenticated',
      },
      {
        name: 'Workflow Runs',
        href: '/workflows/executions',
        icon: Activity,
        access: 'authenticated',
      },
      {
        name: 'Execution Console',
        href: '/workflows/console',
        icon: Activity,
        access: 'authenticated',
      },
      { name: 'Automations', href: '/automations', icon: Workflow, access: 'authenticated' },
      { name: 'Skills', href: '/skills', icon: Zap, access: 'authenticated' },
      { name: 'Resources', href: '/resources', icon: Library, access: 'authenticated' },
      { name: 'Datasets', href: '/datasets', icon: Database, access: 'authenticated' },
      { name: 'Hosting', href: '/hosting', icon: Boxes, access: 'authenticated' },
      { name: 'PFP Studio', href: '/ai-portal/pfp-studio', icon: Bot, access: 'authenticated' },
      {
        name: 'Prompt Catalog',
        href: '/ai-portal/pfp-prompts',
        icon: ScrollText,
        access: 'authenticated',
      },
    ],
  },

  // ─────────────────────────── KNOWLEDGE (NEXUS) ───────────────────────────
  {
    name: 'Knowledge',
    href: '/hub',
    icon: Globe,
    section: 'nexus',
    access: 'authenticated',
    children: [
      { name: 'TNF Hub', href: '/hub', icon: Globe, access: 'authenticated' },
      { name: 'Nexus 3D', href: '/nexus', icon: Network, access: 'authenticated' },
      { name: 'Viz Hub', href: '/visualizations', icon: Activity, access: 'authenticated' },
      { name: 'Knowledge Hub', href: '/knowledge-hub', icon: Database, access: 'authenticated' },
      { name: 'MCP Hub', href: '/mcp-hub', icon: Boxes, access: 'authenticated' },
      { name: 'A2A Control', href: '/a2a-control', icon: Network, access: 'authenticated' },
      { name: 'Terminal Graph', href: '/terminal', icon: Activity, access: 'authenticated' },
      { name: 'Docs', href: '/docs', icon: Library, access: 'public' },
      { name: 'Marketplace', href: '/marketplace', icon: Package, access: 'public' },
      { name: 'Community', href: '/community', icon: Users, access: 'public' },
      {
        name: 'Connect Extension',
        href: '/connect',
        icon: Plug,
        access: 'authenticated',
      },
    ],
  },

  // ─────────────────────────── AGENCY ───────────────────────────
  {
    name: 'Agency',
    href: '/agency/dashboard',
    icon: Building2,
    section: 'apex',
    access: 'authenticated',
    requiredRoles: ['SUPER_ADMIN', 'AGENCY_OWNER', 'AGENCY_ADMIN', 'AGENCY_MANAGER'],
    children: [
      {
        name: 'Agency Dashboard',
        href: '/agency/dashboard',
        icon: LayoutDashboard,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN', 'AGENCY_OWNER', 'AGENCY_ADMIN', 'AGENCY_MANAGER'],
      },
      {
        name: 'Agency Onboarding',
        href: '/agency/onboard',
        icon: Rocket,
        access: 'authenticated',
      },
    ],
  },

  // ─────────────────────────── CONTROL CENTER (APEX) ───────────────────────────
  {
    name: 'Control Center',
    href: '/command-center',
    icon: Zap,
    section: 'apex',
    access: 'authenticated',
    requiredRoles: ['SUPER_ADMIN', 'ADMIN', 'AGENCY_OWNER', 'AGENCY_ADMIN'],
    children: [
      {
        name: 'Command Center',
        href: '/command-center',
        icon: Zap,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN', 'ADMIN', 'AGENCY_OWNER', 'AGENCY_ADMIN'],
      },
      {
        name: 'Observatory',
        href: '/observatory',
        icon: Eye,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN'],
      },
      {
        name: 'Audit Logs',
        href: '/admin/audit-logs',
        icon: ScrollText,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN'],
      },
      {
        name: 'System Health',
        href: '/admin/system-health',
        icon: Activity,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN'],
      },
      {
        name: 'System Metrics',
        href: '/admin/system-metrics',
        icon: BarChart3,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN'],
      },
      {
        name: 'Live View',
        href: '/live-view',
        icon: Eye,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN'],
      },
      {
        name: 'AI Command Center',
        href: '/ai-command-center',
        icon: Cpu,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN'],
      },
      {
        name: 'Platform Parity',
        href: '/platform-parity',
        icon: Grip,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        name: 'Admin Dashboard',
        href: '/admin',
        icon: Shield,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN', 'ADMIN', 'AGENCY_OWNER', 'AGENCY_ADMIN'],
      },
      {
        name: 'Super Admin Panel',
        href: '/admin/control-panel',
        icon: Shield,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN'],
      },
      {
        name: 'Users',
        href: '/admin/users',
        icon: Users,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN', 'ADMIN', 'AGENCY_OWNER', 'AGENCY_ADMIN'],
      },
      {
        name: 'User Management (Full)',
        href: '/admin/user-management',
        icon: Users,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN'],
      },
      {
        name: 'Workspaces',
        href: '/admin/workspaces',
        icon: Users,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN', 'ADMIN', 'AGENCY_OWNER', 'AGENCY_ADMIN'],
      },
      {
        name: 'Admin Marketplace',
        href: '/admin/marketplace',
        icon: Package,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN'],
      },
      {
        name: 'Agent Management',
        href: '/admin/agent-management',
        icon: Bot,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        name: 'Agent Skills',
        href: '/admin/agents/skills',
        icon: Zap,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN'],
      },
      {
        name: 'Web Search Providers',
        href: '/admin/agents/web-search',
        icon: Globe,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN'],
      },
      {
        name: 'Database',
        href: '/admin/database',
        icon: Database,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        name: 'API Analytics',
        href: '/admin/api-analytics',
        icon: BarChart3,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        name: 'Configuration',
        href: '/admin/configuration',
        icon: Settings,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        name: 'Admin Settings',
        href: '/admin/settings',
        icon: Settings,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        name: 'Admin Layout',
        href: '/admin/layout',
        icon: LayoutDashboard,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN'],
      },
      {
        name: 'Backup & Restore',
        href: '/admin/backup-restore',
        icon: ScrollText,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        name: 'OpenClaw Security',
        href: '/admin/openclaw-security',
        icon: Shield,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        name: 'Feature Flags',
        href: '/admin/feature-flags',
        icon: Zap,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN', 'ADMIN', 'AGENCY_OWNER', 'AGENCY_ADMIN'],
      },
      {
        name: 'Port Management',
        href: '/admin/port-management',
        icon: Database,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN', 'ADMIN'],
      },
    ],
  },

  // ─────────────────────────── SETTINGS ───────────────────────────
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    section: 'apex',
    access: 'authenticated',
    children: [
      { name: 'General', href: '/settings', icon: Settings, access: 'authenticated' },
      {
        name: 'General Settings',
        href: '/general-settings',
        icon: Settings,
        access: 'authenticated',
      },
      { name: 'Appearance', href: '/settings/appearance', icon: Compass, access: 'authenticated' },
      {
        name: 'Notifications',
        href: '/settings/notifications',
        icon: Activity,
        access: 'authenticated',
      },
      { name: 'Security', href: '/settings/security', icon: Shield, access: 'authenticated' },
      { name: 'API Keys', href: '/settings/api', icon: Zap, access: 'authenticated' },
      { name: 'Billing', href: '/billing', icon: CreditCard, access: 'authenticated' },
      { name: 'Profile', href: '/user/profile', icon: Users, access: 'authenticated' },
      {
        name: 'LLM Selection',
        href: '/workspace-settings/llm-selection',
        icon: Cpu,
        access: 'authenticated',
      },
      {
        name: 'Debug',
        href: '/debug',
        icon: Bug,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN'],
      },
      {
        name: 'Build Info',
        href: '/build-info',
        icon: ScrollText,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN'],
      },
      {
        name: 'Surface Map',
        href: '/all-pages',
        icon: Library,
        access: 'authenticated',
        requiredRoles: ['SUPER_ADMIN'],
      },
    ],
  },
];

export interface SidebarSectionGroup {
  id: 'core' | 'build' | 'ops';
  label: string;
  description: string;
  sections: SidebarNavItem['section'][];
}

export const SIDEBAR_SECTION_GROUPS: SidebarSectionGroup[] = [
  {
    id: 'core',
    label: 'Workspace',
    description: 'Daily execution and collaboration',
    sections: ['workspace'],
  },
  {
    id: 'build',
    label: 'Build + Knowledge',
    description: 'Build systems and navigate network intelligence',
    sections: ['forge', 'nexus'],
  },
  {
    id: 'ops',
    label: 'Operations',
    description: 'Agency, governance, admin controls, and diagnostics',
    sections: ['apex', 'advanced'],
  },
];
