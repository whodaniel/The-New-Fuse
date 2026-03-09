import {
  Bell,
  Building2,
  CreditCard,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface PremiumHeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export const PremiumHeader: React.FC<PremiumHeaderProps> = ({ onMenuClick, title }) => {
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
      toast.error('Failed to logout');
    }
  };

  const handleNotificationClick = () => {
    toast('No new notifications', {
      icon: '🔔',
      style: {
        background: '#1e293b',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.1)',
      },
    });
  };

  return (
    <header
      className="sticky top-0 z-30 h-16 backdrop-blur-md bg-slate-900/50 border-b border-white/5"
      role="banner"
    >
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>

          {title && <h1 className="text-xl font-semibold text-white hidden sm:block">{title}</h1>}
        </div>

        <div className="flex items-center gap-4">
          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 focus-within:border-blue-500/50 focus-within:bg-white/10 transition-all w-64">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search anything..."
              className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 w-full"
              aria-label="Search"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNotificationClick}
              className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors relative"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            </button>

            <div className="h-8 w-px bg-white/10 mx-2" />

            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 pl-2 focus:outline-none"
                aria-haspopup="true"
                aria-expanded={isUserMenuOpen}
              >
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-400">{user?.role || 'Member'}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-2 border-slate-800 shadow-lg cursor-pointer hover:scale-105 transition-transform">
                  <span className="text-sm font-bold text-white">
                    {user?.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                  </span>
                </div>
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsUserMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-[#1e293b] border border-white/10 rounded-lg shadow-xl py-1 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-white/10 sm:hidden">
                      <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                      <p className="text-xs text-gray-400">{user?.role || 'Member'}</p>
                    </div>

                    <Link
                      to="/user/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                    <Link
                      to="/pricing"
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Billing & Plans
                    </Link>
                    <Link
                      to="/workspace/members"
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Team Management
                    </Link>
                    <Link
                      to="/workspace/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      Subscription Seats
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 text-left"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
