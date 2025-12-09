import {
  BarChart2,
  Bot,
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
  gradient?: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan';
}

const gradientClasses = {
  blue: 'from-blue-500 to-blue-600',
  purple: 'from-purple-500 to-purple-600',
  green: 'from-green-500 to-teal-600',
  orange: 'from-orange-500 to-red-600',
  pink: 'from-pink-500 to-purple-600',
  cyan: 'from-cyan-500 to-blue-600',
};

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
      gradient: 'blue',
    },
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutGrid className="h-5 w-5" />,
      requiresAuth: true,
      gradient: 'purple',
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: <BarChart2 className="h-5 w-5" />,
      requiresAuth: true,
      gradient: 'green',
    },
    {
      name: 'AI Portal',
      path: '/ai-portal',
      icon: <BrainCircuit className="h-5 w-5" />,
      requiresAuth: true,
      gradient: 'cyan',
    },
    {
      name: 'Agents',
      path: '/agents',
      icon: <Bot className="h-5 w-5" />,
      requiresAuth: true,
      gradient: 'pink',
    },
    {
      name: 'Multi-Agent Chat',
      path: '/multi-agent-chat',
      icon: <MessageSquare className="h-5 w-5" />,
      requiresAuth: false,
      gradient: 'blue',
    },
    {
      name: 'Workflows',
      path: '/workflows',
      icon: <GitBranch className="h-5 w-5" />,
      requiresAuth: true,
      gradient: 'purple',
    },
    {
      name: 'Tasks',
      path: '/tasks',
      icon: <CheckSquare className="h-5 w-5" />,
      requiresAuth: true,
      gradient: 'green',
    },
    {
      name: 'Workspace',
      path: '/workspace/overview',
      icon: <Briefcase className="h-5 w-5" />,
      requiresAuth: true,
      gradient: 'orange',
    },
    {
      name: 'Resources',
      path: '/resources',
      icon: <Library className="h-5 w-5" />,
      requiresAuth: true,
      gradient: 'cyan',
    },
    {
      name: 'Suggestions',
      path: '/suggestions',
      icon: <Lightbulb className="h-5 w-5" />,
      requiresAuth: true,
      gradient: 'pink',
    },
    {
      name: 'Admin',
      path: '/admin/panel',
      icon: <Shield className="h-5 w-5" />,
      requiresAuth: true,
      gradient: 'orange',
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings className="h-5 w-5" />,
      requiresAuth: true,
      gradient: 'blue',
    },
  ];

  const filteredNavItems = navItems.filter((item) => !item.requiresAuth || isAuthenticated);

  return (
    <aside
      className={`backdrop-blur-xl bg-white/5 border-r border-white/10 shadow-2xl transition-all duration-300 ${className}`}
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white hover:shadow-md'
                  }`}
                >
                  <div
                    className={`${
                      isActive
                        ? `bg-gradient-to-br ${gradientClasses[item.gradient || 'blue']} shadow-lg`
                        : 'bg-white/10 group-hover:bg-white/20'
                    } p-2 rounded-lg transition-all duration-200`}
                  >
                    {item.icon}
                  </div>
                  {layout.sidebarOpen && <span className="font-medium">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
