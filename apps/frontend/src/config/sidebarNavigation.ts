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
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import type { ComponentType } from 'react';

export interface SidebarNavChildItem {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  section: 'dashboard' | 'workspace' | 'forge' | 'nexus' | 'apex' | 'advanced';
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
// IA: Dashboard (overview), Workspace (day-to-day), Forge (build/AI), Nexus (ecosystem), Apex (governance).
export const SIDEBAR_NAVIGATION: SidebarNavItem[] = [
  // DASHBOARD: Overview & Trends
  {
    name: 'Workspace',
    href: '/dashboard',
    icon: LayoutDashboard,
    section: 'dashboard',
    access: 'authenticated',
  },
  {
    name: 'Timeline',
    href: '/timeline',
    icon: Activity,
    section: 'dashboard',
    access: 'authenticated',
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    section: 'dashboard',
    access: 'authenticated',
  },

  // WORKSPACE: Daily Operations
  {
    name: 'Chat',
    href: '/chat',
    icon: MessageSquare,
    section: 'workspace',
    access: 'authenticated',
  },
  {
    name: 'Workspace',
    href: '/workspace/overview',
    icon: Users,
    section: 'workspace',
    access: 'authenticated',
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: ClipboardList,
    section: 'workspace',
    access: 'authenticated',
  },
  {
    name: 'Suggestions',
    href: '/suggestions',
    icon: Lightbulb,
    section: 'workspace',
    access: 'authenticated',
  },

  // WORKSPACE: Daily Operations
  {
    name: 'AI Portal',
    href: '/ai-portal',
    icon: Cpu,
    section: 'forge',
    access: 'authenticated',
  },
  { name: 'Agent Fleet', href: '/agents', icon: Bot, section: 'forge', access: 'authenticated' },
  {
    name: 'Workflows',
    href: '/workflows',
    icon: Workflow,
    section: 'forge',
    access: 'authenticated',
  },

  // NEXUS: Ecosystem & Knowledge
  { name: 'Nexus 3D', href: '/nexus', icon: Network, section: 'nexus', access: 'authenticated' },
  {
    name: 'Viz Hub',
    href: '/visualizations',
    icon: Activity,
    section: 'nexus',
    access: 'authenticated',
  },
  { name: 'TNF Hub', href: '/hub', icon: Globe, section: 'nexus', access: 'authenticated' },
  {
    name: 'Marketplace',
    href: '/marketplace',
    icon: Package,
    section: 'nexus',
    access: 'public',
  },
  {
    name: 'Knowledge Hub',
    href: '/knowledge-hub',
    icon: Database,
    section: 'nexus',
    access: 'authenticated',
  },
  { name: 'MCP Hub', href: '/mcp-hub', icon: Boxes, section: 'nexus', access: 'authenticated' },
  { name: 'Docs', href: '/docs', icon: Library, section: 'nexus', access: 'public' },

  // APEX: Governance & Control
  {
    name: 'Command Core',
    href: '/command-center',
    icon: Zap,
    section: 'apex',
    access: 'authenticated',
    requiredRoles: ['SUPER_ADMIN'],
  },
  {
    name: 'Observatory',
    href: '/observatory',
    icon: Eye,
    section: 'apex',
    access: 'authenticated',
  },
  {
    name: 'Audit Logs',
    href: '/admin/audit-logs',
    icon: ScrollText,
    section: 'apex',
    access: 'authenticated',
  },
  {
    name: 'Admin',
    href: '/admin',
    icon: Shield,
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
