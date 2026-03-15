import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SIDEBAR_NAVIGATION } from '../../config/sidebarNavigation';
import { useLayout } from '../../contexts/LayoutContext';
import { useAuthorization } from '../../hooks/useAuthorization';
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

  const { hasRole } = useAuthorization();
  const navItems: NavItem[] = SIDEBAR_NAVIGATION.map((item, idx) => {
    const gradientOrder: NavItem['gradient'][] = [
      'blue',
      'purple',
      'green',
      'orange',
      'pink',
      'cyan',
    ];
    const Icon = item.icon;
    return {
      name: item.name,
      path: item.href,
      icon: <Icon className="h-5 w-5" />,
      requiresAuth: item.href !== '/',
      gradient: gradientOrder[idx % gradientOrder.length],
    };
  }).filter((item) => {
    const source = SIDEBAR_NAVIGATION.find((s) => s.href === item.path);
    if (!source?.requiredRoles || source.requiredRoles.length === 0) return true;
    return hasRole(source.requiredRoles);
  });

  const filteredNavItems = navItems.filter((item) => !item.requiresAuth || isAuthenticated);

  return (
    <aside
      className={`backdrop-blur-xl bg-transparent/5 border-r border-white/10 shadow-none transition-all duration-300 ${className}`}
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
                  className={`flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-white shadow-none'
                      : 'text-gray-300 hover:bg-transparent/10 hover:text-white hover:shadow-md'
                  }`}
                >
                  <div
                    className={`${
                      isActive
                        ? `bg-gradient-to-br ${gradientClasses[item.gradient || 'blue']} shadow-none`
                        : 'bg-transparent/10 group-hover:bg-transparent/20'
                    } p-2 rounded-md transition-all duration-200`}
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
