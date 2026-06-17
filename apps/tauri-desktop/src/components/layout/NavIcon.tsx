import {
  BarChart3,
  Bot,
  Brain,
  Globe,
  Handshake,
  Home,
  Layers,
  LayoutGrid,
  MessageSquare,
  Monitor,
  Settings,
  Sparkles,
  Store,
  Terminal,
  Workflow,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import React from 'react';

const ICON_MAP: Record<string, LucideIcon> = {
  platform: Sparkles,
  dashboard: Home,
  browser: Globe,
  agents: Bot,
  a2a: Handshake,
  knowledge: Brain,
  terminal: Terminal,
  oagi: Monitor,
  antigravity: LayoutGrid,
  chat: MessageSquare,
  workflows: Workflow,
  analytics: BarChart3,
  'web-hub': Layers,
  mcp: Store,
  settings: Settings,
};

interface NavIconProps {
  id: string;
  size?: number;
  className?: string;
}

export const NavIcon: React.FC<NavIconProps> = ({ id, size = 18, className = '' }) => {
  const Icon = ICON_MAP[id] ?? Wrench;
  return <Icon size={size} className={className} aria-hidden />;
};

export default NavIcon;
