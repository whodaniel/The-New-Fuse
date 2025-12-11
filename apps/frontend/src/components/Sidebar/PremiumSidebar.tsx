import {
  BarChart3,
  Bot,
  Briefcase,
  Globe,
  LayoutDashboard,
  Library,
  Lock,
  LogOut,
  MessageSquare,
  Settings,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface PremiumSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const PremiumSidebar: React.FC<PremiumSidebarProps> = ({ isOpen, setIsOpen }) => {
  const { pathname } = useLocation();
  const { logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Agents', href: '/agents', icon: Bot },
    { name: 'Workflows', href: '/workflows', icon: Workflow },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Tasks', href: '/tasks', icon: Briefcase },
    { name: 'Resources', href: '/resources', icon: Library },
    { name: 'Hub', href: '/hub', icon: Globe },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Admin', href: '/admin', icon: Lock },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-72 bg-slate-950/30 backdrop-blur-2xl border-r border-white/10 z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="h-16 flex items-center px-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                The New Fuse
              </span>
            </div>
            <button
              className="ml-auto lg:hidden text-gray-400 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`}
                  />
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* User Profile / Logout */}
          <div className="p-4 border-t border-white/10 bg-black/20">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
