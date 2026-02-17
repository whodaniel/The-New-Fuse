import {
  Activity,
  BarChart3,
  Bot,
  Briefcase,
  Bug,
  Cpu,
  Eye,
  Globe,
  Library,
  ListTree,
  Lock,
  MessageSquare,
  Network,
  Radio,
  ScrollText,
  Settings,
  Workflow,
  Wrench,
  Zap,
} from 'lucide-react';
import type { ComponentType } from 'react';

export interface SidebarNavItem {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  section: 'core' | 'control' | 'agent' | 'settings' | 'resources' | 'advanced';
  access?: 'public' | 'authenticated';
  requiredRoles?: string[];
}

// Canonical sidebar source of truth for PremiumLayout surfaces.
// V2 IA: OpenClaw-style operational menu + TNF advanced capabilities.
export const SIDEBAR_NAVIGATION: SidebarNavItem[] = [
  { name: 'Chat', href: '/chat', icon: MessageSquare, section: 'core', access: 'authenticated' },

  {
    name: 'Overview',
    href: '/overview',
    icon: BarChart3,
    section: 'control',
    access: 'authenticated',
  },
  { name: 'Channels', href: '/channels', icon: Radio, section: 'control', access: 'authenticated' },
  { name: 'Instances', href: '/instances', icon: Cpu, section: 'control', access: 'authenticated' },
  {
    name: 'Sessions',
    href: '/sessions',
    icon: Activity,
    section: 'control',
    access: 'authenticated',
  },
  { name: 'Usage', href: '/usage', icon: BarChart3, section: 'control', access: 'authenticated' },
  {
    name: 'Cron Jobs',
    href: '/cron-jobs',
    icon: ListTree,
    section: 'control',
    access: 'authenticated',
  },

  { name: 'Agents', href: '/agents', icon: Bot, section: 'agent', access: 'authenticated' },
  { name: 'Skills', href: '/skills', icon: Zap, section: 'agent', access: 'authenticated' },
  { name: 'Nodes', href: '/nodes', icon: Network, section: 'agent', access: 'authenticated' },

  { name: 'Config', href: '/config', icon: Settings, section: 'settings', access: 'authenticated' },
  { name: 'Debug', href: '/debug', icon: Bug, section: 'settings', access: 'authenticated' },
  { name: 'Logs', href: '/logs', icon: ScrollText, section: 'settings', access: 'authenticated' },

  { name: 'Docs', href: '/docs', icon: Library, section: 'resources', access: 'public' },

  {
    name: 'Command Center',
    href: '/command-center',
    icon: Wrench,
    section: 'advanced',
    access: 'authenticated',
  },
  {
    name: 'Workflows',
    href: '/workflows',
    icon: Workflow,
    section: 'advanced',
    access: 'authenticated',
  },
  {
    name: 'Resources',
    href: '/resources',
    icon: Globe,
    section: 'advanced',
    access: 'authenticated',
  },
  { name: 'Tasks', href: '/tasks', icon: Briefcase, section: 'advanced', access: 'authenticated' },
  {
    name: 'Observatory',
    href: '/observatory',
    icon: Eye,
    section: 'advanced',
    access: 'authenticated',
  },
  {
    name: 'Admin',
    href: '/admin',
    icon: Lock,
    section: 'advanced',
    access: 'authenticated',
    requiredRoles: ['SUPER_ADMIN', 'ADMIN', 'AGENCY_OWNER', 'AGENCY_ADMIN'],
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    section: 'advanced',
    access: 'authenticated',
  },
];
