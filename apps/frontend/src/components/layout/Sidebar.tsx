import {
  BarChart2,
  BrainCircuit,
  Briefcase,
  CheckSquare,
  GitBranch,
  Home,
  LayoutGrid,
  Library,
  Lightbulb,
  MessageSquare,
  Settings,
  Shield,
} from 'lucide-react';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import { useAuth } from '../../providers/AuthProvider';

interface SidebarProps {
  className?: string;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  requiresAuth: boolean;
}

export function Sidebar({ className = '' }: SidebarProps) {
  const { layout } = useLayout();
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      name: 'Home',
      path: '/',
      icon: <Home className="h-5 w-5" />,
      requiresAuth: false,
    },
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutGrid className="h-5 w-5" />,
      requiresAuth: true,
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: <BarChart2 className="h-5 w-5" />,
      requiresAuth: true,
    },
    {
      name: 'AI Portal',
      path: '/ai-portal',
      icon: <BrainCircuit className="h-5 w-5" />,
      requiresAuth: true,
    },
    {
      name: 'Multi-Agent Chat',
      path: '/multi-agent-chat',
      icon: <MessageSquare className="h-5 w-5" />,
      requiresAuth: false,
    },
    {
      name: 'Workflows',
      path: '/workflows',
      icon: <GitBranch className="h-5 w-5" />,
      requiresAuth: true,
    },
    {
      name: 'Tasks',
      path: '/tasks',
      icon: <CheckSquare className="h-5 w-5" />,
      requiresAuth: true,
    },
    {
      name: 'Workspace',
      path: '/workspace/overview',
      icon: <Briefcase className="h-5 w-5" />,
      requiresAuth: true,
    },
    {
      name: 'Resources',
      path: '/resources',
      icon: <Library className="h-5 w-5" />,
      requiresAuth: true,
    },
    {
      name: 'Suggestions',
      path: '/suggestions',
      icon: <Lightbulb className="h-5 w-5" />,
      requiresAuth: true,
    },
    {
      name: 'Admin',
      path: '/admin/panel',
      icon: <Shield className="h-5 w-5" />,
      requiresAuth: true,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings className="h-5 w-5" />,
      requiresAuth: true,
    },
  ];

  const filteredNavItems = navItems.filter((item) => !item.requiresAuth || isAuthenticated);

  return (
    <aside
      className={`bg-background border-r border-border transition-all duration-300 ${className}`}
    >
      <nav className="p-4">
        <ul className="space-y-2">
          {filteredNavItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center p-2 rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {layout.sidebarOpen && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
