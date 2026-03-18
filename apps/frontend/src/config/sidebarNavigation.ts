import {
  Activity,
  BarChart3,
  Bot,
  Boxes,
  Bug,
  ClipboardList,
  Cpu,
  Database,
  Eye,
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

export interface SidebarNavItem {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  section: 'dashboard' | 'workspace' | 'forge' | 'nexus' | 'apex' | 'advanced';
  access?: 'public' | 'authenticated';
  requiredRoles?: string[];
}

// Canonical sidebar source of truth for PremiumLayout surfaces.
// IA: Dashboard (overview), Workspace (day-to-day), Forge (build/AI), Nexus (ecosystem), Apex (governance).
export const SIDEBAR_NAVIGATION: SidebarNavItem[] = [
  // DASHBOARD: Overview & Trends
  {
    name: 'Dashboard',
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

  // FORGE: Intelligence & Building
  {
    name: 'Command Center',
    href: '/ai-command-center',
    icon: Zap,
    section: 'forge',
    access: 'authenticated',
  },
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
    name: 'TNF Control',
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
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    section: 'apex',
    access: 'authenticated',
  },
  { name: 'Debug', href: '/debug', icon: Bug, section: 'apex', access: 'authenticated' },
];
