import {
  Activity,
  BarChart3,
  Bot,
  BrainCircuit,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Eye,
  Globe,
  Home,
  LayoutDashboard,
  LayoutGrid,
  Library,
  Lightbulb,
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
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

export const PremiumSidebar: React.FC<PremiumSidebarProps> = ({
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
}) => {
  const { pathname } = useLocation();
  const { logout } = useAuth();

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Command Center', href: '/command-center', icon: Zap },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'AI Portal', href: '/ai-portal', icon: BrainCircuit },
    { name: 'AI Agents', href: '/agents', icon: Bot },
    { name: 'Multi-chat', href: '/multi-agent-chat', icon: MessageSquare },
    { name: 'Live View', href: '/live-view', icon: Activity },
    { name: 'AI Command', href: '/ai-command-center', icon: Cpu },
    { name: 'Observatory', href: '/observatory', icon: Eye },
    { name: 'Workflows', href: '/workflows', icon: Workflow },
    { name: 'Tasks', href: '/tasks', icon: Briefcase },
    { name: 'Workspace', href: '/workspace/overview', icon: LayoutGrid },
    { name: 'Resources', href: '/resources', icon: Library },
    { name: 'Hub', href: '/hub', icon: Globe },
    { name: 'Suggestions', href: '/suggestions', icon: Lightbulb },
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
        className={`fixed top-0 left-0 bottom-0 bg-slate-950/30 backdrop-blur-2xl border-r border-white/10 z-50 transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-20' : 'w-72'}`}
        role="navigation"
      >
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="h-16 flex items-center px-6 border-b border-white/10">
            <div
              className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 whitespace-nowrap">
                  The New Fuse
                </span>
              )}
            </div>
            <button
              className="ml-auto lg:hidden text-gray-400 hover:text-white"
              onClick={() => setIsOpen(false)}
              aria-label="Close sidebar"
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
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.name : undefined}
                  aria-label={isCollapsed ? item.name : undefined}
                >
                  <item.icon
                    className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`}
                  />
                  {!isCollapsed && (
                    <span className="font-medium whitespace-nowrap">{item.name}</span>
                  )}
                  {isActive && !isCollapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Collapse Toggle */}
          <div className="hidden lg:flex p-4 border-t border-white/10 bg-black/20 justify-end">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors w-full flex justify-center"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* User Profile / Logout */}
          <div className="p-4 border-t border-white/10 bg-black/20">
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title={isCollapsed ? 'Sign Out' : undefined}
              aria-label={isCollapsed ? 'Sign Out' : undefined}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="font-medium whitespace-nowrap">Sign Out</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
