import React from 'react';
import { Bell, Search, Menu, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface PremiumHeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export const PremiumHeader: React.FC<PremiumHeaderProps> = ({ onMenuClick, title }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 backdrop-blur-md bg-slate-900/50 border-b border-white/5">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          {title && (
            <h1 className="text-xl font-semibold text-white hidden sm:block">
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 focus-within:border-blue-500/50 focus-within:bg-white/10 transition-all w-64">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search anything..."
              className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            </button>

            <div className="h-8 w-px bg-white/10 mx-2" />

            <div className="flex items-center gap-3 pl-2">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-400">{user?.role || 'Member'}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-2 border-slate-800 shadow-lg cursor-pointer hover:scale-105 transition-transform">
                <span className="text-sm font-bold text-white">
                  {user?.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
