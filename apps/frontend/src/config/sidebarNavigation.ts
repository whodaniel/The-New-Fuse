import {
  Activity,
  BarChart3,
  Bookmark,
  Bot,
  Boxes,
  Bug,
  ClipboardList,
  Cpu,
  CreditCard,
  Database,
  Eye,
  FolderOpen,
  Globe,
  LayoutDashboard,
  Library,
  Lightbulb,
  MessageSquare,
  Network,
  Package,
  ScrollText,
  Settings,
  Shield,
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
export const SIDEBAR_NAVIGATION: SidebarNavItem[] = [
  {
    name: 'Workspace',
    href: '/dashboard',
    icon: LayoutDashboard,
    section: 'workspace',
    access: 'authenticated',
    children: [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, access: 'authenticated' },
      { name: 'Timeline', href: '/timeline', icon: Activity, access: 'authenticated' },
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
      { name: 'Tasks', href: '/tasks', icon: ClipboardList, access: 'authenticated' },
      { name: 'Suggestions', href: '/suggestions', icon: Lightbulb, access: 'authenticated' },
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
  {
    name: 'Build',
    href: '/agents',
    icon: Bot,
    section: 'forge',
    access: 'authenticated',
    children: [
      { name: 'Agent Fleet', href: '/agents', icon: Bot, access: 'authenticated' },
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
      {
        name: 'Legacy PFP Studio',
        href: '/agents/pfp-studio',
        icon: Bot,
        access: 'authenticated',
      },
      {
        name: 'Legacy Prompt Catalog',
        href: '/agents/pfp-prompts',
        icon: ScrollText,
        access: 'authenticated',
      },
    ],
  },
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
      { name: 'Terminal Graph', href: '/terminals', icon: Activity, access: 'public' },
      { name: 'Docs', href: '/docs', icon: Library, access: 'public' },
      { name: 'Marketplace', href: '/marketplace', icon: Package, access: 'public' },
    ],
  },
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
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    section: 'apex',
    access: 'authenticated',
    children: [
      { name: 'General', href: '/settings', icon: Settings, access: 'authenticated' },
      { name: 'Billing', href: '/billing', icon: CreditCard, access: 'authenticated' },
      { name: 'Zo Parity', href: '/zo-parity', icon: Eye, access: 'authenticated' },
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
    description: 'Governance, admin controls, and diagnostics',
    sections: ['apex', 'advanced'],
  },
];
